export type TemplateIconName = 'info' | 'alert' | 'chevron-down' | 'chevron-right' | 'search' | 'copy' | 'external-link' | 'translate';

export function templateIcon(name: TemplateIconName): string {
  return document.getElementById(`template-${name}-icon`).innerHTML;
}
