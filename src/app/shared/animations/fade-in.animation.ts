import { animate, state, style, transition, trigger } from "@angular/animations";

/** States: `hidden`, `visible` */
export const fadeInAnimation = trigger("fadeIn", [
    state("hidden", style({ opacity: 0 })),
    state("visible", style({ opacity: 1 })),
    transition("hidden => visible", [
      animate(".2s ease-in")
    ]),
    transition("visible => hidden", [
      animate(".2s ease-out")
    ])
  ]);