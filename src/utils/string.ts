/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Capitalizes the first letter of each word in a string, preserving spacing.
 * Handles Spanish accented letters (á, é, í, ó, ú, ñ) correctly.
 */
export function capitalizeWords(str: string): string {
  if (!str) return str;
  return str
    .split(/(\s+)/)
    .map((part) => {
      if (/^\s+$/.test(part)) return part;
      return part.charAt(0).toUpperCase() + part.slice(1);
    })
    .join('');
}
