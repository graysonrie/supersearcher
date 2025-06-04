import { Component } from '@angular/core';
import { IconifyIconModule } from "../../../../../../shared/components/icons/IconifyIcons/icon.module";
import { HideOverflowDirective } from './hide-overflow.directive';
import { SearchOverlayStateService } from '../search-overlay/services/search-overlay-state.service';
import { CommonModule } from '@angular/common';
import { createDebouncedEase } from '@shared/util/ease-value';
import { DragCollectButtonComponent } from "./components/drag-collect-button/drag-collect-button.component";

@Component({
  selector: 'app-files-display-footer',
  standalone: true,
  imports: [IconifyIconModule, CommonModule],
  templateUrl: './files-display-footer.component.html',
  styleUrl: './files-display-footer.component.css'
})
export class FilesDisplayFooterComponent {


  constructor(private searchStateService:SearchOverlayStateService){}


  onSearchClick(){
    this.searchStateService.setVisibility(true);
  }
}
