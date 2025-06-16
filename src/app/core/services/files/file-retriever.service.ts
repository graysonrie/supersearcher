import { Injectable } from "@angular/core";
import { EmitMetadataModel } from "@core/models/emit-metadata-model";
import { FileModel } from "@core/models/file-model";
import { Session } from "@core/models/session";
import { listen, UnlistenFn } from "@tauri-apps/api/event";
import { TauriCommandsService } from "../tauri/commands.service";
import { GetFilesParamsDTO } from "@core/dtos/get-files-params-dto";
import { BehaviorSubject, Observable, Subscription } from "rxjs";
import { replaceBacklashesWithForwardSlashes } from "@shared/util/string";

@Injectable({ providedIn: "root" })
export class FileRetrieverService {
  private subscription = new Subscription();
  private unlisten: UnlistenFn | undefined;
  private sessions: BehaviorSubject<Session>[] = [];

  constructor(private commands: TauriCommandsService) {
    this.init();
  }

  async init() {
    this.unlisten = await listen<EmitMetadataModel<FileModel>>(
      "file_retriever:file",
      (data) => {
        console.log(
          this.sessions.map((x) => {
            const val = x.getValue();
            return {
              dir: val.directory,
              inactive: val.inactiveSubject.getValue(),
            };
          })
        );
        const model = data.payload;
        const directory = model.Metadata;
        const file = model.Data;
        this.getOrCreateSession(directory);
        this.addFileToSession(directory, file);
      }
    );
  }

  async getFilesAndObserveSession(
    directory: string,
    params: GetFilesParamsDTO
  ): Promise<BehaviorSubject<Session>> {
    const session = this.getOrCreateSession(directory);

    this.sessions.push(session);
    await this.commands.getFilesAsModels(directory, params);
    return session;
  }

  private setFilesInSession(dir: string, files: FileModel[]) {
    const session = this.sessions.find((x) => x.getValue().directory == dir);
    if (!session) {
      console.warn(
        "Tried to set files in session, but no session with this directory has been created. Directory:",
        dir
      );
      return;
    }
    const currentSession = session.getValue();
    session.next({ ...currentSession, files });
  }

  private addFileToSession(dir: string, file: FileModel) {
    const session = this.sessions.find((x) => x.getValue().directory == dir);
    if (!session) {
      console.warn(
        "Tried to set files in session, but no session with this directory has been created. Directory:",
        dir
      );
      return;
    }
    const currentSession = session.getValue();
    let newFiles = currentSession.files;
    newFiles.push(file);
    session.next({
      ...currentSession,
      files: newFiles,
    });
  }

  private getOrCreateSession(dir: string): BehaviorSubject<Session> {
    dir = this.formatDirectoryAsIdentifier(dir);
    const session = this.sessions.find((x) => x.getValue().directory === dir);
    if (session) {
      const currentSession = session.getValue();
      currentSession.inactiveSubject.next(false);
      return session;
    }
    const inactiveSubject = new BehaviorSubject<boolean>(false);
    const inactive$ = inactiveSubject.asObservable();
    const newSession = new BehaviorSubject<Session>({
      directory: dir,
      files: [],
      inactiveSubject,
      inactive$,
    });
    this.subscription.add(
      inactive$.subscribe((x) => {
        if (x) {
          this.removeSession(dir);
        }
      })
    );
    return newSession;
  }

  private formatDirectoryAsIdentifier(dir: string) {
    return replaceBacklashesWithForwardSlashes(dir);
  }

  removeSession(dir: string) {
    const session = this.sessions.find((x) => x.getValue().directory === dir);
    if (session) {
      const current = session.getValue();
      current.inactiveSubject.next(true);
      this.sessions = this.sessions.filter(
        (x) => x.getValue().directory !== dir
      );
    }
  }
}
