/**
 * Copy text or object to clipboard. When copying a javascript object, it will be converted to a JSON.
 * @param value
 * @returns {Promise<void>}
 */
export function copy(value: unknown): Promise<void> {
  const text: string = typeof value === 'object' ? JSON.stringify(value) : String(value);
  return navigator.clipboard.writeText(text);
}
