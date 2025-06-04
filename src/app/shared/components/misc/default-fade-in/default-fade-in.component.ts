import {
  AfterViewInit,
  ChangeDetectorRef,
  Component,
  ElementRef,
  HostBinding,
  Input,
  OnChanges,
  OnInit,
} from "@angular/core";
import {
  trigger,
  state,
  style,
  transition,
  animate,
} from "@angular/animations";
import { CommonModule } from "@angular/common";

@Component({
  selector: "app-default-fade-in",
  standalone: true,
  imports: [CommonModule],
  templateUrl: "./default-fade-in.component.html",
  styleUrl: "./default-fade-in.component.css",
  animations: [
    trigger("fadeIn", [
      transition(":enter", [
        // :enter is a built-in state for elements entering the DOM
        style({ opacity: 0 }), // Start with opacity 0
        animate(".2s ease-in", style({ opacity: 1 })), // Transition to opacity 1
      ]),
    ]),
  ],
})
export class DefaultFadeInComponent implements AfterViewInit {
  constructor(private cdr: ChangeDetectorRef) {}

  ngAfterViewInit() {
    console.log("ok init");
    this.cdr.detectChanges(); // Ensure the animation gets picked up after the view is initialized
  }
}
