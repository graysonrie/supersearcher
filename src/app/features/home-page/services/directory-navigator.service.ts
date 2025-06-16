import { EventEmitter, Injectable, OnDestroy, Output } from "@angular/core";
import { BehaviorSubject, Subscription, takeUntil, switchMap } from "rxjs";
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
import { FileRetrieverService } from "@core/services/files/file-retriever.service";
import { Session } from "@core/models/session";
import { replaceBacklashesWithForwardSlashes } from "@shared/util/string";

@Injectable()
export class DirectoryNavigatorService implements OnDestroy {
  private subscription = new Subscription();

  private errorSubject = new BehaviorSubject<string>("");
  public error$ = this.errorSubject.asObservable();

  private currentDirSubject = new BehaviorSubject<string>("");
  public currentDir$ = this.currentDirSubject.asObservable();
  private currentDirAsIdent: string = "";

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
    private fileRetrieverService: FileRetrieverService,
    private commandsService: TauriCommandsService,
    private configService: PersistentConfigService
  ) {
    this.subscription.add(
      this.currentDir$.subscribe(
        (x) => (this.currentDirAsIdent = replaceBacklashesWithForwardSlashes(x))
      )
    );
  }

  async setCurrentDir(dir: string, params?: GetFilesParamsDTO) {
    // avoid redundant emissions
    if (this.currentDirSubject.getValue() !== dir) {
      console.log("requested cancel");
      await this.commandsService.requestGetFilesCancel();
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
      const observable = await this.setFilesAndObserve(params);
      this.subscription.add(
        observable
          .pipe(
            switchMap((session) => session.inactive$),
            takeUntil(this.currentDir$)
          )
          .subscribe((inactive) => {
            if (!inactive) {
              const session = observable.getValue();
              if (session.directory !== this.currentDirAsIdent) {
                this.fileRetrieverService.removeSession(session.directory);
              } else {
                session.inactiveSubject.next(true);
              }
            }
          })
      );

      this.subscription.add(
        observable.subscribe((session) => {
          if (session.directory === this.currentDirAsIdent) {
            this.currentFilesSubject.next(session.files);
          }
        })
      );

      this.isLoadingSubject.next(false);

      console.log(`Took ${Date.now() - start} time to get here`);
    }
  }

  async setFilesAndObserve(params?: GetFilesParamsDTO) {
    console.log("called set files");
    this.currentFilesSubject.next([]);
    const directory = this.currentDirSubject.getValue();

    if (!params) params = getFilesParams_DefaultParams(); // No sorting logic or anything fancy

    // clear the error first:
    this.errorSubject.next("");

    const observable = this.fileRetrieverService.getFilesAndObserveSession(
      directory,
      params
    );
    return observable;
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

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }
}
