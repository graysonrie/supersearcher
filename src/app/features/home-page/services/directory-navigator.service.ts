import { Injectable } from "@angular/core";
import { BehaviorSubject } from "rxjs";
import {
  getFilesParams_DefaultParams,
  GetFilesParamsDTO,
} from "@core/dtos/get-files-params-dto";
import { TauriCommandsService } from "@core/services/tauri/commands.service";
import { FileModel } from "@core/models/file-model";
import {
  DirectoryMetadata,
  newDirMetadataDefault,
} from "@core/models/directory-metadata";
import { PersistentConfigService } from "@core/services/persistence/config.service";

@Injectable()
export class DirectoryNavigatorService {
  private errorSubject = new BehaviorSubject<string>("");
  public error$ = this.errorSubject.asObservable();

  private currentDirSubject = new BehaviorSubject<string>("");
  public currentDir$ = this.currentDirSubject.asObservable();

  private currentDirMetadataSubject = new BehaviorSubject<DirectoryMetadata>(
    newDirMetadataDefault()
  );
  public currentDirMetadata$ = this.currentDirMetadataSubject.asObservable();

  // True if the service is trying to load in the files asynchronously
  private isLoadingSubject = new BehaviorSubject<boolean>(false);
  public isLoading$ = this.isLoadingSubject.asObservable();

  private currentFilesSubject = new BehaviorSubject<FileModel[]>([]);
  public currentFiles$ = this.currentFilesSubject.asObservable();

  constructor(
    private commandsService: TauriCommandsService,
    private configService: PersistentConfigService
  ) {}

  async setCurrentDir(dir: string, params?: GetFilesParamsDTO) {
    // avoid redundant emissions
    if (this.currentDirSubject.getValue() !== dir) {
      // Ensure that the config is updated:
      await this.configService.update("lastDirectoryAt", dir);

      const currentMeta = this.currentDirMetadataSubject.getValue();
      this.currentDirMetadataSubject.next({
        ...currentMeta,
        //isAccessible: await this.commandsService.isDirectoryAccessible(dir),
      });

      const formattedDir = await this.commandsService.formatPathIntoDir(dir);
      this.currentDirSubject.next(formattedDir);
      this.isLoadingSubject.next(true);

      const start = Date.now();
      this.currentFilesSubject.next([]);
      // Arbitrary wait to prevents the get_files_at_models events from being emitting at the wrong places
      await new Promise((resolve) => setTimeout(resolve, 100));
      await this.setFiles(params);

      this.isLoadingSubject.next(false);
      console.log(`Took ${Date.now() - start} time to get here`);
    }
  }

  async setFiles(params?: GetFilesParamsDTO) {
    console.log("called set files");
    this.currentFilesSubject.next([]);
    const directory = this.currentDirSubject.getValue();

    if (!params) params = getFilesParams_DefaultParams(); // No sorting logic or anything fancy

    // clear the error first:
    this.errorSubject.next("");
    // Run the command:
    await this.commandsService
      .getFilesAsModels(
        directory,
        ({ file, dir }) => {
          if (dir == this.currentDirSubject.getValue()) {
            this.currentFilesSubject.next([
              ...this.currentFilesSubject.getValue(),
              file,
            ]);
          } else {
            console.error("NOO");
          }
        },
        params
      ) // * getFilesAsModels will throw an error if the directory is inaccessible to the user
      .then(async () => {
        const currentDir = this.currentDirSubject.getValue();
        if (this.currentFilesSubject.getValue().length == 0) {
          if (await this.commandsService.isDirectoryAccessible(currentDir)) {
            this.errorSubject.next("This directory is empty.");
          } else {
            this.errorSubject.next(
              `Could not access '${currentDir}': Access denied.`
            );
          }
        }
      })
      .catch((err) => {
        console.warn("Error when getting files as models:", err);
        this.errorSubject.next(err);
      });
  }

  async isPathAFile(filePath: string): Promise<boolean> {
    return await this.commandsService.isPathAFile(filePath);
  }

  async getDirectoryPath(): Promise<string> {
    return await this.commandsService.getDirectoryPath(
      this.currentDirSubject.getValue()
    );
  }

  async getParentDirectory(): Promise<string> {
    return await this.commandsService.getParentDirectory(
      this.currentDirSubject.getValue()
    );
  }

  async getRootDirectory(): Promise<string> {
    return await this.commandsService.getRootPath(
      this.currentDirSubject.getValue()
    );
  }

  async openFileCmd(filePath: string): Promise<boolean> {
    return await this.commandsService.openFile(filePath);
  }

  getCurrentMetadata(): DirectoryMetadata {
    return this.currentDirMetadataSubject.getValue();
  }
}
