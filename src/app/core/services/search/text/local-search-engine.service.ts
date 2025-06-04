import { Injectable } from "@angular/core";
import { SearchParamsDTO } from "../../../dtos/search-params-dto";
import { FileModel } from "../../../models/file-model";
import { TauriCommandsService } from "../../tauri/commands.service";

@Injectable({ providedIn: "root" })
export class LocalSearchEngineService {
  constructor(private commandsService: TauriCommandsService) {}

  async query(params: SearchParamsDTO): Promise<FileModel[]> {
    return await this.commandsService.searchIndexQuery(params);
  }

}
