import { Injectable } from "@angular/core";
import { TauriCommandsService } from "./commands.service";
import { listen } from "@tauri-apps/api/event";
import { BehaviorSubject, Observable, Subject } from "rxjs";

/**
 * A lazily-loaded JSON key-value store that exists in the backend SQLite database
 */
@Injectable({ providedIn: "root" })
export class KvStorageService {
  constructor(private commandsService: TauriCommandsService) {}

  async set(key: string, value: any) {
    await this.commandsService.kvStoreSet(key, value);
  }

  async get<T>(key: string): Promise<T | undefined> {
    return this.commandsService.kvStoreGet(key);
  }

  subscribe<T>(key: string): Observable<T> {
    return new Observable<T>((subscriber) => {
      (async () => {
        const model = await this.commandsService.kvStoreSubscribeToKey<T>(key);
        const ident: string = model.Identifier;
        const lastData: T | undefined = model.LastData;

        if (lastData) {
          subscriber.next(lastData);
        }

        // Listen for updates
        const unlisten = await listen<T>(ident, (event) => {
          subscriber.next(event.payload);
        });

        // Cleanup listener when the Observable is unsubscribed
        return () => {
          unlisten();
        };
      })();
    });
  }
}
