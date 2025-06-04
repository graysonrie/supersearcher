import { Component, Input, OnChanges, ViewEncapsulation } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

@Component({
  selector: 'app-highlightable-label',
  standalone: true,
  imports: [],
  templateUrl: './highlightable-label.component.html',
  styleUrl: './highlightable-label.component.css',
  encapsulation: ViewEncapsulation.None
})
export class HighlightableLabelComponent implements OnChanges {
  @Input() text: string = ''; // Text to display
  @Input() highlight: string = ''; // Text to highlight

  highlightedText: SafeHtml = ''; // HTML string with highlights

  constructor(private sanitizer: DomSanitizer) { }

  ngOnChanges(): void {
    this.highlightedText = this.getHighlightedText();
  }

  private getHighlightedText(): SafeHtml {
    if (!this.highlight) return this.text;

    const regex = new RegExp(`(${this.highlight})`, 'gi');
    const highlighted = this.text.replace(
      regex,
      `<span class="highlight">$1</span>`
    );

    const html = this.sanitizer.bypassSecurityTrustHtml(highlighted);
    return html;
  }
}