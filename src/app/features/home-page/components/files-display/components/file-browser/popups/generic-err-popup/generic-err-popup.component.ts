import { Component, Input } from '@angular/core';
import { ModalPopupComponent } from "@shared/components/popups/modal-popup/modal-popup.component";
import { ButtonModel } from '@shared/components/popups/modal-popup/models/ButtonModel';

@Component({
  selector: 'app-generic-err-popup',
  standalone: true,
  imports: [ModalPopupComponent],
  templateUrl: './generic-err-popup.component.html',
  styleUrl: './generic-err-popup.component.css'
})
export class FailedToMoveItemsPopupComponent {
  isVisible = false;
  errText:string = "";

  buttons: ButtonModel[] = [{ text: "Ok", action: () => {} }];

  open(errText:string){
    this.errText = errText;
    this.isVisible = true;
  }
}
