import { CommonModule } from "@angular/common";
import { Component, Input, OnInit, ViewEncapsulation } from "@angular/core";
import { IconifyIconModule } from "../../icons/IconifyIcons/icon.module";
import {
  animate,
  state,
  style,
  transition,
  trigger,
} from "@angular/animations";

@Component({
  selector: "app-dropdown-button",
  standalone: true,
  imports: [CommonModule, IconifyIconModule],
  templateUrl: "./dropdown-button.component.html",
  styleUrl: "./dropdown-button.component.css",
  animations: [
    trigger("dropdownAnimation", [
      state("void", style({ opacity: 0, transform: "translateY(-20px)" })),
      state("*", style({ opacity: 1, transform: "translateY(0)" })),
      transition("void => *", [animate("90ms ease-out")]),
      transition("* => void", [animate("90ms ease-in")]),
    ]),
  ],
})
export class DropdownButtonComponent implements OnInit {
  @Input() text = "";
  @Input() onClick: (() => void) | undefined;
  @Input() expanded = false;

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

  dropdownHoverEnter() {
    this.dropdownColor = "--primary";
  }

  dropdownHoverExit() {
    this.dropdownColor = "--text-primary";
  }
}
