import { Injectable, OnDestroy } from "@angular/core";
import { Subject } from "rxjs";

/** Watches for CSS class changes in the app's `:root` element.
 * 
 * If a change is detected, it is emitted via the `changes$` observable
 */
@Injectable({ providedIn: "root" })
export class CssObserverService implements OnDestroy {
  private observer: MutationObserver | null = null;

  private changesSubject = new Subject<void>();
  changes$ = this.changesSubject.asObservable();

  constructor() {
    const rootElement = document.documentElement; // This refers to the :root element

    this.observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (
          mutation.type === "attributes" &&
          mutation.attributeName === "class"
        ) {
          this.changesSubject.next();
          console.log("Class attribute changed on :root");
          console.log("New class list:", rootElement.className);
        }
      });
    });

    // Configure the observer to watch for attribute changes
    this.observer.observe(rootElement, {
      attributes: true, // Watch for attribute changes
      attributeFilter: ["class"], // Only observe the 'class' attribute
    });
  }

  ngOnDestroy() {
    // Disconnect the observer when the component is destroyed
    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
    }
  }
}
