import { Injectable, OnDestroy } from "@angular/core";
import { DirectoryNavigatorService } from "./directory-navigator.service";
import { FileModel } from "@core/models/file-model";
import { FileCrawlerService } from "@core/services/files/backend/file_crawler.service";
import { IndexingFilesOverlayService } from "../components/indexing-files-overlay/indexing-files-overlay.service";
import { PersistentConfigService } from "@core/services/persistence/config.service";
import { BehaviorSubject, Subscription } from "rxjs";

@Injectable()
export class FileOperationsService implements OnDestroy {
  constructor(
    private directoryService: DirectoryNavigatorService,
    private fileCrawlerService: FileCrawlerService,
    private configService: PersistentConfigService,
  ) {
    this.subscription.add(
      this.configService
        .observeKey("addDirectoriesToCrawlerQueueOnClick")
        .subscribe((x) => {
          this.addDirectoriesToCrawlerQueueOnClickSubject.next(x);
        }),
    );
  }

  private subscription = new Subscription();
  private addDirectoriesToCrawlerQueueOnClickSubject =
    new BehaviorSubject<boolean>(false);

  /** If the file represents a directory, this function will set it to the current directory. If the file is an actual file, then it will attempt to open it with the command prompt  */
  async openOrNavigateToFile(file: FileModel) {
    const path = file.FilePath;
    if (await this.directoryService.isPathAFile(path)) {
      await this.directoryService.openFileCmd(path);
    } else {
      await this.directoryService.setCurrentDir(path);
      // When the user clicks on a directory, go ahead and add that directory to the crawler queue.
      // If the directory was indexed recently, then it will automatically get ignored
      if (this.addDirectoriesToCrawlerQueueOnClickSubject.getValue()) {
        await this.fileCrawlerService.addDirectoriesToQueue([
          { DirPath: path, Priority: 0 },
        ]);
      }
    }
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }
}
