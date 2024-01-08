import { closeKnex, openPg } from './db.ts';
import { Knex } from 'knex';
import { passthru, shellEscapeArg } from './shellutil.ts';
import { getNodeEnv } from '../loadenv.ts';
import { uuidv4 } from '../../shared/util/uuidv4.ts';
import { custom } from './logger.ts';
import { RequestSiteMode } from '../routing/requestContext.ts';
import { isEquiv } from '../../shared/util/arrayUtil.ts';

export interface ScriptJobPostResult<T extends ScriptJobAction> {
  message: string,
  posted: 'created_ack' | 'created_noack' | 'already_exists',
  job: ScriptJobState<T>
}

export interface ScriptJobState<T extends ScriptJobAction> {
  /**
   * Unique ID for the job.
   */
  job_id: string,

  /**
   * Indicates the job has been received (acknowledged) but is not necessarily complete yet.
   */
  run_ack: boolean,

  /**
   * Indicates the job is complete (may have been successful or errored).
   */
  run_complete: boolean,

  /**
   * Start time of the job.
   */
  run_start: number,

  /**
   * End time of the job.
   */
  run_end?: number,

  /**
   * Job action type.
   */
  run_action: T,

  /**
   * Arguments to the job.
   */
  run_args: ScriptJobInput<T>,

  /**
   * Messages while the job is running.
   *
   * Not all jobs may necessarily use/populate this field.
   */
  run_log?: string[],

  /**
   * A result message from the job when it is complete.
   *
   * Not all jobs may necessarily use/populate this field.
   * It's up to each job action to choose what to do with this.
   */
  result_msg?: string,

  /**
   * some result data from the job when it is complete.
   *
   * Not all jobs may necessarily use/populate this field.
   * It's up to each job action to choose what to do with this.
   */
  result_data?: any,

  /**
   * A result error from the job. If the job was successful, then this field will be empty.
   * Otherwise, if it failed, then this will have a message.
   */
  result_error?: string,
}

// All scripts are relative to the repository root
export const SCRIPT_JOB_ACTION_TO_SCRIPT = {
  'mwRevSave': './src/backend/mediawiki/mwRev.ts'
};

/**
 * Arguments used to start a job.
 */
export type ScriptJobActionArgs<T extends ScriptJobAction> = {
  mwRevSave: {
    siteMode: RequestSiteMode,
    pageId: number,
    resegment?: boolean,
  }
}[T];

/**
 * Types of job actions.
 */
export type ScriptJobAction = keyof typeof SCRIPT_JOB_ACTION_TO_SCRIPT;

/**
 * Arguments received by the job.
 */
export type ScriptJobInput<T extends ScriptJobAction> = ScriptJobActionArgs<T> & {
  jobId: string,
  action: T
};

export class ScriptJobsCoordinator {
  readonly MAX_JOB_RUNTIME_MS: number = 60 * 60 * 1000; // 1 hour
  private knex: Knex;
  private postQueue: {action: ScriptJobAction, args: ScriptJobActionArgs<any>, postComplete: (postResult: ScriptJobPostResult<any>) => void}[] = [];
  private postIntervalId: any = null;
  private postIntervalBusy: boolean = false;
  private debug: debug.Debugger = custom('jobs');

  constructor() {
    this.knex = openPg();
    this.postIntervalId = setInterval(() => {
      // noinspection JSIgnoredPromiseFromCall
      this.postIntervalAction();
    }, 100);
  }

  // Mark jobs that are incomplete for a while (more than 1 hour) as complete
  // Likely they failed in some way and didn't update their completion status
  async markTardyComplete() {
    await this.knex('script_jobs')
      .where('run_complete', false)
      .where('run_start', '<', Date.now() - this.MAX_JOB_RUNTIME_MS)
      .update({ run_complete: true, result_error: 'Job timed out (tardy loop)' })
      .then();
  }

  async markAllComplete() {
    await this.knex('script_jobs')
      .where('run_complete', false)
      .update({ run_complete: true, result_error: 'Job timed out (app startup cleanup)' })
      .then();
  }

  async getStatesOfAction<T extends ScriptJobAction>(action: T, completion: 'complete'|'incomplete'|'either'): Promise<ScriptJobState<T>[]> {
    const params: {run_action: T, run_complete?: boolean} = {
      run_action: action
    };
    switch (completion) {
      case 'complete':
        params.run_complete = true;
        break;
      case 'incomplete':
        params.run_complete = false;
        break;
      case 'either':
        // no-op
        break;
    }
    return await this.knex.select('*').from('script_jobs').where(params).then();
  }

  async getState<T extends ScriptJobAction>(jobId: string): Promise<ScriptJobState<T>> {
    return await this.knex.select('*').from('script_jobs').where({ job_id: jobId }).first().then();
  }

  async updateState<T extends ScriptJobAction>(jobId: string, state: Partial<ScriptJobState<T>>): Promise<ScriptJobState<T>> {
    if (!state.run_complete) {
      state.run_complete = false;
    }
    await this.knex('script_jobs')
      .where({ job_id: jobId })
      .update(state)
      .then();
    return (await this.getState(jobId)) as ScriptJobState<T>;
  }

  async post<T extends ScriptJobAction>(action: T, args: ScriptJobActionArgs<T>): Promise<ScriptJobPostResult<T>> {
    return new Promise((resolve, _reject) => {
      this.debug('Enqueued new post job');
      this.postQueue.push({
        action,
        args,
        postComplete: postResult => {
          resolve(postResult);
        }
      })
    })
  }

  private async postIntervalAction() {
    if (this.postIntervalBusy) {
      return;
    }
    this.postIntervalBusy = true;
    await this.markTardyComplete();
    try {
      const postQueueItem = this.postQueue.shift();
      if (postQueueItem) {
        this.debug('Executing post job from queue');
        const postResult = await this.postInternal(postQueueItem.action, postQueueItem.args);
        postQueueItem.postComplete(postResult);
      }
    } finally {
      this.postIntervalBusy = false;
    }
  }

  private async postInternal<T extends ScriptJobAction>(action: T, args: ScriptJobActionArgs<T>): Promise<ScriptJobPostResult<T>> {
    let script: string = SCRIPT_JOB_ACTION_TO_SCRIPT[action];

    if (!script) {
      throw 'Invalid action: ' + action;
    }

    const postDebug = custom('jobs:' + action);
    let cmd = `${process.env.NODE_COMMAND} --no-warnings=ExperimentalWarning --loader ts-node/esm`;

    if (getNodeEnv() === 'production') {
      cmd = `${process.env.NODE_COMMAND}`;
      script = script
        .replace('src/backend/', 'dist/backend/')
        .replace('.ts', '.js');
    }

    const input: ScriptJobInput<T> = Object.assign({
      jobId: uuidv4(),
      action,
    }, args);

    const incompleteJobsOfSameAction: ScriptJobState<T>[] = await this.getStatesOfAction(action, 'incomplete');
    if (incompleteJobsOfSameAction.length) {
      const myCmpArgs: any = JSON.parse(JSON.stringify(input));
      delete myCmpArgs.jobId;

      for (let otherState of incompleteJobsOfSameAction) {
        const otherCmpArgs: any = JSON.parse(JSON.stringify(otherState.run_args));
        delete otherCmpArgs.jobId;
        if (isEquiv(myCmpArgs, otherCmpArgs)) {
          return {
            message: 'A job with the same action and arguments is still running, so a new job was not created, instead the job in progress is provided in this result.',
            posted: 'already_exists',
            job: otherState
          }
        }
      }
    }

    await this.knex('script_jobs')
      .insert(<ScriptJobState<T>> {
        job_id: input.jobId,
        run_ack: false,
        run_complete: false,
        run_start: Date.now(),
        run_action: action,
        run_args: input,
      })
      .then();

    // noinspection ES6MissingAwait (no await here, detached job)
    passthru(`${cmd} ${shellEscapeArg(script)} ${shellEscapeArg(JSON.stringify(input))}`,
      child => {
        postDebug(`Spawned job ${input.jobId} with PID ` + child.pid);
      },
      data => {
        if (data.trim().length)
          postDebug(data.trim());
      },
      data => {
        if (data.trim().length)
          postDebug(data.trim());
      });

    for (let i = 0; i < 20; i++) {
      const job: ScriptJobState<T> = await this.getState(input.jobId);
      if (job && job.run_ack) {
        postDebug(`Job ${input.jobId} was acknowledged`);
        return {
          message: 'Job was created and acknowledged.',
          posted: 'created_ack',
          job: job
        };
      }
      await new Promise<void>(resolve => setTimeout(() => resolve(), 200));
    }

    await this.updateState(input.jobId, {
      run_complete: true,
      result_error: 'Job was not acknowledged'
    });

    postDebug(`Job ${input.jobId} was NOT acknowledged`);
    return {
      message: 'Job was created but not acknowledged by the job executor.',
      posted: 'created_noack',
      job: await this.getState(input.jobId)
    };
  }
}

export class ScriptJob<T extends ScriptJobAction> {
  private constructor(readonly input: ScriptJobInput<T>,
                      private _state: ScriptJobState<T>) {
    process.on('uncaughtException', (err) => {
      console.error('uncaughtException!', err);
      this.complete({
        result_error: 'Job failed due to an unhandled exception.'
      }).then(() => this.exit());
    });
    process.on('unhandledRejection', (err) => {
      console.error('unhandledRejection!', err);
      this.complete({
        result_error: 'Job failed due to an unhandled promise rejection.'
      }).then(() => this.exit());
    });
  }

  get jobId() {
    return this.input.jobId;
  }

  get state() {
    return this._state;
  }

  public static async init<T extends ScriptJobAction>(): Promise<ScriptJob<T>> {
    let input: ScriptJobInput<T>;

    try {
      input = JSON.parse(process.argv[2]);
    } catch (e) {
      throw 'Invalid input';
    }

    if (!input?.jobId) {
      throw 'Invalid input';
    }

    return new ScriptJob<T>(
      input,
      await ScriptJobCoordinator.updateState(input.jobId, { run_ack: true })
    );
  }

  async update(merge: Partial<ScriptJobState<any>>) {
    this._state = await ScriptJobCoordinator.updateState(this.jobId, merge);
  }

  async log(... args: any[]) {
    console.log(... args);
    const currMessages: string[] = this.state.run_log || [];
    currMessages.push(args.map(arg => String(arg)).join(' '));
    await this.update({
      run_log: currMessages
    });
  }

  async complete(extra?: {
    result_msg?: string,
    result_data? : any,
    result_error? : string
  }) {
    await this.update(Object.assign({
      run_complete: true,
      run_end: Date.now(),
    }, extra || {}));
  }

  async exit() {
    await closeKnex();
    process.exit(0);
  }
}

export const ScriptJobCoordinator: ScriptJobsCoordinator = new ScriptJobsCoordinator();
