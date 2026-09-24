import { Directory, File, Paths } from 'expo-file-system';

/**
 * All footage is copied into <document>/media so it survives cache purges.
 * We persist only file *names*: iOS changes the app container path across
 * reinstalls and updates, so absolute URIs must be rebuilt at runtime.
 */
function mediaDir(): Directory {
  const dir = new Directory(Paths.document, 'media');
  if (!dir.exists) dir.create({ intermediates: true, idempotent: true });
  return dir;
}

export function mediaUri(fileName: string): string {
  return new File(mediaDir(), fileName).uri;
}

export function mediaExists(fileName: string): boolean {
  try {
    return new File(mediaDir(), fileName).exists;
  } catch {
    return false;
  }
}

function extensionOf(uri: string, fallback: string): string {
  const match = /\.([a-z0-9]{2,5})(?:\?|$)/i.exec(uri);
  return match ? match[1].toLowerCase() : fallback;
}

/** Copies a picker/camera result into the media directory and returns its stored name + size. */
export async function copyIntoMedia(
  sourceUri: string,
  baseName: string,
  fallbackExt = 'mov',
): Promise<{ fileName: string; sizeBytes: number | null }> {
  const fileName = `${baseName}.${extensionOf(sourceUri, fallbackExt)}`;
  const source = new File(sourceUri);
  if (!source.exists) throw new Error('The selected video is no longer available on this device.');
  const target = new File(mediaDir(), fileName);
  await source.copy(target, { overwrite: true });
  let sizeBytes: number | null = null;
  try {
    sizeBytes = target.size;
  } catch {
    // size is best-effort metadata
  }
  return { fileName, sizeBytes };
}

export function deleteMediaFile(fileName: string | null | undefined): void {
  if (!fileName) return;
  try {
    const file = new File(mediaDir(), fileName);
    if (file.exists) file.delete();
  } catch (error) {
    console.warn('Failed to delete media file', fileName, error);
  }
}

/** Total bytes used by stored footage (for Settings). */
export function mediaUsageBytes(): number {
  try {
    // Directory.size can be null on some platforms; sum the files instead.
    return mediaDir()
      .list()
      .reduce((total, entry) => total + (entry instanceof File ? entry.size || 0 : 0), 0);
  } catch {
    return 0;
  }
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024 * 1024) return `${Math.max(0, Math.round(bytes / 1024))} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}
