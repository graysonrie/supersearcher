import { Injectable, Renderer2, RendererFactory2 } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class ColorThemeService {
  private renderer: Renderer2;
  private themeClass: string | null = null;

  constructor(private rendererFactory: RendererFactory2) {
    this.renderer = this.rendererFactory.createRenderer(null, null);
  }

  /** Example: `light-theme`, `dark-theme` */
  setTheme(themeName: string): void {
    if (this.themeClass) {
      this.renderer.removeClass(document.documentElement, this.themeClass);
    }
    this.themeClass = themeName;
    this.renderer.addClass(document.documentElement, themeName);
  }

  getCurrentTheme(): string | null {
    return this.themeClass;
  }
}