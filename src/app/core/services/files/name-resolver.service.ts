import { Injectable } from '@angular/core';

@Injectable({providedIn: 'root'})
export class FileNameResolverService {

    constructor() { }
    
    getFileNameFromFullPath(fullPath:string){
        if(fullPath.endsWith('\\')){
            fullPath = fullPath.slice(0, -1);
        }
        return fullPath.split('\\').pop() ?? "";
    }
}