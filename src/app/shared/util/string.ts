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
