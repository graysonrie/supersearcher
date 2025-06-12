import { Injectable } from "@angular/core";
import { Observable } from "rxjs";
import { ConfigKeys } from "./config-keys";
import { KvStorageService } from "../tauri/kv-store.service";

@Injectable({ providedIn: "root" })
export class PersistentConfigService {
  constructor(private kvStoreService: KvStorageService) {}

  /** Subscribe to changes for one certain field in the config */
  observeKey<K extends keyof ConfigKeys>(key: K): Observable<ConfigKeys[K]> {
    const observable = this.kvStoreService.subscribe<ConfigKeys[K]>(key);
    return observable;
  }

  /** Update a specific key in the config */
  async update<K extends keyof ConfigKeys>(
    key: K,
    value: ConfigKeys[K]
  ): Promise<void> {
    // TODO: debounce the save operation if needed
    await this.kvStoreService.set(key, value);
  }

  async read<K extends keyof ConfigKeys>(
    key: K
  ): Promise<ConfigKeys[K] | undefined> {
    const value = await this.kvStoreService.get<ConfigKeys[K]>(key);
    return value;
  }

  /** Attempts to read an item from the config.
   *
   * If the value hasn't been set in the config, the fallback will be returned and
   * it will be added to the config.
   */
  async readOrSet<K extends keyof ConfigKeys>(
    key: K,
    fallback: ConfigKeys[K]
  ): Promise<ConfigKeys[K]> {
    const value = await this.read(key);
    if (value != undefined && value != null) {
      return value;
    } else {
      console.warn(`ConfigService - readOrSet notice:
      The provided key was not present in the database:${key}
      Assigning the fallback value`);
      await this.update(key, fallback);
      return fallback;
    }
  }
}
