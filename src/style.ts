/**
 * Apply CSS Style Declarations to the given element.
 * @param {HTMLElement} element - HTML Element to apply the styles to.
 * @param {Partial<CSSStyleDeclaration>} styles - CSS Style Declarations.
 * @param {boolean} reset - Set `true` to reset the current styles before applying new styles.
 */
export function style(element: HTMLElement, styles: Partial<CSSStyleDeclaration>, reset?: boolean) {
  if (reset) {
    element.removeAttribute('style');
  }

  for (const [ key, value ] of Object.entries(styles)) {
    let val = typeof value === 'number' ? (value > 0 ? `${ value }px` : `${ value }`) : value;

    if (val) {
      element.style[key as never] = value as never;
    }
  }
}
