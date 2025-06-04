
export function simplifyPath(filePath: string) {
    // Split the path by backslashes
    const parts = filePath.split('\\');

    // Check if there are enough parts to transform
    if (parts.length > 2) {
        // Create the simplified path with the first and last parts
        return `${parts[0]}\\${parts[1]}\\...\\${parts[parts.length - 1]}`;
    } else {
        // If not enough parts, return the path as is
        return filePath;
    }
}
