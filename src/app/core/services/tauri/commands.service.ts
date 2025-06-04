import { Injectable } from "@angular/core";
import { listen, UnlistenFn } from "@tauri-apps/api/event";
import { GetFilesParamsDTO } from "@core/dtos/get-files-params-dto";
import { FileModel, newDefaultFileModel } from "../../models/file-model";
import { InvokeArgs, InvokeOptions } from "@tauri-apps/api/core";
import { DriveModel } from "../../models/drive-model";
import { InlineQueryDTO } from "@core/dtos/inline-query-dto";
import { SearchParamsDTO } from "@core/dtos/search-params-dto";
import { StreamingSearchParamsDTO } from "@core/dtos/streaming-search-params-dtos";
import { AddToCrawlerQueueDTO } from "@core/dtos/add-to-crawler-queue-dto";
import { IndexedDirModel } from "../../models/indexed-dir-model";

import { SafeInvokeService } from "./safe-invoke.service";
import { EmitMetadataModel } from "@core/models/emit-metadata-model";
import { SystemInfoModel } from "@core/models/system-info-model";
import { KvSubscriptionModel } from "@core/models/kv-subscription-model";
import { GetIconDTO } from "@core/dtos/get-icon-dto";
@Injectable({ providedIn: "root" })
export class TauriCommandsService {
  private currentFileModelListener: UnlistenFn | null = null;
  constructor(private safeinvokeService: SafeInvokeService) { }

  async invokeSafe<T>(
    cmd: string,
    args?: InvokeArgs,
    options?: InvokeOptions
  ): Promise<T> {
    return await this.safeinvokeService.invokeSafe<T>(cmd, args, options);
  }

  async getFilesAsModels(
    directory: string,
    onEventEmit: (file: FileModel) => void,
    params: GetFilesParamsDTO
  ) {
    let filesEmitted = 0;
    const unlisten = await listen<FileModel>("sys_file_model", (event) => {
      //const model: FileModel = newDefaultFileModel();
      onEventEmit(event.payload);
      filesEmitted++;
    });
    const start = Date.now();
    try {
      console.log("Invoked get files")
      await this.invokeSafe("get_files_as_models", { directory, params });
    } catch (err) {
      throw new Error(`${err}`);
    } finally {
      unlisten();
    }
    console.log(`Files emitted: ${filesEmitted}`);
    console.log(`Getting files took ${Date.now() - start}ms`)
  }

  async formatPathIntoDir(path: string): Promise<string> {
    return await this.invokeSafe<string | undefined>("format_path_into_dir", {
      path: path,
    }).then((newPath) => {
      return newPath === undefined ? path : newPath;
    });
  }

  async getDirectoryPath(filePath: string): Promise<string> {
    return this.invokeSafe<string>("get_directory_path", {
      filePath,
    }).then((path) => path);
  }

  async getRootPath(filePath: string): Promise<string> {
    return this.invokeSafe<string>("get_root_path", {
      filePath,
    }).then((path) => path);
  }

  async getParentDirectory(filePath: string): Promise<string> {
    return this.invokeSafe<string>("get_parent_directory", {
      filePath,
    }).then((path) => path);
  }

  /**
   * Runs the command prompt command to open the given file in its default environment
   * @param filePath
   * @returns `true` if the operation was successful
   */
  async openFile(filePath: string): Promise<boolean> {
    return this.invokeSafe<void>("open_file", {
      filePath,
    })
      .then(() => true)
      .catch(() => false);
  }

  /**
   * Keep in mind that this function will read the entire contents of the file into memory and return it
   * @param filePath
   * @returns
   */
  async readFile(filePath: string): Promise<string | undefined> {
    let error = "";
    const fileContent = await this.invokeSafe<string>("read_file", {
      filePath,
    }).catch((err) => (error = err));
    if (fileContent) {
      return fileContent;
    }
    console.log(`Unable to read contents of file: ${error}`);
    return undefined;
  }

  /**
   *
   * @param filePath
   * @param start The byte to start reading at
   * @param length How many bytes to read
   * @returns The UTF8 encoded content of the file range
   */
  async readFileRange(
    filePath: string,
    start: number,
    length: number
  ): Promise<string | undefined> {
    let error = "";
    const fileContent = await this.invokeSafe<string>("read_file_range", {
      filePath,
      start,
      length,
    }).catch((err) => (error = err));
    if (fileContent) {
      return fileContent;
    }
    console.log(`Unable to read contents of file: ${error}`);
    return undefined;
  }

  /**
   *
   * @param filePath
   * @param start The byte to start reading at
   * @param length How many bytes to read
   * @returns The raw bytes of the file range
   */
  async readFileRangeBytes(
    filePath: string,
    start: number,
    length: number
  ): Promise<Uint8Array | undefined> {
    let error = "";
    const fileContent = await this.invokeSafe<Uint8Array>(
      "read_file_range_bytes",
      {
        filePath,
        start,
        length,
      }
    ).catch((err) => (error = err));
    if (fileContent) {
      return fileContent;
    }
    console.log(`Unable to read contents of file: ${error}`);
    return undefined;
  }

  async isPathAFile(filePath: string): Promise<boolean> {
    return this.invokeSafe<boolean>("is_path_a_file", {
      filePath,
    }).then((result) => result);
  }

  async getDrives(): Promise<DriveModel[]> {
    return await this.invokeSafe<DriveModel[]>("get_drives")
      .then((drives) => {
        return drives;
      })
      .catch((err) => {
        throw new Error(`${err}`);
      });
  }

  async searchFilesInline(query: InlineQueryDTO): Promise<FileModel[]> {
    return this.invokeSafe<FileModel[]>("search_files_inline", {
      query,
    }).then((result) => result);
  }

  async searchIndexQuery(params: SearchParamsDTO): Promise<FileModel[]> {
    return this.invokeSafe<FileModel[]>("search_index_query", {
      params,
    })
      .then((result) => result)
      .catch((err) => {
        throw new Error(`${err}`);
      });
  }

  async searchIndexQueryStreaming(
    params: StreamingSearchParamsDTO,
    onEventEmit: (files: EmitMetadataModel<FileModel[]>) => void
  ) {
    const eventName = `${params.StreamIdentifier}:search_result`;

    const unlisten = await listen<EmitMetadataModel<FileModel[]>>(
      eventName,
      (event) => onEventEmit(event.payload)
    );

    try {
      await this.invokeSafe<Promise<void>>("search_index_query_streaming", {
        params,
      });
    } catch (err) {
      console.log("Error performing streamed query", err);
    } finally {
      unlisten();
    }
  }

  /** NOTE that the files that get emitted are ACCUMULATED!! meaning that you need to replace the old files with the emitted ones */
  async searchIndexQueryStreamingOrganized(
    params: StreamingSearchParamsDTO,
    onEventEmit: (files: EmitMetadataModel<FileModel[]>) => void
  ) {
    const eventName = `${params.StreamIdentifier}:search_result`;
    const unlisten = await listen<EmitMetadataModel<FileModel[]>>(
      eventName,
      (event) => onEventEmit(event.payload)
    );
    try {
      await this.invokeSafe<Promise<void>>(
        "search_index_query_streaming_organized",
        { params }
      );
    } catch (err) {
      console.log("Error performing streamed query", err);
    } finally {
      unlisten();
    }
  }

  async addDirsToCrawlerQueue(directories: AddToCrawlerQueueDTO[]) {
    await this.invokeSafe<void>("add_dirs_to_crawler_queue", { directories })
      .then(() => { })
      .catch((err) => console.log(err));
    console.log(
      `Frontend validation: added ${directories.length} to the crawler queue`
    );
  }

  /**
   *
   * @param limit The top n items to pull from the queue, as the queue is normally quite large
   * @returns items in the queue
   */
  async viewCrawlerQueue(limit: number): Promise<IndexedDirModel[]> {
    return await this.invokeSafe<IndexedDirModel[]>("view_crawler_queue", {
      limit,
    }).catch((err) => {
      console.log(err);
      return [];
    });
  }

  async viewCrawlerPriorityCounts(): Promise<
    Array<{ priority: number; count: number }>
  > {
    const record = await this.invokeSafe<Record<number, number>>(
      "view_crawler_priority_counts"
    ).catch((err) => {
      console.log(err);
      return undefined;
    });
    if (record) {
      return Object.entries(record).map(([priority, count]) => ({
        priority: Number(priority),
        count,
      }));
    }
    return [];
  }

  async getCrawlerAnalyzerData(): Promise<
    Array<{ label: string; data: string }>
  > {
    const record = await this.invokeSafe<Record<string, string>>(
      "get_crawler_analyzer_data"
    ).catch((err) => {
      console.log(err);
      return undefined;
    });
    if (record) {
      return Object.entries(record).map(([label, data]) => ({ label, data }));
    }
    return [];
  }

  /**
   *
   * @param dir_path
   * @returns `false` if a file path was provided or the directory was unable to be opened
   */
  async isDirectoryAccessible(dirPath: string): Promise<boolean> {
    return await this.invokeSafe<boolean>("is_directory_accessible", {
      dirPath,
    });
  }

  async upsertFileToIndex(file: FileModel) {
    await this.invokeSafe<void>("upsert_file_to_index", { file }).catch((err) =>
      console.log(err)
    );
  }

  /**
   * Returns `true` if the file exists in the file system. If the file does not exist, it is removed from the index.
   */
  async validateFileExists(path: string): Promise<boolean> {
    return await this.invokeSafe<boolean>("validate_file_exists", { path }).catch((err) => {
      console.log(err);
      return false;
    });
  }

  /**
   * Why does this method return the same thing you pass in. Well, FileModels on the frontend usually aren't fully initialized. Example: `Popularity` doesn't get filled out.
   *
   * You will pass in one of these incomplete file models and the backend will return you the corresponding file model (asumming it exists in the index)
   * will all of the fields being up to date
   *
   * Returns `undefined` if the file does not exist in the index
   * @param file
   */
  async getFileFromIndex(file: FileModel): Promise<FileModel | undefined> {
    return await this.invokeSafe<FileModel | undefined>("get_file_from_index", {
      file,
    });
  }

  /** Get information about the system the user is running the program on */
  async getSysInfo(): Promise<SystemInfoModel> {
    return await this.invokeSafe<SystemInfoModel>("get_sys_info");
  }

  /** Given that `sourcePath` is a file or directory, move it into `targetDir`
   *
   * Returns `true` if the operation was successful
   */
  async movePathIntoDirectory(
    targetDir: string,
    sourcePath: string
  ): Promise<boolean> {
    try {
      await this.invokeSafe<void>("move_path_into_directory", {
        targetDir,
        sourcePath,
      });
      return true;
    } catch (err) {
      console.log(err);
      return false;
    }
  }

  /** Moves a file/directory to the recycle bin (not a permanent deletion)
   *
   * Returns `true` if the operation was successful
   */
  async deleteFile(filePath: string): Promise<boolean> {
    try {
      await this.invokeSafe<void>("delete_file", { filePath });
      return true;
    } catch (err) {
      console.log(err);
      return false;
    }
  }

  /** Attempts to open the location of the file in the OS native file explorer
   *
   * Returns `true` if the operation was successful
   */
  async openInExplorer(path: string): Promise<boolean> {
    try {
      await this.invokeSafe<void>("open_in_explorer", { path });
      return true;
    } catch (err) {
      console.log(err);
      return false;
    }
  }

  async kvStoreSet(key: string, value: any) {
    await this.invokeSafe<void>("kv_store_set", {
      key,
      value,
    });
    console.log(`KV Store - Set key: ${key} value:`);
    console.log(value);
  }

  async kvStoreGet<T>(key: string): Promise<T | undefined> {
    try {
      const data = await this.invokeSafe<T>("kv_store_get", { key });
      return data;
    } catch (err) {
      console.log(err);
    }
    return undefined;
  }

  async kvStoreSubscribeToKey<T>(key: string): Promise<KvSubscriptionModel<T>> {
    return await this.invokeSafe<KvSubscriptionModel<T>>(
      "kv_store_subscribe_to_key",
      { key }
    );
  }

  /** Dispatch the file crawlers if they are not already running */
  async dispatchCrawlers() {
    await this.invokeSafe<void>(
      "dispatch_crawlers"
    );
  }

  /** Tell the directory watcher to stop watching whatever directory it is watching */
  async watchDirectory(path: string): Promise<string> {
    return await this.invokeSafe<string>("watch_directory",
      { path }
    );
  }

  /**  The directory watcher can currently only watch one directory at a time, so this function will make it stop watching whatever it is currently watching. */
  async stopWatchingDirectory() {
    await this.invokeSafe<void>("stop_watching_directory");
  }

  /** Get the icon of a file as a base64 encoded string */
  async getFileIcon(path: string, size: number): Promise<GetIconDTO | undefined> {
    return await this.invokeSafe<GetIconDTO>("get_file_icon", {
      path,
      width: size,
      height: size,
    }).catch((err) => {
      console.error(`Error getting file icon: ${err}. File path: ${path}`);
      return undefined;
    });
  }

  async copyPathsToClipboard(paths: string[]) {
    await this.invokeSafe<void>("copy_paths_to_clipboard", { paths }).catch((err) => {
      console.error(`Error copying paths to clipboard: ${err}`);
    });
  }

  async pasteFilesToDirectory(destinationDir: string) {
    await this.invokeSafe<void>("paste_files_to_directory", { destinationDir }).catch((err) => {
      console.error(`Error pasting files to directory: ${err}`);
    });
  }

  /** Check if there are files in the system clipboard */
  async filesExistInClipboard(): Promise<boolean> {
    return await this.invokeSafe<boolean>("files_exist_in_clipboard");
  }

  async createNewFile(directory: string, fileName: string) {
    await this.invokeSafe<void>("create_new_file", { directory, fileName }).catch((err) => {
      console.error(`Error creating new file: ${err}`);
    });
  }

  async createNewDirectory(directory: string, directoryName: string) {
    await this.invokeSafe<void>("create_new_directory", { directory, directoryName }).catch((err) => {
      console.error(`Error creating new directory: ${err}`);
    });
  }
}
