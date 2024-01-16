import { isset } from '../../../shared/util/genericUtil.ts';
import { getHiddenElementBounds } from '../../util/domutil.ts';

export function onDropdownTriggerClick(actionEl: HTMLElement, preferredDropdownEl?: HTMLElement) {
  const dropdown: HTMLElement = isset(preferredDropdownEl)
    ? preferredDropdownEl
    : ((): HTMLElement => {
      if (actionEl.nextElementSibling?.classList.contains('.ui-dropdown')) {
        return actionEl.nextElementSibling as HTMLElement;
      }
      if (actionEl.previousElementSibling?.classList.contains('.ui-dropdown')) {
        return actionEl.previousElementSibling as HTMLElement;
      }
      if (actionEl.parentElement.querySelector('.ui-dropdown')) {
        return actionEl.parentElement.querySelector('.ui-dropdown');
      }
      throw 'No dropdown element found';
    })();

  const bounds = getHiddenElementBounds(dropdown);
  const actionElPosX = actionEl.getBoundingClientRect().left;
  const posRight: boolean = dropdown.classList.contains('right');

  if (posRight || actionElPosX + bounds.width > window.innerWidth) {
    dropdown.style.left = 'auto';
    dropdown.style.right = '0';
    dropdown.style.transformOrigin = 'right top';
  } else {
    dropdown.style.left = '0';
    dropdown.style.right = 'auto';
    dropdown.style.transformOrigin = 'left top';
  }

  if (dropdown) {
    (<any> dropdown)._toggledBy = actionEl;
    if (dropdown.classList.contains('active')) {
      dropdown.classList.remove('active');
      actionEl.classList.remove('active');
      setTimeout(() => dropdown.classList.add('hide'), 110);
    } else {
      dropdown.classList.remove('hide');
      setTimeout(() => {
        dropdown.classList.add('active');
        actionEl.classList.add('active');
      });
    }
  }
}

export function onDropdownItemClick(actionEl: HTMLElement) {
  const parentDropdown = actionEl.closest('.ui-dropdown');

  if (parentDropdown) {
    if (!!parentDropdown.querySelector('.option.selected') && actionEl.closest('.option')) {
      parentDropdown.querySelectorAll('.option.selected').forEach(el => el.classList.remove('selected'));
      actionEl.classList.add('selected');
    }

    const toggledBy: HTMLElement = (<any> parentDropdown)._toggledBy;
    if (toggledBy) {
      const labels: HTMLElement[] = [
        ... Array.from(toggledBy.querySelectorAll<HTMLElement>('.current-option')),
        ... Array.from(parentDropdown.querySelectorAll<HTMLElement>('.current-option'))
      ];
      labels.forEach(el => el.innerText = actionEl.innerText);
    }
  }

  document.querySelectorAll('.ui-dropdown.active').forEach(dropdownEl => {
    const toggledBy: HTMLElement = (<any> dropdownEl)._toggledBy;
    dropdownEl.classList.remove('active');
    if (toggledBy) {
      toggledBy.classList.remove('active');
    }
    setTimeout(() => dropdownEl.classList.add('hide'), 110);
  });
}

/**
 * Close all dropdowns that the user did not click inside.
 * @param target The clicked element
 */
export function closeDropdownsIfDefocused(target: HTMLElement) {
  // See if the user clicked inside a dropdown:
  const parentDropdownEl: HTMLElement = target.closest<HTMLElement>('.ui-dropdown');

  // Loop through all open dropdowns:
  document.querySelectorAll<HTMLElement>('.ui-dropdown.active').forEach(dropdownEl => {
    // If we clicked inside the dropdown, don't close it.
    if (dropdownEl === parentDropdownEl) {
      return;
    }

    const toggledBy = (<any>dropdownEl)._toggledBy;

    // If we clicked inside the trigger for the dropdown, don't close it.
    if (toggledBy && (toggledBy === target || toggledBy.contains(target))) {
      return;
    }

    dropdownEl.classList.remove('active');
    if (toggledBy) {
      toggledBy.classList.remove('active');
    }
    setTimeout(() => dropdownEl.classList.add('hide'), 110);
  });
}
