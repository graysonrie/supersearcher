/** Returns the icon of a file as a string or undefined if the file type is not supported */
export function getIconFromPath(path: string): string | undefined {
    const ext = getFileExtension(path);
    switch (ext) {
        case 'png':
            return "png";
        case 'jpg':
            return "jpg";
        case 'txt':
            return "txt";
        case 'zip':
            return "zip";
        case 'xlsx':
            return "excel";
        case 'json':
            return "json";
        case 'csv':
            return "csv";
        case 'docx':
        case 'dotm':
            return "word";
        case 'md':
            return 'markdown'
        case 'pdf':
            return 'pdf'
    }
    return undefined;
}

function getFileExtension(filePath: string) {
    const parts = filePath.split('.');
    return parts.length > 1 ? parts.pop() : '';
}