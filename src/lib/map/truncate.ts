/**
 * Vietnamese-aware abbreviation map.
 * Used to shorten the second part of "X & Y" style names.
 */
const ABBREVIATIONS: Record<string, string> = {
  'Giải trí': 'GT',
  'Đời sống': 'ĐS',
  'Sản phẩm': 'SP',
  'Quốc tế': 'QT',
  'Esports': 'Esports',
  'Thể thao': 'TT',
  'Công nghệ': 'CN',
  'Văn hóa': 'VH',
  'Giáo dục': 'GD',
};

/**
 * Abbreviate a Vietnamese phrase using known mappings.
 * Falls back to first-letter-of-each-word.
 */
function getAbbreviation(text: string): string {
  for (const [phrase, abbr] of Object.entries(ABBREVIATIONS)) {
    if (text.includes(phrase)) {
      return text.replace(phrase, abbr);
    }
  }
  return text
    .split(' ')
    .map(w => w.charAt(0).toUpperCase())
    .join('');
}

/**
 * Truncate label to fit inside bubble.
 *
 * Rules:
 * 1. If name ≤ maxChars → keep as-is
 * 2. If has "&" or "và" → keep first part + abbreviate second
 * 3. Fallback: word-boundary cut + ".."
 *
 * Full name is always available in the hover tooltip.
 */
export function truncateBubbleLabel(fullName: string, maxChars: number): string {
  if (maxChars === 0) return '';
  if (fullName.length <= maxChars) return fullName;

  // Strategy 1: Split on "&" or "và"
  const separators = [' & ', ' và '];
  for (const sep of separators) {
    const idx = fullName.indexOf(sep);
    if (idx !== -1) {
      const firstPart = fullName.substring(0, idx);
      const secondPart = fullName.substring(idx + sep.length);

      // Try abbreviated form: "Văn hóa & GT"
      const firstAbbr = getAbbreviation(firstPart);
      const secondAbbr = getAbbreviation(secondPart);

      // Try: abbreviated first + & + abbreviated second
      const fullyAbbr = firstAbbr + ' & ' + secondAbbr;
      if (fullyAbbr.length <= maxChars) return fullyAbbr;

      // Try: first part + & + abbreviated second
      const halfAbbr = firstPart + ' & ' + secondAbbr;
      if (halfAbbr.length <= maxChars) return halfAbbr;

      // Try: just first part
      if (firstPart.length <= maxChars) return firstPart;

      // Try: abbreviated first part only
      if (firstAbbr.length <= maxChars) return firstAbbr;
    }
  }

  // Strategy 2: Apply known abbreviations directly
  for (const [phrase, abbr] of Object.entries(ABBREVIATIONS)) {
    if (fullName.includes(phrase)) {
      const replaced = fullName.replace(phrase, abbr);
      if (replaced.length <= maxChars) return replaced;
    }
  }

  // Strategy 3: Word boundary truncate
  const words = fullName.split(' ');
  let result = '';
  for (const word of words) {
    const candidate = result ? result + ' ' + word : word;
    if (candidate.length > maxChars - 2) break;
    result = candidate;
  }
  return result ? result + '..' : fullName.substring(0, maxChars - 2) + '..';
}
