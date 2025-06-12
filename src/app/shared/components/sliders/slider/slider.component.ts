import { Component, Input, Output, EventEmitter } from "@angular/core";
import { FormsModule } from "@angular/forms";

@Component({
  selector: "app-slider",
  standalone: true,
  imports: [FormsModule],
  templateUrl: "./slider.component.html",
  styleUrl: "./slider.component.css",
})
export class SliderComponent {
  @Input() min: number = 0;
  @Input() max: number = 100;
  @Input() value: number = 0;
  @Output() valueChange = new EventEmitter<number>();

  onValueChange(newValue: number) {
    this.value = newValue;
    this.valueChange.emit(newValue);
  }
}
