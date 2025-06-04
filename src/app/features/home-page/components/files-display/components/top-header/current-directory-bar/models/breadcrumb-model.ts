export interface BreadcrumbModel{
    // e.g. C:/ACAD/METADATA
    fullPath: string;
    // e.g. ACAD
    section:string;
    /** If this list is populated at all, then a '>' will be rendered rather than the actual `section` */
    prevPaths:string[]
}