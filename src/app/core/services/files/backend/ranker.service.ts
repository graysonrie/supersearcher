import { Injectable } from "@angular/core";
import { TauriCommandsService } from "../../tauri/commands.service";
import { FileModel } from "@core/models/file-model";

/**
 * For the most part, the backend handles ranking the items in the search index, but some user actions such as clicking on stuff need to carry over
 */
@Injectable({ providedIn: "root" })
export class FileRankerService {
  constructor(private commandsService: TauriCommandsService) {}

  async boostFile(file: FileModel) {
    const indexedFile = await this.commandsService.getFileFromIndex(file);
    // The file might not be in the index
    if (indexedFile) {
      indexedFile.Popularity += 1;
      await this.commandsService.upsertFileToIndex(indexedFile);
    }
  }
}
