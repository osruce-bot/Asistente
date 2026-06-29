/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Formats a date string from YYYY-MM-DD to DD-MM-YYYY.
 */
export function formatToDDMMYYYY(dateStr: string | undefined | null): string {
  if (!dateStr) return '--';
  const cleanStr = dateStr.trim();
  // Match YYYY-MM-DD
  const yyyymmddRegex = /^(\d{4})-(\d{2})-(\d{2})$/;
  const match = cleanStr.match(yyyymmddRegex);
  if (match) {
    const [, year, month, day] = match;
    return `${day}-${month}-${year}`;
  }
  // Match YYYY-MM (e.g., filterMonth)
  const yyyymmRegex = /^(\d{4})-(\d{2})$/;
  const matchYM = cleanStr.match(yyyymmRegex);
  if (matchYM) {
    const [, year, month] = matchYM;
    return `${month}-${year}`;
  }
  return dateStr;
}

/**
 * Gets today's date in YYYY-MM-DD format based on local time (PE / Lima).
 */
export function getLocalDateString(): string {
  const d = new Date();
  // Adjust to Peruvian time if needed, but standard local Date works for client-side
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}
