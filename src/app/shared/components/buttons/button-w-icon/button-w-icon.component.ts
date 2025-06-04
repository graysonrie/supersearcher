import { CommonModule } from "@angular/common";
import { Component, input, Input } from "@angular/core";
import { MatIconModule } from "@angular/material/icon";
import { IconifyIconModule } from "../../icons/IconifyIcons/icon.module";

@Component({
  selector: "app-button-w-icon",
  standalone: true,
  imports: [CommonModule, MatIconModule, IconifyIconModule],
  templateUrl: "./button-w-icon.component.html",
  styleUrl: "./button-w-icon.component.scss",
})
export class ButtonWIconComponent {
  @Input() iconName = "";
  @Input() iconSize: string | undefined = undefined;
  @Input() iconColor: string | undefined = undefined;
  @Input() click = () => {};
}
