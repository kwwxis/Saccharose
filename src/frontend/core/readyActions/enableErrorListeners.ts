import { showJavascriptErrorDialog } from '../../util/errorHandler.ts';

export default function() {
  window.onerror = function() {
    return showJavascriptErrorDialog.apply(null, arguments);
  };

  window.addEventListener('unhandledrejection', function (event: PromiseRejectionEvent) {
    return showJavascriptErrorDialog.apply(null, [event.reason]);
  });
}
