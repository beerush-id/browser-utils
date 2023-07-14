import { ItemTypeOf } from '@beerush/reactor';
import { dash, isNumber, isObject, isString } from '@beerush/utils';

export type Unit = 'px' | '%' | 'em' | 'rem' | 'vw' | 'vh' | string;

export type StyleDeclaration = {
  [K in keyof CSSStyleDeclaration]?: string | number;
} & {
  [K in keyof CSSStyleDeclaration as `${ K }Var`]?: string | number;
}

export type CSSValueRef = {
  description?: string;
  style?: StyleDeclaration;
  children?: CSSDeclaration;
}

export type CSSDeclaration = {
  [selector: string]: CSSValueRef;
}

export type CSSDeclarationGroup = {
  [selector: string]: CSSDeclaration;
}

export type Shadow = {
  x: string;
  y: string;
  b: string;
  c: string;
  s: string;
  v: string;
};

export type Filters = {
  blur: string;
  brightness: string;
  contrast: string;
  grayscale: string;
  hueRotate: string;
  invert: string;
  opacity: string;
  saturate: string;
  sepia: string;
};

export type GradientValue = {
  stop: number;
  color: string;
  colorVar?: string;
};

export type Gradient = {
  type: 'linear' | 'radial';
  values: GradientValue[];
  angle?: number;
  shape?:
    | 'circle'
    | 'ellipse'
    | 'closest-side'
    | 'closest-corner'
    | 'farthest-side'
    | 'farthest-corner';
  value?: string;
  repeat?: boolean;
};

export type Transform = {
  x?: string;
  y?: string;
  z?: string;
};

export type ExtendedStyleDeclaration = {
  dropShadows: Shadow[];
  boxShadows: Shadow[];
  textShadows: Shadow[];

  filters: Filters;
  backdropFilters: Filters;
  gradients: Gradient[];
  backgroundClip?: boolean;
  backgroundImage?: string;
  backgroundPosition: {
    x?: string;
    y?: string;
    v?: string;
  };
  backgroundSize: {
    x?: string;
    y?: string;
    v?: string;
  };
  origin: {
    x?: string;
    y?: string;
  };
  scale: Transform;
  translate: Transform;
  rotate: Transform;
  skew: Transform;

  transitions: {
    property: string;
    duration: string;
    easing: string;
    delay: string;
  }[];
};

export const filterUnits: Filters = {
  blur: 'px',
  brightness: '',
  contrast: '%',
  grayscale: '%',
  hueRotate: 'deg',
  invert: '%',
  opacity: '%',
  saturate: '%',
  sepia: '%',
};


export type JoinClasses<A extends string[], B extends string[]> = [ ...A, ...B ];

export class ClassList<T extends string[] = string[], O extends string[] = []> {
  public get value(): string {
    return this.values.join(' ');
  }

  constructor(public values: string[] = []) {}

  public add(...classes: ItemTypeOf<T>[]): this {
    this.values.push(...classes);
    return this;
  }

  public and(condition: boolean, ...classes: ItemTypeOf<O>[]): this {
    if (condition) {
      this.values.push(...classes);
    }

    return this;
  }

  public end(): string {
    return this.value;
  }
}

/**
 * Create a **`ClassList`** object.
 * @param {string} classes
 * @returns {ClassList<R, O>}
 */
export function classes<R extends string[] = string[], O extends string[] = string[]>(...classes: R): ClassList<R, O> {
  return new ClassList(classes);
}


/**
 * Convert **`CSSDeclaration`** object to CSS String with supported nested declarations.
 *
 * @example
 * ```ts
 * const css = {
 *   'a, button': {
 *     style: {
 *       color: 'blue';
 *     },
 *     children: {
 *       '&:hover, &:focus': {
 *         color: 'var(--color-link-hover)';
 *       },
 *       'span': {
 *         display: 'block'
 *       }
 *     }
 *   }
 * }
 *
 * const cssText = stringify(css);
 * ```
 *
 * @param {CSSDeclaration} css - CSS Declaration object to be converted.
 * @param {string} space - Space to prefix each lines of the generated css.
 * @param {string} prefix - Prefix each selector with text.
 * @returns {string}
 */
export function stringify(css: CSSDeclaration, space = '', prefix?: string): string {
  if (!isObject(css)) {
    throw new Error(`Invalid CSS Declaration! Argument "css" must be a CSSDeclaration object!`);
  }

  let content = '';

  for (const [ selector, styleRef ] of Object.entries(css)) {
    if (!isObject(styleRef)) {
      throw new Error(`Invalid CSS Declaration! Value of ${ selector } must be a StyleDeclaration object!`);
    }

    const { style, children } = styleRef;

    let cssSelector = selector;

    if (isString(prefix) && prefix) {
      const selectors = splitSelector(selector);

      cssSelector = selectors.map(sel => {
        return splitSelector(prefix).map(pref => {
          return sel.startsWith('&') ? sel.replace('&', pref) : `${ pref } ${ sel }`;
        }).join(`,\r\n${ space }`);
      }).join(`,\r\n${ space }`);
    }

    if (typeof style === 'object') {
      content += `${ space }${ cssSelector } {\r\n`;

      for (const [ prop, valueRef ] of Object.entries(style)) {
        if (!isString(valueRef) && !isNumber(valueRef)) {
          throw new Error(`Invalid Style Declaration! Value of ${ prop } must be a string or number!`);
        }

        if (!prop.endsWith('Var')) {
          const variable = style[`${ prop }Var` as keyof StyleDeclaration];

          if (isString(variable)) {
            content += `${ space }  ${ dash(prop) }: var(${ variable });\r\n`;
          } else {
            content += `${ space }  ${ dash(prop) }: ${ valueRef ?? '' };\r\n`;
          }
        }
      }

      content += `${ space }}\r\n`;
    }

    if (typeof children === 'object') {
      content += `${ stringify(children, space, cssSelector) }`;
    }
  }

  return content;
}

/**
 * Convert **`CSSDeclarationGroup`** object to CSS String. Suitable for something like CSS Media Query.
 *
 * @example
 * ```ts
 * const group = {
 *   '@media (prefers-color-scheme: dark)': {
 *     'a': {
 *       style: {
 *         color: 'blue'
 *       }
 *     }
 *   }
 * }
 *
 * const css = stringifyGroup(group);
 * ```
 *
 * @param {CSSDeclarationGroup} group - CSS Declaration Group object to be converted.
 * @returns {string}
 */
export function stringifyGroup(group: CSSDeclarationGroup): string {
  let content = '';

  for (const [ selector, css ] of Object.entries(group)) {
    content += `${ selector } {\r\n`;
    content += `${ stringify(css, '  ') }`;
    content += `}\r\n`;
  }

  return content;
}

/**
 * Split CSS Selector into array.
 * @param {string} selector - A valid CSS Selector such `'a, button'`.
 * @returns {string[]}
 */
export function splitSelector(selector: string) {
  return selector.replace(/\s+/g, ' ').split(/,\s?/g);
}

/**
 * Convert **`StylerOptions`** object to CSS String.
 * @param {Filters} filters
 * @param {Shadow[]} shadows
 * @returns {{filter: string, filterVar: string}}
 */
export function joinFilters(filters: Filters, shadows: Shadow[]) {
  const activeFilters = [];

  for (const [ prop, value ] of Object.entries(filters)) {
    if (typeof value !== 'undefined' && value !== '') {
      activeFilters.push(`${ dash(prop) }(${ value }${ filterUnits[prop as never] })`);
    }
  }

  const activeShadows: {
    color: string;
    colorVar?: string;
  }[] = shadows.map(({ x, y, b, c, s, v }: Shadow) => {
    if (x && y && b && c) {
      const color = `${ x } ${ y } ${ b }${ s ? ' ' + s : '' } ${ c }`;

      if (v) {
        return { color, colorVar: `${ x } ${ y } ${ b }${ s ? ' ' + s : '' } ${ v }` };
      } else {
        return { color };
      }
    }
  }) as never;

  const filter = activeFilters.join(' ');

  const color = activeShadows
    .filter((item) => item)
    .map(({ color }) => `drop-shadow(${ color })`)
    .join(' ');
  const colorVar = activeShadows
    .filter((item) => item)
    .map((item) => `drop-shadow(${ item.colorVar || item.color })`)
    .join(' ');

  return {
    filter: [ filter, color ].filter((item) => item).join(' '),
    filterVar: [ filter, colorVar ].filter((item) => item).join(' '),
  };
}

/**
 * Convert **`StylerOptions`** object to CSS String.
 * @param {Gradient[]} gradients
 * @param {string | undefined} backgroundImage
 * @returns {string}
 */
export function joinBackgrounds({ gradients, backgroundImage }: ExtendedStyleDeclaration): string {
  for (const grad of gradients) {
    const value = gradientString(grad);

    if (grad.value !== value) {
      grad.value = value;
    }
  }

  const gradient = gradients.map((item) => item.value).join(',');
  return [ backgroundImage, gradient ].filter((item) => item).join(', ');
}

/**
 * Convert **`StylerOptions`** object to CSS String.
 * @param {Transform} scale
 * @param {Transform} rotate
 * @param {Transform} translate
 * @param {Transform} skew
 * @returns {string}
 */
export function joinTransforms({ scale, rotate, translate, skew }: ExtendedStyleDeclaration): string {
  const transforms = [];

  if (scale.x || scale.y || scale.z) {
    if (scale.z) {
      transforms.push(`scale3d(${ scale.x || 1 }, ${ scale.y || 1 }, ${ scale.z || 1 })`);
    } else {
      transforms.push(`scale(${ scale.x || 1 }, ${ scale.y || 1 })`);
    }
  }

  if (rotate.x) {
    if (!rotate.y && !rotate.z) {
      transforms.push(`rotate(${ rotate.x })`);
    } else {
      transforms.push(`rotateX(${ rotate.x })`);
    }
  }

  if (rotate.y) {
    transforms.push(`rotateY(${ rotate.y })`);
  }

  if (rotate.z) {
    transforms.push(`rotateZ(${ rotate.z })`);
  }

  if (translate.x || translate.y || translate.z) {
    transforms.push(`translate3d(${ translate.x || 0 }, ${ translate.y || 0 }, ${ translate.z || 0 })`);
  }

  if (skew.x || skew.y) {
    transforms.push(`skew(${ skew.x || 0 }, ${ skew.y || 0 })`);
  }

  return transforms.join(' ');
}

/**
 * Convert **`StylerOptions`** object to CSS String.
 * @param {"linear" | "radial"} type
 * @param {number | undefined} angle
 * @param {"circle" | "ellipse" | "closest-side" | "closest-corner" | "farthest-side" | "farthest-corner" | undefined} shape
 * @param {GradientValue[]} values
 * @returns {string}
 */
export function gradientString({ type, angle, shape, values }: Gradient): string {
  const key = type === 'linear' ? 'linear-gradient' : 'radial-gradient';
  const value = values
    .sort((a, b) => a.stop - b.stop)
    .map((item) => `${ item.color } ${ item.stop }%`)
    .join(', ');

  return `${ key }(${ type === 'linear' ? angle + 'deg' : shape }, ${ value })`;
}
