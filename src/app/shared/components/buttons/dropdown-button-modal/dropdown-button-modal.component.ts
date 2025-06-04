import { CommonModule } from "@angular/common";
import { Component, Input, OnInit } from "@angular/core";
import { IconifyIconModule } from "../../icons/IconifyIcons/icon.module";

@Component({
  selector: "app-dropdown-button-modal",
  standalone: true,
  imports: [CommonModule, IconifyIconModule],
  templateUrl: "./dropdown-button-modal.component.html",
  styleUrl: "./dropdown-button-modal.component.css",
})
export class DropdownButtonModalComponent implements OnInit {
  expanded = false;

  dropDownIcon = "dropDown";
  dropdownColor = "--text-primary";

  ngOnInit(): void {
    if (this.expanded) {
      this.dropDownIcon = "dropUp";
    }
  }

  onDropdownClick() {
    this.expanded = !this.expanded;
    this.dropDownIcon = this.expanded ? "dropUp" : "dropDown";
  }

}
