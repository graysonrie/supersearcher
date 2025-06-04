import { Injectable } from "@angular/core";
import { SystemInfoService } from "./system-info.service";
import { BehaviorSubject } from "rxjs";

export interface QuickAccessPath {
  path: string; // Example: C://Desktop
  name: string; // Example: Desktop
}

@Injectable({ providedIn: "root" })
export class QuickAccessFilesService {
  // a list of file paths
  private quickAccessPathsSubject = new BehaviorSubject<QuickAccessPath[]>([]);
  quickAccessPaths$ = this.quickAccessPathsSubject.asObservable();

  constructor(private systemInfoService: SystemInfoService) {
    this.setDefaultQuickAccessPaths();
  }

  private async setDefaultQuickAccessPaths() {
    const paths = await this.sysPathsAsQuickAccessPaths();
    this.quickAccessPathsSubject.next(paths);
  }

  private async sysPathsAsQuickAccessPaths(): Promise<QuickAccessPath[]> {
    let paths: QuickAccessPath[] = [];
    const info = await this.systemInfoService.getSystemInfo();
    // if (info.HomeDirectoryPath)
    //   paths.push({ path: info.HomeDirectoryPath, name: "Home" });
    if (info.DesktopDirectoryPath)
      paths.push({ path: info.DesktopDirectoryPath, name: "Desktop" });
    if (info.DownloadsDirectoryPath)
      paths.push({ path: info.DownloadsDirectoryPath, name: "Downloads" });
    if (info.DocumentsDirectoryPath)
      paths.push({ path: info.DocumentsDirectoryPath, name: "Documents" });
    if (info.PicturesDirectoryPath)
      paths.push({ path: info.PicturesDirectoryPath, name: "Pictures" });
    return paths;
  }
}
