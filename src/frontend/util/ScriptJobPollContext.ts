import { ScriptJobAction, ScriptJobState } from '../../backend/util/scriptJobs.ts';
import { genericEndpoints } from '../core/endpoints.ts';
import { escapeHtml } from '../../shared/util/stringUtil.ts';
import { constrainNumber } from '../../shared/util/numberUtil.ts';

export type ScriptJobPollPick<T extends ScriptJobAction> = Pick<ScriptJobState<T>,
  'job_id' | 'run_complete' | 'run_log' | 'run_end' | 'result_error'>;

export class ScriptJobPollContext<T extends ScriptJobAction> {
  private runLogLastSize: number = 0;
  private runLogNumTimesSameSize: number = 0;

  constructor(readonly jobId: string,
              readonly runLogOutputHtmlSelector: string,
              readonly jobCompleteCallback?: (job: ScriptJobState<T>) => void,
              readonly jobFailedCallback?: (job: ScriptJobState<T>) => void,
              readonly jobNotFoundCallback?: (jobId: string) => void,
              readonly computeMinTimeout?: (job: ScriptJobPollPick<T>, runLogEl: HTMLElement) => number,
  ) {}

  start(): void {
    // noinspection JSIgnoredPromiseFromCall
    this.poll();
  }

  private async poll() {
    const jobPoll: ScriptJobPollPick<T> = await genericEndpoints.getJob.send({
      jobId: this.jobId,
      fields: 'job_id,run_complete,run_log,run_end,result_error',
    });

    if (!jobPoll) {
      if (this.jobNotFoundCallback) {
        this.jobNotFoundCallback(this.jobId);
      }
      return;
    }

    const runLogCurrSize: number = jobPoll.run_log.length;
    const runLogEl: HTMLElement = document.querySelector(this.runLogOutputHtmlSelector);
    runLogEl.innerHTML = jobPoll.run_log.map(s => `<div>${escapeHtml(s)}</div>`).join('\n');

    if (jobPoll.result_error) {
      runLogEl.innerHTML += `<br /><br /><div>Fatal error:</div><div>${escapeHtml(jobPoll.result_error)}</div>`;
      genericEndpoints.getJob.send({ jobId: this.jobId }).then(async job => {
        console.log('Script Job Failed:', job);
        if (this.jobFailedCallback)
          this.jobFailedCallback(job);
      });
      return;
    }

    if (runLogCurrSize === this.runLogLastSize) {
      this.runLogNumTimesSameSize++;
    } else {
      this.runLogLastSize = runLogCurrSize;
      this.runLogNumTimesSameSize = 0;
    }

    const minTimeout: number = this.computeMinTimeout ? this.computeMinTimeout(jobPoll, runLogEl) : 200;
    const timeout: number = minTimeout + constrainNumber(this.runLogNumTimesSameSize * 250, 0, 5000);

    if (jobPoll.run_complete && jobPoll.run_end) {
      console.log('Script Job Poll:', jobPoll, `Next Poll: n/a (complete)`);
      genericEndpoints.getJob.send({ jobId: this.jobId }).then(async job => {
        console.log('Script Job Complete:', job);
        if (this.jobCompleteCallback)
          this.jobCompleteCallback(job);
      });
    } else {
      console.log('Script Job Poll:', jobPoll, `Next Poll: ${timeout} ms`);
      setTimeout(() => this.poll(), timeout);
    }
  }
}
