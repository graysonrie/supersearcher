import { Injectable } from "@angular/core";
import { FileModel } from "../../../models/file-model";
import { BehaviorSubject } from "rxjs";
import { StreamingSearchParamsDTO } from "../../../dtos/streaming-search-params-dtos";
import { TauriCommandsService } from "../../tauri/commands.service";
import { SearchParamsDTO } from "@core/dtos/search-params-dto";
import { isLetter } from "@shared/util/string";

interface QueryModifiers {
  nameMustStartWith?: string;
}
@Injectable({ providedIn: "root" })
export class LocalStreamingSearchService {
  private filesSubject = new BehaviorSubject<FileModel[]>([]);
  public files$ = this.filesSubject.asObservable();

  private searchFilterLabelsSubject = new BehaviorSubject<string[]>([]);
  public searchFilterLabels$ = this.searchFilterLabelsSubject.asObservable();

  private lastSearchParamsSubject = new BehaviorSubject<
    StreamingSearchParamsDTO | undefined
  >(undefined);
  lastSearchParams$ = this.lastSearchParamsSubject.asObservable();

  constructor(private commandsService: TauriCommandsService) {}

  clearResults() {
    this.filesSubject.next([]);
  }

  async query(p: StreamingSearchParamsDTO) {
    const {newParams,modifier} = this.modifyQueryBasedOnKeywordsIncluded(p);
    const params = newParams;
    console.log("New params", params);

    this.filesSubject.next([]);
    this.lastSearchParamsSubject.next(p);
    const innerParams = params.Params;
    // Because fuzzy queries have a tendency to return junk results when a low character
    // count is given, ignore calling the query altogether if the word length doesn't suffice
    if (
      innerParams.QueryType === "Fuzzy" &&
      !this.fuzzyQueryIsAdequate(innerParams)
    )
      return; // Early return
    await this.commandsService.searchIndexQueryStreaming(
      params,
      async (emittedFiles) => {
        // Check if the emitted result corresponds to the correct query.
        // The query string is stored in the metadata field
        if (emittedFiles.Metadata == params.Params.FilePath) {
          const currentFiles = this.filesSubject.getValue();

          let okFiles = emittedFiles.Data;
          // Apply modifications to filter out results if needed
          if(modifier && modifier.nameMustStartWith){
            okFiles = okFiles.filter(x=>x.FilePath.startsWith(modifier.nameMustStartWith!));
            // ! Assuming that nameMustStartWith is only used to search with drives:
            this.searchFilterLabelsSubject.next([`${modifier.nameMustStartWith} drive`])
          }else{
            this.searchFilterLabelsSubject.next([]);
          }
          this.filesSubject.next([...currentFiles, ...okFiles]);
        }
      }
    );
    //await this.ensureFilesExist();
  }
  /** Returns a copy of the search params */
  private modifyQueryBasedOnKeywordsIncluded(
    params: StreamingSearchParamsDTO
  ): { newParams: StreamingSearchParamsDTO; modifier?: QueryModifiers } {
    const query = params.Params.FilePath;

    if (query && isLetter(query[0]) && query[1] == ":") {
      const driveLetter = query[0].toUpperCase();
      const drive = `${driveLetter}:`;
      const queryWithoutDrive = query.substring(2).trim();
      return {
        newParams: {
          ...params,
          Params: {
            ...params.Params,
            // Include the drive letter in the query to help filter out results
            FilePath: `${driveLetter} ${queryWithoutDrive}`,
          },
        },
        modifier: {
          nameMustStartWith: drive,
        },
      };
    }
    return { newParams: params, modifier: undefined };
  }

  private fuzzyQueryIsAdequate(params: SearchParamsDTO): boolean {
    const minLen = 4;
    if (params.FilePath !== undefined && params.FilePath.length < minLen) {
      return false;
    }
    if (params.Name !== undefined && params.Name.length < minLen) {
      return false;
    }
    return true;
  }

  /** Ensures that the files in the files variable exist in the file system. */
  async ensureFilesExist() {
    const files = this.filesSubject.getValue();
    files.forEach(async (file) => {
      if (!(await this.commandsService.validateFileExists(file.FilePath))) {
        console.log(`File ${file.FilePath} does not exist in the file system.`);
        this.filesSubject.next(
          this.filesSubject
            .getValue()
            .filter((f) => f.FilePath !== file.FilePath)
        );
      }
    });
  }
}
