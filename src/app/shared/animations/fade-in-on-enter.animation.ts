import { animate, style, transition, trigger } from "@angular/animations";

export const fadeInOnEnterAnimation =  trigger('fadeInOnEnter', [
      transition(':enter', [
        style({ opacity: 0 }),
        animate('200ms cubic-bezier(0.2,0.0,0.2,1)', style({ opacity: 1 }))
      ]),
      transition(':leave', [
        style({ opacity: 0 }),
        animate('200ms cubic-bezier(0.2,0.0,0.2,1)', style({ opacity: 0 }))
      ])
    ])