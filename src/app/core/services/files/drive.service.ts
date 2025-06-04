import { Injectable } from "@angular/core";
import { BehaviorSubject } from "rxjs";
import { DriveModel } from "../../models/drive-model";
import { TauriCommandsService } from "../tauri/commands.service";

@Injectable({ 'providedIn': 'root' })
export class DriveService {
    private drivesSubject = new BehaviorSubject<DriveModel[]>([]);
    public drives$ = this.drivesSubject.asObservable();

    constructor(private commandsService: TauriCommandsService) { }

    async refreshDrives() {
        const drives = await this.commandsService.getDrives();
        this.drivesSubject.next(drives)
    }
}