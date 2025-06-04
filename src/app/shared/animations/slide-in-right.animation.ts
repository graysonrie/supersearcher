import { trigger, transition, style, animate, query, stagger } from '@angular/animations';

export const slideInRightAnimation = trigger('slideInRight', [
  transition(':enter', [
    style({ opacity: 0, transform: 'translateX(-50px)' }), // Initial state: transparent and offset left
    animate('300ms cubic-bezier(0.075,0.82,0.165,1)', style({ opacity: 1, transform: 'translateX(0)' })) // Final state: opaque and in position
  ])
])