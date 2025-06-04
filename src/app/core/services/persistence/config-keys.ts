import { CrawlerSettingsModel } from "@core/models/crawler-settings";
import { FileModel } from "../../models/file-model";

/**
 * These items lazily exist in the local db's KV Store
 *
 * This interface should never be constructed
 */
export interface ConfigKeys {
  /** `true` if it is the user's first time opening the app */
  isFirstUse: boolean;
  moveItemsDontAskAgain: boolean;
  pinnedFiles: FileModel[];
  /** A list of file paths that should be easy for the user to access. (example: Downloads, Desktop, etc) */
  quickAccessFiles: string[];
  lastDirectoryAt: string;

  crawlerDirectoryNamesExclude:string[],
  /** NOTE: The extensions should not have a leading dot */
  crawlerWhitelistedExtensions:string[],
  /** NOTE: The extensions should not have a leading dot */
  crawlerBlacklistedExtensions:string[],
  crawlerSettings:CrawlerSettingsModel,
}