import { HtmlValidate, Message } from 'html-validate';

const htmlvalidate = new HtmlValidate();

export interface Report {
  valid: boolean;
  messages: Message[];
  errorCount: number;
  warningCount: number;
}

export function validateHTML(html: string): Report {
  const report = htmlvalidate.validateString(html);

  return {
    valid: report.valid,
    messages: (report.results && report.results.length ? report.results[0].messages : null) || [],
    errorCount: report.errorCount,
    warningCount: report.warningCount,
  };
}