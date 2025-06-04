import {
  Component,
  ElementRef,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  SimpleChanges,
} from "@angular/core";
import { IconService } from "./icon.service";
import { Subscription } from "rxjs";
import { CssObserverService } from "@core/services/misc/css-observer.service";

interface Alignment {
  top: number;
  left: number;
  align: "top-left" | "top-right" | "bottom-left" | "bottom-right";
}

/**
 * ### Usage example:
 *
 * ```<iconify-icon icon="hardDrive" size="1.2em" color="#fff" />```
 *
 * ### You are also able to pass in a CSS variable for the color:
 *
 * ```<iconify-icon icon="hardDrive" size="1.2em" color="--background-color" />```
 *
 * ### To use a linear gradient, you can pass in two colors:
 *
 * ```<iconify-icon icon="hardDrive" size="1.2em" color="--first-color --second-color" />```
 */
@Component({
  selector: "iconify-icon",
  template: `<div [innerHTML]="svgIcon | safeHtml" class="content" ></div>`,
  styles: [],
  styleUrl: "./iconify-icon.component.css",
  providers: [],
})
export class IconifyIconComponent implements OnInit, OnChanges, OnDestroy {
  subscription = new Subscription();
  @Input() icon: string = "default";
  @Input() size: string | undefined;
  @Input() color: string | undefined;
  /** This property does nothing unless this icon is inside an `iconify-icon-cluster` element */
  @Input() alignment: Alignment | undefined;
  svgIcon: string = "";

  constructor(
    public hostElement: ElementRef,
    private iconService: IconService,
    private styleChangeService: CssObserverService
  ) {}

  ngOnInit(): void {
    this.updateIcon();
    this.subscription.add(
      this.styleChangeService.changes$.subscribe((_) => this.updateIcon())
    );
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes["icon"] || changes["size"] || changes["color"]) {
      this.updateIcon();
    }
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

  private updateIcon() {
    this.svgIcon = this.iconService.getIcon(this.icon, this.size, this.color);
  }
}
