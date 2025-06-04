import { Injectable, OnDestroy } from "@angular/core";
import { DirectoryNavigatorService } from "../../../services/directory-navigator.service";
import { BehaviorSubject, Subscription } from "rxjs";

@Injectable()
export class TabsService implements OnDestroy {
  private subscription = new Subscription();
  private activeIndexSubject = new BehaviorSubject<number>(0);
  activeIndex$ = this.activeIndexSubject.asObservable();

  private openPathsSubject = new BehaviorSubject<string[]>([]);
  openPaths$ = this.openPathsSubject.asObservable();

  constructor(private directoryNavService: DirectoryNavigatorService) {
    this.subscription.add(
      this.directoryNavService.currentDir$.subscribe((x) => {
        if (x.length != 0) {
          this.updateTab(this.activeIndexSubject.getValue(), x);
          if (this.openPathsSubject.getValue().length == 0) {
            this.openPathsSubject.next([x]);
          }
        }
      })
    );
  }

  addTab(path?: string) {
    const dir = path ?? "Home";
    const openPaths = this.openPathsSubject.getValue();
    openPaths.push(dir);
    this.openPathsSubject.next(openPaths);

    this.activeIndexSubject.next(openPaths.length - 1);
    this.directoryNavService.setCurrentDir(dir);
  }

  navigateToTab(index:number) {
    this.activeIndexSubject.next(index);
    const openPaths = this.openPathsSubject.getValue();
    this.directoryNavService.setCurrentDir(openPaths[index]);
  }

  updateTab(index:number, path:string) {
    const openPaths = this.openPathsSubject.getValue();
    openPaths[index] = path;
    this.openPathsSubject.next(openPaths);
  }

  removeTab(index:number) {
    const openPaths = this.openPathsSubject.getValue();
    openPaths.splice(index, 1);
    this.openPathsSubject.next(openPaths);
    if(this.activeIndexSubject.getValue() === index){
      this.navigateToTab(index - 1);
    }
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe;
  }
}
