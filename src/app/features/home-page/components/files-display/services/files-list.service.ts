import { Injectable } from "@angular/core";
import { defaultFileState, FileState } from "../../file-result/file-state";
import { BehaviorSubject, Observable } from "rxjs";
import { FileModel } from "@core/models/file-model";

@Injectable()
export class FilesListService {
  private fileStates = new Map<FileModel, BehaviorSubject<FileState>>();
  private filesSubject = new BehaviorSubject<FileModel[]>([]);
  private statesSubject = new BehaviorSubject<FileState[]>([]);

  constructor() {}

  /** Get current state or create a new reactive state for a file */
  private getOrCreateFileStateSubject(
    file: FileModel
  ): BehaviorSubject<FileState> {
    if (!this.fileStates.has(file)) {
      const initialState = defaultFileState();
      this.fileStates.set(file, new BehaviorSubject(initialState));
      this.emitFileStates(); // Emit the updated map
    }
    return this.fileStates.get(file)!;
  }

  /** Update or add a file state reactively */
  updateFileState(file: FileModel, state: Partial<FileState>) {
    const subject = this.getOrCreateFileStateSubject(file);
    const currentState = subject.value;
    subject.next({ ...currentState, ...state });
    this.emitFileStates(); // Emit the updated map
  }

  /** Removes all current files and replaces them with new ones */
  setFiles(files: FileModel[]) {
    // Complete old state subjects
    this.fileStates.forEach((subject) => subject.complete());
    this.fileStates.clear();

    // Add new files with default states
    files.forEach((file) => this.getOrCreateFileStateSubject(file));

    // Notify observers of the new list of files
    this.filesSubject.next(files);
    this.emitFileStates(); // Emit the updated map
  }

  /** Observe the state of a specific file */
  observeFileState(file: FileModel): Observable<FileState> {
    return this.getOrCreateFileStateSubject(file).asObservable();
  }

  /** Observe the entire list of files */
  observeAllFiles(): Observable<FileModel[]> {
    return this.filesSubject.asObservable();
  }

  /** Observe the entire list of file states */
  observeAllStates(): Observable<FileState[]> {
    return this.statesSubject.asObservable();
  }

  /** Emit the current snapshot of the fileStates map */
  private emitFileStates() {
    let states:FileState[] = [];
    this.fileStates.forEach((stateSubject, _) =>{
      states.push(stateSubject.value);
    });
    this.statesSubject.next(states);
  }
}
