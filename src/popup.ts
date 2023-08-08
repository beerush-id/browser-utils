import { offsets, scaledBoundingClientRect } from './rectangle.js';
import { style } from './style.js';

export type DirectionX = 'before' | 'after' | 'between' | 'left' | 'right';
export type DirectionY = 'above' | 'below' | 'between' | 'top' | 'bottom';

export type PopupOptions = {
  /** HTML Element to apply the styles to */
  element: HTMLElement;
  /** HTML Element to apply the relative styles from */
  parent: HTMLElement;
  /** The horizontal position of the element from the parent */
  xDir?: DirectionX;
  /** The vertical position of the element from the parent */
  yDir?: DirectionY;
  /** The scale factor if the element is scaled */
  scale?: number;
  /** Swap the position if the given position will cause out of bounds */
  swap?: boolean;
  /** Space (margin) to apply to the element position after positioned relative to the parent */
  space?: number;
  observe?: boolean;
};

export type CreatePopupOptions = {
  action: 'hover' | 'click';
  options: PopupOptions;
  container?: string;
  overlay?: HTMLElement;
}

export type CreateDialogOptions = {
  container?: string;
  overlay?: HTMLElement;
}

export type PopupInstance = {
  show: (e?: MouseEvent, cb?: (t: 'open' | 'close', e?: MouseEvent) => void) => void;
  hide: (e?: MouseEvent, cb?: (t: 'open' | 'close', e?: MouseEvent) => void) => void;
  update: (options: CreatePopupOptions) => void;
  destroy: () => void;
  disconnect?: () => void;
};

const observers = new WeakMap<HTMLElement, ResizeObserver>();

/**
 * Apply a fixed position bounds of the given element, relative to the given parent element.
 * @param {PopupOptions} options - The popup options.
 */
export function popup(options: PopupOptions) {
  const {
    element,
    parent,
    xDir = 'between',
    yDir = 'below',
    scale = 1,
    swap = true,
    space = 8,
  } = options;
  if (!element || !parent) {
    console.warn(
      'Popup ignored because the given element/parent in the options is not an HTML Element.'
    );
    return;
  }

  const { innerWidth, innerHeight } = window;
  const { width: elWidth, height: elHeight } = scaledBoundingClientRect(element, scale);
  const { left, top, right, bottom, width, height, centerX, centerY } = offsets(
    parent,
    false,
    scale
  );

  const styles: Partial<CSSStyleDeclaration> = {};
  let tx = '0';
  let ty = '0';

  if (xDir === 'before') {
    const offSide = right + elWidth < 0;

    if (offSide) {
      if (swap) {
        styles.left = `${ left + width }px`;
      } else {
        styles.left = '0';
      }

      styles.marginLeft = `${ space }px`;
      element.classList.add('x-after');
    } else {
      styles.right = `${ right + width }px`;
      styles.marginRight = `${ space }px`;
      element.classList.add('x-before');
    }
  } else if (xDir === 'after') {
    const offSide = left + elWidth > innerWidth;

    if (offSide) {
      if (swap) {
        styles.right = `${ right + width }px`;
      } else {
        styles.right = '0';
      }

      styles.marginRight = `${ space }px`;
      element.classList.add('x-before');
    } else {
      styles.left = `${ left + width }px`;
      styles.marginLeft = `${ space }px`;
      element.classList.add('x-after');
    }
  } else if (xDir === 'between') {
    const offsideLeft = centerX - elWidth / 2 < 0;
    const offsideRight = centerX + elWidth / 2 > innerWidth;

    if (offsideLeft) {
      styles.left = `${ space }px`;
      styles.maxWidth = `${ innerWidth - space * 2 }px`;
      element.classList.add('x-screen-left');
    } else if (offsideRight) {
      styles.right = `${ space }px`;
      styles.maxWidth = `${ innerWidth - space * 2 }px`;
      element.classList.add('x-screen-right');
    } else {
      styles.left = `${ centerX }px`;
      tx = '-50%';
      element.classList.add('x-between');
    }
  } else if (xDir === 'left') {
    styles.left = `${ left }px`;
    element.classList.add('x-left');
  } else if (xDir === 'right') {
    styles.right = `${ right }px`;
    element.classList.add('x-right');
  }

  if (yDir === 'above') {
    const offSide = bottom + elHeight < 0;

    if (offSide) {
      if (swap) {
        styles.top = `${ top + height }px`;
      } else {
        styles.top = '0';
      }

      styles.marginTop = `${ space }px`;
      element.classList.add('y-below');
    } else {
      styles.bottom = `${ bottom + height }px`;
      styles.marginBottom = `${ space }px`;
      element.classList.add('y-above');
    }
  } else if (yDir === 'below') {
    const offSide = top + elHeight > innerHeight;

    if (offSide) {
      if (swap) {
        styles.bottom = `${ bottom + height }px`;
        element.classList.add('y-below');
      } else {
        styles.bottom = '0';
      }

      styles.marginBottom = `${ space }px`;
      element.classList.add('y-above');
    } else {
      styles.top = `${ top + height }px`;
      styles.marginTop = `${ space }px`;
      element.classList.add('y-below');
    }
  } else if (yDir === 'between') {
    const offsideTop = centerY - elHeight / 2 < 0;
    const offsideBottom = centerY + elHeight / 2 > innerHeight;

    if (offsideTop) {
      styles.top = `${ space }px`;
      styles.maxHeight = `${ innerHeight - space * 2 }px`;
      element.classList.add('y-screen-top');
    } else if (offsideBottom) {
      styles.bottom = `${ space }px`;
      styles.maxHeight = `${ innerHeight - space * 2 }px`;
      element.classList.add('y-screen-bottom');
    } else {
      styles.top = `${ centerY }px`;
      ty = '-50%';
      element.classList.add('y-between');
    }
  } else if (yDir === 'top') {
    styles.top = `${ top }px`;
    element.classList.add('y-top');
  } else if (yDir === 'bottom') {
    styles.bottom = `${ bottom }px`;
    element.classList.add('y-bottom');
  }

  styles.transform = `translate3d(${ tx }, ${ ty }, 0)`;
  style(element, styles);
}

/**
 * Move the given element to the given slot, and apply the Popup positions.
 * @param {string} slot - String as the document query selector.
 * @param {PopupOptions} options - The popup options.
 * @param debounce - Delay before applying the styles.
 */
export function popTo(slot: string, options: PopupOptions, debounce?: number) {
  const { element, observe } = options;

  if (!element) {
    console.warn('Popup ignored because the given element in the options is not an HTML Element.');
    return;
  }

  const apply = () => {
    if (typeof debounce === 'number') {
      setTimeout(() => {
        popup(options);
      }, debounce);
    } else {
      popup(options);
    }
  };

  const wrapper = document.querySelector(slot);

  if (wrapper) {
    wrapper.appendChild(element);
  } else {
    document.body.appendChild(element);
  }

  apply();

  if (observe) {
    let { innerWidth, innerHeight } = window;
    let caller: number;

    const observer = new ResizeObserver(() => {
      if (caller) {
        clearTimeout(caller);
      }

      caller = setTimeout(() => {
        const { innerWidth: width, innerHeight: height } = window;

        if (width !== innerWidth || height !== innerHeight) {
          innerWidth = width;
          innerHeight = height;
          apply();
        }
      }, 300) as never;
    });

    observer.observe(document.body);
    observers.set(element, observer);
  }
}

/**
 * Restore the element node to its parent node.
 * @param {PopupOptions} options
 * @param {number} debounce
 */
export function restore(options: PopupOptions, debounce?: number) {
  const { element, parent } = options;

  if (!element || !parent) {
    console.warn(
      'Popup ignored because the given element/parent in the options is not an HTML Element.'
    );
    return;
  }

  element.removeAttribute('style');

  if (typeof debounce === 'number') {
    setTimeout(() => {
      parent.appendChild(element);
    }, debounce);
  } else {
    parent.appendChild(element);
  }

  const observer = observers.get(element);
  if (observer) {
    observer.disconnect();
    observers.delete(element);
  }
}

/**
 * Move the given element to the given target.
 * @param {HTMLElement | string} target
 * @param {HTMLElement} element
 */
export function appendTo(target: HTMLElement | string, element: HTMLElement) {
  if (typeof target === 'string') {
    const wrapper = document.querySelector(target);

    if (wrapper) {
      wrapper.appendChild(element);
    } else {
      document.body.appendChild(element);
    }
  } else {
    target.appendChild(element);
  }
}

/**
 * Create a popup instance.
 * @param {HTMLElement} element
 * @param {CreatePopupOptions} config
 * @returns {PopupInstance}
 */
export function createPopup(element: HTMLElement, config: CreatePopupOptions): PopupInstance {
  let { action, container = 'body', overlay } = config;

  const parent = element.parentElement as HTMLElement;
  const options = { ...config.options, element: element, parent } as PopupOptions;

  const show = (e?: MouseEvent, cb?: (t: 'open' | 'close', e?: MouseEvent) => void) => {
    if (overlay) {
      overlay.addEventListener('click', hide);

      appendTo(container, overlay);
    }

    popTo(container, options);

    if (action === 'click' && !overlay) {
      parent.style.pointerEvents = 'none';

      setTimeout(() => {
        window.addEventListener('click', hide);
      }, 100);
    }

    if (typeof cb === 'function') {
      cb('open', e);
    }
  };

  const hide = (e?: MouseEvent, cb?: (t: 'open' | 'close', e?: MouseEvent) => void) => {
    if (overlay) {
      overlay.removeEventListener('click', hide);

      appendTo(parent, overlay);
    }

    restore(options);

    if (action === 'click' && !overlay) {
      parent.style.removeProperty('pointer-events');

      setTimeout(() => {
        window.removeEventListener('click', hide);
      }, 100);
    }

    if (typeof cb === 'function') {
      cb('close', e);
    }
  };

  const disconnect = () => {
    parent.removeEventListener('mouseenter', show);
    parent.removeEventListener('mouseleave', hide);
    parent.removeEventListener('click', show);
    parent.removeEventListener('click', hide);
    window.removeEventListener('click', hide);
  };

  if (action === 'hover') {
    parent.addEventListener('mouseenter', show);
    parent.addEventListener('mouseleave', hide);
    parent.addEventListener('click', hide);
  } else if (action === 'click') {
    parent.addEventListener('click', show);
  }

  return {
    show,
    hide,
    disconnect,
    update(cfg: CreatePopupOptions) {
      action = cfg.action;
      overlay = cfg.overlay;
      container = cfg.container || 'body';
    },
    destroy() {
      disconnect();
      element.remove();

      if (overlay) {
        overlay.remove();
      }
    }
  };
}

/**
 * Create a dialog instance.
 * @param {HTMLElement} element
 * @param {CreateDialogOptions} options
 * @returns {PopupInstance}
 */
export function createDialog(element: HTMLDialogElement, options: CreateDialogOptions): PopupInstance {
  let { container = '.dialog-container', overlay } = options;
  const parent = element.parentElement as HTMLDialogElement;

  const show = (e?: MouseEvent, cb?: (t: 'open' | 'close', e?: MouseEvent) => void) => {
    if (overlay) {
      appendTo(container, overlay);
    }

    if (element instanceof HTMLDialogElement) {
      element.showModal();
    } else {
      appendTo(container, element);
    }

    if (typeof cb === 'function') {
      cb('open', e);
    }
  };

  const hide = (e?: MouseEvent, cb?: (t: 'open' | 'close', e?: MouseEvent) => void) => {
    if (overlay) {
      appendTo(parent, overlay);
    }

    if (element instanceof HTMLDialogElement) {
      element.close();
    } else {
      appendTo(parent, element);
    }

    if (typeof cb === 'function') {
      cb('close', e);
    }
  };

  const cleanup = () => {
    if (overlay) {
      appendTo(parent, overlay);
    }
  };

  const backdropClick = (e: MouseEvent) => {
    if (isBackdropClick(e)) {
      hide(e);
    }
  };

  if (element instanceof HTMLDialogElement) {
    element.addEventListener('close', cleanup);
    element.addEventListener('click', backdropClick);
  }

  return {
    show, hide,
    update(cfg: CreatePopupOptions) {
      overlay = cfg.overlay;
      container = cfg.container || '.dialog-container';
    },
    destroy() {
      element.remove();
      element.removeEventListener('close', cleanup);
      element.removeEventListener('click', backdropClick);

      if (overlay) {
        overlay.remove();
      }
    }
  };
}

export function isBackdropClick(event: MouseEvent): boolean {
  const target = event.target as HTMLElement;

  if (target) {
    const rect = target.getBoundingClientRect();
    return (rect.left > event.clientX || rect.right < event.clientX) || (rect.top > event.clientY || rect.bottom < event.clientY);
  }

  return false;
}
