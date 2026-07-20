export function normalizeDirectoryPathForComparison(path: string): string {
  return path.replace(/[\\/]+$/, "").replace(/\//g, "\\").toLowerCase();
}
