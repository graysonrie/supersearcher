import { Directive, ElementRef, HostListener, Renderer2 } from "@angular/core";

@Directive({ selector: "[appHideOverflow]", standalone: true })
export class HideOverflowDirective {
  private minWidth = 0;
  constructor(private el: ElementRef, private renderer: Renderer2) {}

  @HostListener("window:resize") onResize() {
    this.checkOverflow();
  }

  ngAfterViewInit() {
    this.checkOverflow();
  }

  private checkOverflow() {
    const button = this.el.nativeElement as HTMLElement;
    const parent = button.parentElement;
    const text = button.querySelector(".text") as HTMLElement;
    if ((text.scrollWidth + 32) > button.offsetWidth) {
      this.renderer.setStyle(text, "display", "none");
      this.minWidth = button.offsetWidth;
    } else {
      if (button.offsetWidth > this.minWidth)
        this.renderer.setStyle(text, "display", "inline");
    }
  }
}
