export type OffsetRect = {
  left: number;
  top: number;
  right: number;
  bottom: number;
  width: number;
  height: number;
  centerX: number;
  centerY: number;
}

export type ScaledDOMRect = OffsetRect & {
  x: number;
  y: number;
}

/**
 * Generate a fixed positioning bounds of an element, relative to the given element, window viewport, or the parent
 * element.
 * Return an element size, and the distance between the bounding box of the element and the target element/viewport.
 * For example, left is the distance between element's left bounding with the parent/viewport left bounding.
 * @param {HTMLElement} element
 * @param {HTMLElement} relativeTo
 * @param scale
 * @returns {OffsetRect}
 */
export function offsets(element: HTMLElement, relativeTo?: HTMLElement | boolean, scale = 1): OffsetRect {
  if (relativeTo) {
    const parent: HTMLElement = typeof relativeTo === 'boolean'
                                ? element.parentElement as HTMLElement
                                : relativeTo as HTMLElement;

    if (parent && typeof parent.getBoundingClientRect === 'function') {
      const { left: eLeft, top: eTop, width, height } = scaledBoundingClientRect(element, scale);
      const { left: rLeft, top: rTop, width: rWidth, height: rHeight } = scaledBoundingClientRect(parent, scale);

      const left = Math.round(eLeft - rLeft);
      const top = Math.round(eTop - rTop);
      const right = Math.round(rWidth - (left + width));
      const bottom = Math.round(rHeight - (top + height));
      const centerX = Math.round(left + (width / 2));
      const centerY = Math.round(top + (height / 2));

      return { width, height, left, top, right, bottom, centerX, centerY };
    } else {
      throw new Error('Invalid relativeTo argument. Must be boolean or HTML Element!');
    }
  } else {
    const { left, top, right, bottom, width, height } = scaledBoundingClientRect(element, scale);
    const { innerWidth, innerHeight } = window;
    const centerX = Math.round(left + (width / 2));
    const centerY = Math.round(top + (height / 2));
    return {
      width, height, left, top, centerX, centerY,
      right: Math.round((innerWidth / scale) - right),
      bottom: Math.round((innerHeight / scale) - bottom),
    };
  }
}

/**
 * Get a scaled Bounding Client Rectangle of an element. All values will be divided by the scale, and will be rounded.
 * @param {HTMLElement} element
 * @param {number} scale
 * @returns {OffsetRect}
 */
export function scaledBoundingClientRect(element: HTMLElement, scale = 1): ScaledDOMRect {
  return scaleRect(element.getBoundingClientRect(), scale);
}

/**
 * Get a scaled Bounding Client Rectangles of an element. All values will be divided by the scale, and will be rounded.
 * @param {HTMLElement} element
 * @param {number} scale
 * @returns {ScaledDOMRect[]}
 */
export function scaledClientRects(element: HTMLElement, scale = 1): ScaledDOMRect[] {
  const scaled: ScaledDOMRect[] = [];
  const rects = element.getClientRects();

  for (let i = 0; i < rects.length; ++i) {
    scaled.push(scaleRect(rects[i], scale));
  }

  return scaled;
}

/**
 * Scale, round, and extend the given DOMRect.
 * @param {DOMRect} rect
 * @param {number} scale
 * @returns {ScaledDOMRect}
 */
export function scaleRect(rect: DOMRect, scale = 1): ScaledDOMRect {
  const { left, top, right, bottom, width, height, x, y } = rect;
  const centerX = Math.round((left / scale) + ((width / scale) / 2));
  const centerY = Math.round((top / scale) + ((height / scale) / 2));

  return {
    left: Math.round(left / scale),
    top: Math.round(top / scale),
    right: Math.round(right / scale),
    bottom: Math.round(bottom / scale),
    width: Math.round(width / scale),
    height: Math.round(height / scale),
    x: Math.round(x / scale),
    y: Math.round(y / scale),
    centerX,
    centerY,
  };
}
