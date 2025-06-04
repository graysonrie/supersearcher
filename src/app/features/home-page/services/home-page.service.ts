import { Injectable } from "@angular/core";
import { BehaviorSubject } from "rxjs";

export type SubPage = "main" | "extendedSearch" | "settings";

@Injectable()
export class HomePageService {
    private pageSubject = new BehaviorSubject<SubPage>("main");
    page$ = this.pageSubject.asObservable();

    setPage(page: SubPage) {
        this.pageSubject.next(page);
    }
}