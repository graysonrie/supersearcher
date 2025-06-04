import { Injectable } from "@angular/core";
import { defaultDriveModel, DriveModel } from "@core/models/drive-model";
import { BehaviorSubject } from "rxjs";

// * For testing so I can see how the sidebar interacts with content
@Injectable({ providedIn: "root" })
export class MockDriveService {
  private drivesSubject = new BehaviorSubject<DriveModel[]>([]);
  public drives$ = this.drivesSubject.asObservable();

  async refreshDrives() {
    const amt = 10;
    let drives = [];
    for (let i = 0; i < amt; i++) {
      drives.push(defaultDriveModel());
    }
    this.drivesSubject.next(drives);
  }
}
