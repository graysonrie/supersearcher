import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SafeHtmlPipe } from './safehtml.pipe';
import { IconifyIconComponent } from './iconify.icon.component';

@NgModule({
  declarations: [
    IconifyIconComponent,
    SafeHtmlPipe   // Declare the pipe here
  ],
  imports: [
    CommonModule   // Import CommonModule for Angular directives like *ngIf, *ngFor
  ],
  exports: [
    IconifyIconComponent  // Export any component that will be used outside the feature module
  ]
})
export class IconifyIconModule {}