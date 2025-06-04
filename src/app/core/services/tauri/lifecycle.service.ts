import { Injectable } from "@angular/core";
import { PersistentConfigService } from "../persistence/config.service";
import { listen } from "@tauri-apps/api/event";
import { TauriCommandsService } from "./commands.service";
import { BehaviorSubject } from "rxjs";
import { invoke } from "@tauri-apps/api/core";

@Injectable({ providedIn: "root" })
export class TauriLifecycleService {

  private isAppInitializedSubject = new BehaviorSubject<boolean>(false);
  isAppInitialized$ = this.isAppInitializedSubject.asObservable();

  constructor(private configService: PersistentConfigService) {}

  async isFirstUse():Promise<boolean> {
    return await this.configService.readOrSet("isFirstUse", false);
  }

  async onShutdown() {
    this.configService.update("isFirstUse", false);
    //await this.configService.save();
  }
}
