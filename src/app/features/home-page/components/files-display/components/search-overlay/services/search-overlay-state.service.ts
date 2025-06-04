import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable()
export class SearchOverlayStateService {
    private isVisibleSubject = new BehaviorSubject<boolean>(false);
    isVisible$ = this.isVisibleSubject.asObservable();

    constructor() { }
    
    setVisibility(visible:boolean){
        this.isVisibleSubject.next(visible);
    }
}