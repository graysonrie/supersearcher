import { AfterViewInit, Component, Input, OnChanges, OnDestroy, OnInit, SimpleChanges, ViewChild } from '@angular/core';
import { getFileExtension } from '@core/util/file/get-extension';
import { detectFileType, isFileBinary } from '@core/util/file/file-type';
import { CommonModule } from '@angular/common';
import { ExtendBarComponent } from "./extend-bar/extend-bar.component";
import { Subscription } from 'rxjs';
import { TauriCommandsService } from '@core/services/tauri/commands.service';

@Component({
  selector: 'app-file-preview',
  standalone: true,
  imports: [CommonModule, ExtendBarComponent],
  templateUrl: './file-preview.component.html',
  styleUrl: './file-preview.component.css'
})
export class FilePreviewComponent implements AfterViewInit, OnChanges, OnDestroy {
  subscription = new Subscription();

  /** The file currently being previewed */
  @Input() file: string | undefined;

  constructor(private commandsService: TauriCommandsService) { }

  previewWidth = 100;
  textPreview = "";
  isLoading = false;
  @ViewChild(ExtendBarComponent) extendBar!: ExtendBarComponent;

  ngAfterViewInit(): void {
    this.subscription.add(this.extendBar.contentWidth$.subscribe(width => this.previewWidth = width));
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['file']) {
      this.previewFile(changes['file'].currentValue);
    }
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

  async previewFile(filePath: string) {
    this.isLoading = true;
    if (await this.commandsService.isPathAFile(filePath)) {
      const isBinary = await isFileBinary(filePath);
      if (isBinary != undefined) {
        if (!isBinary) {
          await this.previewTxtFile(filePath);
        } else {
          this.textPreview = "Cannot preview file";
        }
      } else {
        // Failure when trying to read the file
        this.textPreview = "Cannot preview file: System Error";
      }
    } else {
      // A directory was passed in
      this.textPreview = "";
    }


    this.isLoading = false;
    // let ext = getFileExtension(filePath);
    // switch (ext) {
    //   case "txt":
    //     await this.previewTxtFile(filePath);
    //     break;
    // }
  }

  private async previewTxtFile(filePath: string) {
    const content = await this.commandsService.readFileRange(filePath, 0, 256);
    console.log(content);
    if (content) {
      this.textPreview = content;
    }
  }

}
