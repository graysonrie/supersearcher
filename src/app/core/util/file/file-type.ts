import { invoke } from '@tauri-apps/api/core';
import { fileTypeFromBuffer } from 'file-type';

export async function detectFileType(filePath: string): Promise<string | undefined> {
    const bufferSize = 512;
    const fileContent = await invoke<Uint8Array>("read_file_bytes", {
        filePath, bufferSize
    }).catch(() =>
        undefined
    )
    if (fileContent) {
        const type = await fileTypeFromBuffer(new Uint8Array(fileContent));
        console.log(type);
        return type?.mime; // e.g., 'application/pdf', 'text/plain'
    } else {
        console.log("Failed to read file when detecting file type");
        return undefined;
    }
}

export async function isFileBinary(filePath: string): Promise<boolean | undefined> {
    const bufferSize = 512;
    const fileContent = await invoke<Uint8Array>("read_file_bytes", {
        filePath, bufferSize
    }).catch(() =>
        undefined
    )

    if (fileContent) {
        const isBinary = fileContent.some((byte) => byte === 0 || (byte < 32 && byte !== 9 && byte !== 10 && byte !== 13));
        return isBinary;
    } else {
        console.log("Failed to read file when determining if file was binary");
        return undefined;
    }

}