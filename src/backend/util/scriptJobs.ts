import { closeKnex, openPg } from './db.ts';
import { Knex } from 'knex';
import { passthru, shellEscapeArg } from './shellutil.ts';
import { getNodeEnv } from '../loadenv.ts';
import { uuidv4 } from '../../shared/util/uuidv4.ts';
import { custom } from './logger.ts';
import { RequestSiteMode } from '../routing/requestContext.ts';

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
  private knex: Knex;

  constructor() {
    this.knex = openPg();
  }

  async getState<T extends ScriptJobAction>(jobId: string): Promise<ScriptJobState<T>> {
    return await this.knex.select('*').from('script_jobs').where({ job_id: jobId }).first().then();
  }

  async updateState<T extends ScriptJobAction>(jobId: string, state: Partial<ScriptJobState<T>>): Promise<ScriptJobState<T>> {
    await this.knex('script_jobs')
      .where({ job_id: jobId })
      .update(state)
      .then();
    return this.getState(jobId);
  }

  async post<T extends ScriptJobAction>(action: T, args: ScriptJobActionArgs<T>): Promise<ScriptJobState<T>> {
    let script: string = SCRIPT_JOB_ACTION_TO_SCRIPT[action];

    if (!script) {
      throw 'Invalid action: ' + action;
    }

    const debug = custom('jobs:' + action);
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
        debug(`Spawned job ${input.jobId} with PID ` + child.pid);
      },
      data => {
        if (data.trim().length)
          debug(data.trim());
      },
      data => {
        if (data.trim().length)
          debug(data.trim());
      });

    for (let i = 0; i < 20; i++) {
      const job: ScriptJobState<T> = await this.get(input.jobId);
      if (job && job.run_ack) {
        return job;
      }
      await new Promise<void>(resolve => setTimeout(() => resolve(), 200));
    }

    await this.updateState(input.jobId, {
      run_complete: true,
      result_error: 'Job was not acknowledged'
    });

    return await this.get(input.jobId);
  }

  async get<T extends ScriptJobAction>(jobId: string): Promise<ScriptJobState<T>> {
    return this.knex.select('*').from('script_jobs').where({job_id: jobId}).first().then();
  }
}

export class ScriptJob<T extends ScriptJobAction> {
  private constructor(readonly input: ScriptJobInput<T>,
                      private _state: ScriptJobState<T>) {
    process.on('uncaughtException', (err) => {
      console.error('uncaughtException!', err);
      this.complete({
        result_msg: 'Unhandled exception!',
        result_error: 'Unhandled exception!',
      });
    });
    process.on('unhandledRejection', (err) => {
      console.error('unhandledRejection!', err);
      this.complete({
        result_msg: 'Unhandled rejection!',
        result_error: 'Unhandled rejection!',
      });
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

  complete(extra?: {
    result_msg?: string,
    result_data? : any,
    result_error? : string
  }) {
    this.update(Object.assign({
      run_complete: true,
      run_end: Date.now(),
    }, extra || {}))
      .then(() => closeKnex())
      .then(() => process.exit(0));
  }
}

export const ScriptJobCoordinator: ScriptJobsCoordinator = new ScriptJobsCoordinator();