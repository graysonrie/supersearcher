import { FileModel } from "./file-model";
import { BehaviorSubject, Observable } from "rxjs";

export interface Session {
  directory: string;
  files: FileModel[];
  inactiveSubject: BehaviorSubject<boolean>;
  inactive$: Observable<boolean>;
}
