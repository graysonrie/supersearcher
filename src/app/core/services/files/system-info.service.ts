import { Injectable } from '@angular/core';
import { TauriCommandsService } from '../tauri/commands.service';
import { SystemInfoModel } from '@core/models/system-info-model';

@Injectable({providedIn: 'root'})
export class SystemInfoService {

    constructor(private commandsService:TauriCommandsService) { }
    
    async getSystemInfo(): Promise<SystemInfoModel>{
        return await this.commandsService.getSysInfo();
    }
}