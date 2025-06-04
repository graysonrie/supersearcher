import { Component } from "@angular/core";
import { IconifyIconModule } from "@shared/components/icons/IconifyIcons/icon.module";
import { Router } from "@angular/router";

/**
 * Thing that contains the setting button
 */
@Component({
  selector: "app-toolbar",
  standalone: true,
  imports: [IconifyIconModule],
  templateUrl: "./toolbar.component.html",
  styleUrl: "./toolbar.component.css",
})
export class ToolbarComponent {
  constructor(private router: Router) {}

  //TODO: add page transitions. Right now it happens instantly

  settingsButtonClick() {
    this.router.navigate(["./settings"]);
  }
}
