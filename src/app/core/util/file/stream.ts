import { invoke } from "@tauri-apps/api/core";

// export class FileStream {

//     filePath: string;
//     chunkSize: number;
//     loadedChunks: Map<number, Uint8Array>;
//     totalLength: number | undefined;

//     constructor(filePath: string, chunkSize: number, totalLength?: number) {
//         this.filePath = filePath;
//         this.chunkSize = chunkSize;
//         this.loadedChunks = new Map();
//         this.totalLength = totalLength; // You'll set this later if known
//     }

//     async requestDataRange(begin: number, end: number) {
//         const data = await readFileRangeBytes(this.filePath, begin, end);
//         // Ensure there were no errors
//         if (data) {
//             this.loadedChunks.set(begin, data);
//             this.onDataRange(begin, data);
//         }
//     }

//     onDataRange(begin: number, chunk: Uint8Array) {
//         // TODO: implement
//     }
// }