
/**
 * Filters out non-alphanumeric key presses
 * @param event 
 * @returns the key that was pressed, or `undefined` if it was an invalid key that shouldn't be captured
 */
export function filterAlphanumeric(event: KeyboardEvent): string | undefined {
    const allowedPattern = /^[a-zA-Z0-9!@#\$%\^&\*\(\)\-_=\+\[\]\{\};:'",<>\.\?\/\|\\~` ]$/;
    if (allowedPattern.test(event.key) || event.key === ' ') {
        return event.key;
    }
    return undefined;
}