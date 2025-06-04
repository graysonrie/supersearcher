import {
  ComponentRef,
  Directive,
  ElementRef,
  Inject,
  HostListener,
  Input,
  OnDestroy,
  Renderer2,
  ViewContainerRef,
} from "@angular/core";
import { DOCUMENT } from '@angular/common';
import { TooltipComponent } from "./tooltip.component";

@Directive({
  selector: '[appTooltip]',
  standalone: true,
})
export class TooltipDirective implements OnDestroy {
  @Input('appTooltip') text: string = '';
  private componentRef: ComponentRef<TooltipComponent> | null = null;
  private tooltipElement: HTMLElement | null = null;

  constructor(
    private viewContainer: ViewContainerRef,
    private renderer: Renderer2,
    private el: ElementRef,
    @Inject(DOCUMENT) private document: Document
  ) {}

  @HostListener('mouseenter') onMouseEnter() {
    if (!this.componentRef) {
      this.componentRef = this.viewContainer.createComponent(TooltipComponent);
      this.componentRef.instance.text = this.text;

      // Attach tooltip to body
      this.tooltipElement = this.componentRef.location.nativeElement;
      this.renderer.appendChild(this.document.body, this.tooltipElement);

      // Position the tooltip
      const hostPos = this.el.nativeElement.getBoundingClientRect();
      const tooltipPos = this.tooltipElement?.getBoundingClientRect();

      const top = hostPos.top + window.scrollY + hostPos.height;
      const left = hostPos.left + window.scrollX + (hostPos.width - (tooltipPos?.width ?? 0)) / 2;

      this.renderer.setStyle(this.tooltipElement, 'position', 'absolute');
      this.renderer.setStyle(this.tooltipElement, 'top', `${top}px`);
      this.renderer.setStyle(this.tooltipElement, 'left', `${left}px`);
      this.renderer.setStyle(this.tooltipElement, 'z-index', '9999');
    }
  }

  @HostListener('mouseleave') onMouseLeave() {
    if (this.componentRef) {
      this.componentRef.destroy();
      this.componentRef = null;
    }
    if (this.tooltipElement) {
      this.renderer.removeChild(this.document.body, this.tooltipElement);
      this.tooltipElement = null;
    }
  }

  ngOnDestroy() {
    if (this.componentRef) {
      this.componentRef.destroy();
    }
    if (this.tooltipElement) {
      this.renderer.removeChild(this.document.body, this.tooltipElement);
    }
  }
}
