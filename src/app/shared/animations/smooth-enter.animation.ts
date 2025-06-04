import { animate, style, transition, trigger } from "@angular/animations";

export const smoothEnterAnimation =  trigger('smoothEnter', [
      transition(':enter', [
        style({ transform: 'scale(0.8)', opacity: 0 }),
        animate('200ms cubic-bezier(0.2,0.0,0.2,1)', style({ transform: 'scale(1)', opacity: 1 }))
      ]),
      transition(':leave', [
        style({ transform: 'scale(0)', opacity: 0 }),
        animate('200ms cubic-bezier(0.2,0.0,0.2,1)', style({ transform: 'scale(0.8)', opacity: 0 }))
      ])
    ])