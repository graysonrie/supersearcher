import { Component, Input } from '@angular/core';
import { IconifyIconModule } from "../../icons/IconifyIcons/icon.module";

/** Same as the `button-w-icon` component, but rather than using an iconify icon, you'll
 * pass in a path to an svg, such as `assets/icons/icon.svg`
 */
@Component({
  selector: 'app-button-w-svg',
  standalone: true,
  imports: [IconifyIconModule],
  templateUrl: './button-w-svg.component.html',
  styleUrl: './button-w-svg.component.css'
})
export class ButtonWSvgComponent {
  @Input() svgSrc:string = "";
}
 