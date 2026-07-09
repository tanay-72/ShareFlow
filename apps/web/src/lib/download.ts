// Mobile browsers (notably iOS Safari) frequently ignore a cross-origin
// `Content-Disposition: attachment` header for previewable content types
// (images, PDFs, video) and just navigate to display the file inline
// instead of saving it. Fetching the bytes ourselves and handing the
// browser a same-origin `blob:` URL with the HTML `download` attribute
// forces an actual save on every browser that matters, at the cost of
// buffering the file in memory — which is why this is only used below a
// size threshold; larger files fall back to direct navigation so a 2GB
// download doesn't have to fit in a mobile tab's JS heap.
const BLOB_DOWNLOAD_MAX_BYTES = 100 * 1024 * 1024; // 100MB

export async function triggerDownload(url: string, filename: string, sizeBytes: number): Promise<void> {
  if (sizeBytes > BLOB_DOWNLOAD_MAX_BYTES) {
    window.location.href = url;
    return;
  }

  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Download failed with status ${response.status}`);
    }

    const blob = await response.blob();
    const objectUrl = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = objectUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(objectUrl);
  } catch {
    // Fetch/blob failed for any reason (e.g. an in-between network hiccup) — direct
    // navigation is strictly less reliable for forcing a save, but still lets the
    // download succeed rather than leaving the user with nothing.
    window.location.href = url;
  }
}
