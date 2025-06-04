
/**
 * 
 * @param filePath 
 * @returns The extension of the file. In lowercase. without the '.', Or `undefined`, if a directory or badly formatted file was passed in
 */
export function getFileExtension(filePath: string): string|undefined {
    if(!filePath.includes('.')){
        return undefined;
    }
    const extension = filePath.split('.').pop();
    return extension!.toLowerCase();
}