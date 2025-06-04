import {
  AfterViewInit,
  Component,
  ElementRef,
  HostListener,
  Input,
  OnDestroy,
  OnInit,
} from "@angular/core";
import { WindowEventsService } from "@core/services/window/window-events.service";
import { BehaviorSubject, Subscription } from "rxjs";

@Component({
  selector: "app-extend-bar-vertical",
  standalone: true,
  imports: [],
  templateUrl: "./extend-bar-vertical.component.html",
  styleUrl: "./extend-bar-vertical.component.css",
})
export class ExtendBarVerticalComponent implements OnInit, OnDestroy {
  private subscription = new Subscription();

  @Input() direction: "left" | "right" = "right";
  @Input() minWidth: number = 100;
  @Input() startingWidth: number = 100;

  private windowDimensions = { width: 0, height: 0 };

  private contentWidthSubject = new BehaviorSubject<number>(this.minWidth);
  contentWidth$ = this.contentWidthSubject.asObservable();

  private isDragging = false;
  private startX = 0;

  constructor(
    private windowService: WindowEventsService,
    private elRef: ElementRef
  ) {}

  ngOnInit(): void {
    const w =
      this.startingWidth < this.minWidth ? this.minWidth : this.startingWidth;
    this.contentWidthSubject.next(w);

    this.subscription.add(
      this.windowService.windowDimensions$.subscribe((dim) => {
        this.windowDimensions = dim;
        // Clamp based on the window width:
        this.clampWindow();
      })
    );
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

  startDrag(event: MouseEvent): void {
    this.isDragging = true;
    this.startX = event.clientX; // Record the starting X position
    event.preventDefault(); // Prevent text selection or other default behaviors
  }

  @HostListener("document:mousemove", ["$event"])
  onDrag(event: MouseEvent): void {
    if (!this.isDragging) return;

    // Calculate the change in X position
    let deltaX = this.startX - event.clientX;
    if (this.direction == "right") deltaX *= -1;
    this.startX = event.clientX;

    const draggingLeft = deltaX < 0;
    const cursorPos = this.getRelativeMousePos(event);

    if (
      (draggingLeft && cursorPos == "left") ||
      (!draggingLeft && cursorPos == "right")
    ) {
      const contentWidthValue = this.contentWidthSubject.getValue();
      this.contentWidthSubject.next(
        Math.max(this.minWidth, contentWidthValue + deltaX)
      );
      this.clampWindow();
    }
  }

  // Stop dragging when the user releases the mouse button
  @HostListener("document:mouseup")
  stopDrag(): void {
    this.isDragging = false;
  }

  getRelativeMousePos(event: MouseEvent): "left" | "right" {
    const rect = this.elRef.nativeElement.getBoundingClientRect();
    const cursorX = event.clientX;

    if (cursorX < rect.left + rect.width / 2) {
      return "left";
    } else {
      return "right";
    }
  }

  private clampWindow() {
    const windowWidth = this.windowDimensions.width;

    const contentWidth = this.contentWidthSubject.getValue();
    if (
      (this.direction == "right" && contentWidth > windowWidth) ||
      (this.direction == "left" && contentWidth < windowWidth)
    ) {
      this.contentWidthSubject.next(windowWidth);
    }
  }
}
