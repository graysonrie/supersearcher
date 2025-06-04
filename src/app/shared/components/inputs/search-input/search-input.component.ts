import { Component, ElementRef, EventEmitter, Input, Output, ViewChild } from "@angular/core";
import { FormsModule } from "@angular/forms";

@Component({
  selector: "app-search-input",
  standalone: true,
  imports: [FormsModule],
  templateUrl: "./search-input.component.html",
  styleUrl: "./search-input.component.css",
})
export class SearchInputComponent {
  @ViewChild("input") input!: ElementRef;
  @Input() text = "";
  @Output() textChanged = new EventEmitter<string>();

  onInputChange(event: any): void {
    this.textChanged.emit(event.value);
  }

  focus() {
    this.input.nativeElement.focus();
  }
}
