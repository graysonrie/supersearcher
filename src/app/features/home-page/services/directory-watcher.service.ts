import { Injectable } from "@angular/core";
import { TauriCommandsService } from "@core/services/tauri/commands.service";
import { listen, UnlistenFn } from "@tauri-apps/api/event";
import { Subject } from "rxjs";

@Injectable()
export class DirectoryWatcherService {
  private unlisten: UnlistenFn | undefined = undefined;
  private directoryChangesSubject = new Subject<void>();
  directoryChanges$ = this.directoryChangesSubject.asObservable();

  constructor(private commandsService: TauriCommandsService) {}

  /** Tell the directory watcher to stop watching whatever directory it is watching and then watch the new directory.
   *
   * The Observable emits whenever the watcher detects a change such as a rename, deletion, etc.
   */
  async watchDirectory(path: string) {
    if (this.unlisten) this.unlisten();

    const ident: string = await this.commandsService.watchDirectory(path);

    // Listen for updates
    const unlisten = await listen<string>(ident, (_data) => {
      console.warn("DirectoryWatcherService: Noticed changes");
      this.directoryChangesSubject.next();
    });
    this.unlisten = unlisten;
  }

  async stopWatchingDirectory() {
    await this.commandsService.stopWatchingDirectory();
    if (this.unlisten) this.unlisten();
  }
}
