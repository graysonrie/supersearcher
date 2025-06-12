export function capitalizeFirstLetter(word: string) {
  if (!word) return ""; // Handle empty strings
  return word.charAt(0).toUpperCase() + word.slice(1);
}

export function rangeToLastPeriod(text: string): {
  start: number;
  end: number;
} {
  const lastPeriod = text.lastIndexOf(".");
  if (lastPeriod <= 1) {
    return { start: 0, end: text.length };
  } else {
    return { start: 0, end: lastPeriod };
  }
}

export const isLetter = (char: string) => {
  return /^[a-zA-Z]$/.test(char);
};

/**
 *
 * @param path
 * @returns true if the second character in the string is a colon
 */
export function isADiskDrive(path: string) {
  return path.charAt(1) == ":";
}

export function replaceBacklashesWithForwardSlashes(text: string) {
  return text.replace(/\\/g, "/");
}

export function removeNonAlphanumericCharacters(text: string) {
  return text.replace(/[^a-zA-Z0-9\-\/:_]/g, "");
}
