import { Component } from "@angular/core";
import { SliderComponent } from "../../../../../shared/components/sliders/slider/slider.component";
import { IconifyIconModule } from "../../../../../shared/components/icons/IconifyIcons/icon.module";
import { CommonModule } from "@angular/common";

@Component({
  selector: "app-set-crawlers-amt",
  standalone: true,
  imports: [IconifyIconModule, CommonModule],
  templateUrl: "./set-crawlers-amt.component.html",
  styleUrl: "./set-crawlers-amt.component.css",
})
export class SetCrawlersAmtComponent {
  settings = ["None", "Quiet", "Moderate", "Heavy"];
}
