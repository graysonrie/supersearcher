import {
  AfterContentInit,
  Component,
  ContentChildren,
  QueryList,
  Renderer2,
} from "@angular/core";
import { IconifyIconComponent } from "../IconifyIcons/iconify.icon.component";

@Component({ 
  selector: "iconify-icon-cluster",
  standalone: true,
  imports: [],
  templateUrl: "./iconify-icon-cluster.component.html",
  styleUrl: "./iconify-icon-cluster.component.css",
})
export class IconifyIconClusterComponent implements AfterContentInit {
  @ContentChildren(IconifyIconComponent)
  projectedComponents: QueryList<IconifyIconComponent> = new QueryList();

  constructor(private renderer: Renderer2){}

  ngAfterContentInit() {
    const componentsArray = this.projectedComponents.toArray();

    // Loop through all components except the first one
    componentsArray.slice(1).forEach((component) => {
      const hostElement = component.hostElement.nativeElement;
      const top:number = component.alignment?.top ?? 0;
      const left:number = component.alignment?.left ?? 0;

      // Apply a specific style using Renderer2
      this.renderer.setStyle(hostElement, 'position', 'absolute');
      this.renderer.setStyle(hostElement, 'top', `${top}em`);
      this.renderer.setStyle(hostElement, 'left', `${left}em`);
    });
  }
}
