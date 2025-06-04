import { Injectable, OnDestroy } from "@angular/core";
import { Subscription } from "rxjs";
import { invoke, InvokeArgs, InvokeOptions } from "@tauri-apps/api/core";

@Injectable({ providedIn: 'root' })
export class SafeInvokeService {

    private appInitialized = false;

    constructor() { }

    /**
       * Returns `true` if the backend is active and all state has been fully managed.
       */
    private async checkBackendState(): Promise<boolean> {
        try {
            return await invoke<boolean>("is_running");
        } catch {
            return false;
        }
    }

    /**
     * Ensures that the backend has been initialized before proceeding.
     */
    private async ensureBackendInitialized(): Promise<void> {
        if (this.appInitialized) {
            return; // Already initialized
        }

        while (!this.appInitialized) {
            console.log("Pinging backend to see if it is active");
            const result = await this.checkBackendState();
            if (result) {
                this.appInitialized = true;
                console.log('Backend responded to ping. All state has been managed');
                break;
            }
            await this.delay(500); // Wait before retrying
        }
    }

    /**
     * Helper method to introduce a delay.
     */
    private delay(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * Invoke a Tauri command after all state has been initialized.
     */
    async invokeSafe<T>(cmd: string, args?: InvokeArgs, options?: InvokeOptions): Promise<T> {
        await this.ensureBackendInitialized();
        return invoke<T>(cmd, args, options);
    }
}