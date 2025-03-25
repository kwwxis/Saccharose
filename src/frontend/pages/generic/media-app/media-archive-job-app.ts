import { pageMatch } from '../../../core/pageMatch.ts';
import { ScriptJobPollContext } from '../../../util/ScriptJobPollContext.ts';
import { frag, frag1 } from '../../../util/domutil.ts';
import { escapeHtml } from '../../../../shared/util/stringUtil.ts';
import { genericEndpoints } from '../../../core/endpoints.ts';
import { ScriptJobState } from '../../../../backend/util/scriptJobs.ts';
import { humanTiming, timeConvert } from '../../../../shared/util/genericUtil.ts';
import { toInt } from '../../../../shared/util/numberUtil.ts';
import { toastSuccess } from '../../../util/toasterUtil.ts';

export function initiateMediaArchiveJobPage(
  vueComponentName: string,
) {
  pageMatch(`vue/${vueComponentName}`, () => {
    const jobId: string = document.querySelector('#job-id').textContent.trim();
    console.log('Job ID:', jobId);

    function refreshJobInfoContent(job: ScriptJobState<'createImageIndexArchive'>) {
      const el: HTMLElement = document.querySelector('#job-info-content');
      el.innerHTML = '';

      if (job) {
        const startTime: Date = new Date(toInt(job.run_start));
        const endTime: Date = job.run_end ? new Date(toInt(job.run_end)) : null;

        el.append(frag1(`
          <div class="content">
            <p>Query: <code>${escapeHtml(job.run_args.searchParams.query)}</code></p>
            <p>Search Mode: <code>${escapeHtml(job.run_args.searchParams.searchMode)}</code></p>
            <p>Version Filter: <code>${escapeHtml(job.run_args.searchParams.versionFilter || '(none)')}</code></p>
            <p>Start time: ${timeConvert(startTime)} (${humanTiming(startTime)})</p>
            <p>End time: ${timeConvert(endTime)} (${humanTiming(endTime)})</p>
          </div>
        `));
      } else {
        document.querySelector('#job-download').remove();
        document.querySelector('#job-log').remove();
        el.append(frag1(`
          <div class="content">
            <p>No job found for ID: <code>${escapeHtml(jobId)}</code></p>
          </div>
        `));
      }
    }

    genericEndpoints.getJob.send({ jobId }).then((job: ScriptJobState<'createImageIndexArchive'>) => {
      refreshJobInfoContent(job);
    });

    new ScriptJobPollContext<'createImageIndexArchive'>(
      jobId,
      '#job-log-content',

      (job) => {
        refreshJobInfoContent(job);
        console.log('Job complete', job);
        const resultArea = document.querySelector('#job-download-content');
        resultArea.innerHTML = '';

        let byteSize: number = job.result_data.archiveStat?.size || 0;

        let byteSizeLabel: string;
        if (byteSize === 0) {
          byteSizeLabel = `<span>Size unknown.</span>`;
        } else if (byteSize > 1_000_000) {
          byteSizeLabel = `<span><span class="code" style="font-size:0.9em">${(byteSize / 1_000_000).toFixed(2)}</span> MB</span>`;
        } else {
          byteSizeLabel = `<span><span class="code" style="font-size:0.9em">${(byteSize / 1000).toFixed(2)}</span> KB</span>`;
        }
        if (byteSize !== 0) {
          byteSizeLabel += `<span>&nbsp;(<span class="code" style="font-size:0.9em">${byteSize}</span> bytes)</span>`;
        }

        resultArea.append(frag(`
          <div class="valign">
            <a href="/redist/${job.result_data.archiveName}" role="button" class="primary">Download Now</a>
            <span class="spacer10-left">${byteSizeLabel}</span>
          </div>
          <p class="spacer10-top"><small>The download and this page will be kept for 24 hours before it expires.</small></p>
        `));

        toastSuccess({title: 'Download is ready.'});
      },
      (job) => {
        console.log('Job failed', job);
        refreshJobInfoContent(job);
      },
      () => {
        console.log('Job not found');
      }
    ).start();
  });
}
