import {
  Component,
  Input,
  Optional,
} from "@angular/core";
import { DriveModel } from "@core/models/drive-model";
import { CommonModule } from "@angular/common";
import { IconifyIconModule } from "@shared/components/icons/IconifyIcons/icon.module";
import { HomePageService } from "../../services/home-page.service";
import { DirectoryNavigatorService } from "../../services/directory-navigator.service";
import { ButtonWSvgComponent } from "../../../../shared/components/buttons/button-w-svg/button-w-svg.component";
import { ButtonWIconComponent } from "../../../../shared/components/buttons/button-w-icon/button-w-icon.component";

@Component({
  selector: "app-drive-result",
  standalone: true,
  imports: [CommonModule, IconifyIconModule, ButtonWSvgComponent, ButtonWIconComponent],
  templateUrl: "./drive-result.component.html",
  styleUrl: "./drive-result.component.scss",
})
export class DriveResultComponent {
  @Input() drive: DriveModel | undefined;

  constructor() {}
}
