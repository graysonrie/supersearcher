import { Component, ElementRef, HostBinding, Input, OnChanges, OnInit } from '@angular/core';
import { trigger, state, style, transition, animate } from '@angular/animations';
import { CommonModule } from '@angular/common';

/** 
 *  A component that fades in when it becomes visible to the user
 * 
 *  ### Usage example:
 * 
 * `<app-fade-in>
 *     <div/>
 * </app-fade-in>`
*/
@Component({
  selector: 'app-fade-in',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './fade-in.component.html',
  styleUrl: './fade-in.component.css',
  animations: [
    trigger('fadeIn', [
      state('hidden', style({ opacity: 0 })),
      state('visible', style({ opacity: 1 })),
      transition('hidden => visible', [animate('0.2s ease-in')]),
    ])
  ]
})
export class FadeInComponent implements OnInit, OnChanges {
  @Input() isVisible = false; // Can be controlled by parent component
  @HostBinding('@fadeIn') animationState!: string;

  constructor(private el: ElementRef) {}

  ngOnInit() {
    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry.isIntersecting) {
          this.setAnimationState(true);
          observer.disconnect(); // Stop observing after animation starts
        }
      },
      { threshold: 0.2 } // Adjust threshold as needed
    );

    observer.observe(this.el.nativeElement);
  }

  ngOnChanges() {
    // React to changes in isVisible input
    this.setAnimationState(this.isVisible);
  }

  private setAnimationState(isVisible: boolean) {
    this.isVisible = isVisible;
    this.animationState = isVisible ? 'visible' : 'hidden';
  }
}