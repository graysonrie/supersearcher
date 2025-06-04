import { Component, HostListener, Input, OnInit } from '@angular/core';
import { BehaviorSubject, min } from 'rxjs';

@Component({
  selector: 'app-extend-bar',
  standalone: true,
  imports: [],
  templateUrl: './extend-bar.component.html',
  styleUrl: './extend-bar.component.css'
})
export class ExtendBarComponent implements OnInit {

  @Input() minWidth: number = 100;

  private contentWidthSubject = new BehaviorSubject<number>(this.minWidth);
  contentWidth$ = this.contentWidthSubject.asObservable();

  private isDragging = false;
  private startX = 0;

  ngOnInit(): void {
    // Immediately output the width that the content should be
    this.contentWidthSubject.next(this.minWidth);
  }

  startDrag(event: MouseEvent): void {
    this.isDragging = true;
    this.startX = event.clientX; // Record the starting X position
    event.preventDefault(); // Prevent text selection or other default behaviors
  }

  @HostListener('document:mousemove', ['$event'])
  onDrag(event: MouseEvent): void {
    if (!this.isDragging) return;

    // Calculate the change in X position
    const deltaX = this.startX - event.clientX;
    this.startX = event.clientX;

    const contentWidthValue = this.contentWidthSubject.getValue();
    this.contentWidthSubject.next(Math.max(this.minWidth, contentWidthValue + deltaX));

  }

  // Stop dragging when the user releases the mouse button
  @HostListener('document:mouseup')
  stopDrag(): void {
    this.isDragging = false;
  }
}
