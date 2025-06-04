import { HostListener, Injectable, NgZone } from "@angular/core";
import { BehaviorSubject } from "rxjs";

interface Dimensions{
  width:number,
  height:number
}

@Injectable({ providedIn: "root" })
export class WindowEventsService {
  private windowDimensionsSubject = new BehaviorSubject<Dimensions>({width:window.innerWidth,height:window.innerHeight});
  windowDimensions$ = this.windowDimensionsSubject.asObservable();

  constructor(private zone:NgZone){
    this.zone.runOutsideAngular(() => {
      window.addEventListener("resize", this.onResize.bind(this));
    });
  }

  private onResize(event: Event): void {
    this.updateWindowSize();
  }

  private updateWindowSize(): void {
    this.windowDimensionsSubject.next({width: window.innerWidth, height: window.innerHeight});
  }
}