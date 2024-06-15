
const allowReadonlyKeys = new Set(['ArrowUp', 'ArrowRight', 'ArrowDown', 'ArrowLeft', 'Shift', 'Control ', 'Alt', 'Tab',
  'PageUp', 'PageDown', 'Home', 'End']);

export function enableReadonlyInterval() {
  const contentEditableList: HTMLElement[] = Array.from(document.querySelectorAll('[contenteditable][readonly]:not(.readonly-contenteditable-processed)'));

  for (let el of contentEditableList) {
    el.classList.add('readonly-contenteditable-processed');

    el.addEventListener('paste', event => {
      event.stopPropagation();
      event.preventDefault();
    });

    el.addEventListener('cut', event => {
      event.stopPropagation();
      event.preventDefault();
    });

    el.addEventListener('keydown', (event: KeyboardEvent) => {
      if (event.metaKey || event.ctrlKey || event.altKey || allowReadonlyKeys.has(event.key)) {
        return;
      }
      event.stopPropagation();
      event.preventDefault();
    });

    el.addEventListener('dragenter', (event: DragEvent) => {
      event.preventDefault();
    });
    el.addEventListener('dragover', (event: DragEvent) => {
      event.preventDefault();
    });
    el.addEventListener('drop', (event: DragEvent) => {
      event.preventDefault();
    });

    el.addEventListener('copy', (event: ClipboardEvent) => {
      const selection = document.getSelection();
      if (selection && selection.toString().trim() === el.textContent.trim()) {
        event.clipboardData.setData('text/plain', selection.toString().trim());
        event.preventDefault();
      }
    });
  }
}
