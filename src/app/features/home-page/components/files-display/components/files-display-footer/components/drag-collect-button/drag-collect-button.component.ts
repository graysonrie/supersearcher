import { CommonModule } from '@angular/common';
import { IconifyIconModule } from '@shared/components/icons/IconifyIcons/icon.module';
import { Component } from '@angular/core';
import { createDebouncedEase } from '@shared/util/ease-value';
import { fadeInOnEnterAnimation } from '@shared/animations/fade-in-on-enter.animation';

const DEFAULT_FOOTER_SIZE = 32;
@Component({
  selector: 'app-drag-collect-button',
  standalone: true,
  imports: [CommonModule, IconifyIconModule],
  templateUrl: './drag-collect-button.component.html',
  styleUrl: './drag-collect-button.component.css',
  animations:[fadeInOnEnterAnimation]
})
export class DragCollectButtonComponent {
  _footerSize = DEFAULT_FOOTER_SIZE;
  _isExpanding = false;
  debouncedResize = createDebouncedEase(200);
  private didLeave = false;
  private didFinish = false;

  onDragAndCollectMouseEnter(){
    this.didLeave = false;
    this.didFinish = false;
    this._isExpanding = true;
    this.debouncedResize({
      startValue: this._footerSize,
      endValue: 100,
      easing: "easeOut",
      onUpdate: (n: number) => {
        this._footerSize = n;
      },
      onComplete:()=>{
        this.didFinish = true;
        if(this.didLeave){
          this.resetFooterSize();
        }
      }
    });
  }

  onDragAndCollectMouseLeave() {
    this.didLeave = true;
    if(this.didFinish){
      this.resetFooterSize();
    }
  }

  private resetFooterSize() {
    this.debouncedResize({
      startValue: this._footerSize,
      endValue: DEFAULT_FOOTER_SIZE,
      easing: "easeOut",
      onUpdate: (n: number) => {
        this._footerSize = n;
      },
      onComplete:()=>{
        this._isExpanding = false;
      }
    });
  }
}
