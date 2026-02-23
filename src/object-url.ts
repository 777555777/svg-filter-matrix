const trackedObjectUrls = new Set<string>();

function isBlobUrl(url: string): boolean {
  return url.startsWith('blob:');
}

export function trackObjectUrl(url: string): string {
  if (isBlobUrl(url)) trackedObjectUrls.add(url);
  return url;
}

export function revokeTrackedObjectUrl(url: string): void {
  if (!isBlobUrl(url)) return;
  if (!trackedObjectUrls.delete(url)) return;
  URL.revokeObjectURL(url);
}

export function pruneTrackedObjectUrls(liveUrls: Iterable<string>): void {
  const live = new Set<string>();
  for (const url of liveUrls) {
    if (isBlobUrl(url)) live.add(url);
  }

  for (const url of Array.from(trackedObjectUrls)) {
    if (live.has(url)) continue;
    trackedObjectUrls.delete(url);
    URL.revokeObjectURL(url);
  }
}
