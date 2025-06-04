import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';

@Component({
  selector: 'app-radio-button',
  standalone: true,
  imports: [],
  templateUrl: './radio-button.component.html',
  styleUrl: './radio-button.component.css'
})
export class RadioButtonComponent {
  @Input() text = "";
  @Output() onToggle = new EventEmitter<boolean>();
  @Input() isChecked = false;

  toggleRadio() {
    this.isChecked = !this.isChecked; // Toggle the checked state
    this.onToggle.emit(this.isChecked);
  }
}
