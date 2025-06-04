import { Injectable } from "@angular/core";
import { DirectoryNavigatorService } from "./directory-navigator.service";
import { FileModel } from "@core/models/file-model";
import { FileCrawlerService } from "@core/services/files/backend/file_crawler.service";
import { IndexingFilesOverlayService } from "../components/indexing-files-overlay/indexing-files-overlay.service";

@Injectable()
export class FileOperationsService {
  constructor(
    private directoryService: DirectoryNavigatorService,
    private fileCrawlerService: FileCrawlerService,
  ) {}

  /** If the file represents a directory, this function will set it to the current directory. If the file is an actual file, then it will attempt to open it with the command prompt  */
  async openOrNavigateToFile(file: FileModel) {
    const path = file.FilePath;
    if (await this.directoryService.isPathAFile(path)) {
      await this.directoryService.openFileCmd(path);
    } else {
      await this.directoryService.setCurrentDir(path);
      // When the user clicks on a directory, go ahead and add that directory to the crawler queue.
      // If the directory was indexed recently, then it will automatically get ignored
      await this.fileCrawlerService.addDirectoriesToQueue([
        { DirPath: path, Priority: 0 },
      ]);
    }
  }
}
