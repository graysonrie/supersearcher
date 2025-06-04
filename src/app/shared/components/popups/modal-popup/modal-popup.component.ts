import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { ButtonModel } from './models/ButtonModel';
import { animate, style, transition, trigger } from '@angular/animations';
import { smoothEnterAnimation } from '@shared/animations/smooth-enter.animation';

@Component({
  selector: 'app-modal-popup',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './modal-popup.component.html',
  styleUrl: './modal-popup.component.css',
  animations:[
    smoothEnterAnimation
  ]
})
export class ModalPopupComponent {
  @Input() title: string = 'Modal Title';
  @Input() isVisible: boolean = false;
  @Output() closeRequested = new EventEmitter<void>();

  requestClose() {
    this.closeRequested.emit();
  }
}
