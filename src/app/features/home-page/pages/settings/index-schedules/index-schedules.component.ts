import { CommonModule } from "@angular/common";
import { Component, OnInit } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { DriveModel } from "@core/models/drive-model";
import { IndexScheduleModel } from "@core/models/index-schedule-model";
import { TauriCommandsService } from "@core/services/tauri/commands.service";
import { IconifyIconModule } from "@shared/components/icons/IconifyIcons/icon.module";
import { normalizeDirectoryPathForComparison } from "@shared/util/path";

interface DriveScheduleRow {
  drive: DriveModel;
  intervalDays: number | null;
  hasSchedule: boolean;
}

@Component({
  selector: "app-index-schedules",
  standalone: true,
  imports: [CommonModule, FormsModule, IconifyIconModule],
  templateUrl: "./index-schedules.component.html",
  styleUrl: "./index-schedules.component.css",
})
export class IndexSchedulesComponent implements OnInit {
  rows: DriveScheduleRow[] = [];
  private schedulesByDirectory = new Map<string, IndexScheduleModel>();

  constructor(private commandsService: TauriCommandsService) {}

  async ngOnInit(): Promise<void> {
    await this.loadData();
  }

  async loadData(): Promise<void> {
    const [drives, schedules] = await Promise.all([
      this.commandsService.getDrives(),
      this.commandsService.getIndexSchedules(),
    ]);

    this.schedulesByDirectory.clear();
    for (const schedule of schedules) {
      this.schedulesByDirectory.set(
        normalizeDirectoryPathForComparison(schedule.ForDirectory),
        schedule,
      );
    }

    this.rows = drives.map((drive) => {
      const schedule = this.getScheduleForDrive(drive.Name);
      return {
        drive,
        intervalDays: schedule?.IntervalDays ?? null,
        hasSchedule: schedule !== undefined,
      };
    });
  }

  getScheduleForDrive(driveName: string): IndexScheduleModel | undefined {
    return this.schedulesByDirectory.get(
      normalizeDirectoryPathForComparison(driveName),
    );
  }

  async onIntervalBlur(row: DriveScheduleRow): Promise<void> {
    const value = row.intervalDays;

    if (value === null || Number.isNaN(value) || value <= 0) {
      if (row.hasSchedule) {
        await this.removeSchedule(row);
      } else {
        row.intervalDays = null;
      }
      return;
    }

    await this.commandsService.upsertIndexSchedule(row.drive.Name, value);
    row.hasSchedule = true;
    await this.loadData();
  }

  onIntervalKeydown(event: KeyboardEvent, row: DriveScheduleRow): void {
    if (event.key === "Enter") {
      event.preventDefault();
      (event.target as HTMLInputElement).blur();
    }
  }

  async removeSchedule(row: DriveScheduleRow): Promise<void> {
    await this.commandsService.removeIndexSchedule(row.drive.Name);
    row.intervalDays = null;
    row.hasSchedule = false;
    await this.loadData();
  }
}
