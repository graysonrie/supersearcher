import { trigger, transition, style, animate, query, stagger } from '@angular/animations';

export const staggeredFadeInAnimation = trigger('staggeredFadeIn', [
    transition('* => *', [
      query(':enter', [
        style({ opacity: 0 }),
        stagger(100, animate('500ms ease-in', style({ opacity: 1 })))
      ], { optional: true })
    ])
  ])