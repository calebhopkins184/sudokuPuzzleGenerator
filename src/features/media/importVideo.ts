import * as ImagePicker from 'expo-image-picker';
import { File } from 'expo-file-system';
import * as VideoThumbnails from 'expo-video-thumbnails';
import { Platform } from 'react-native';

import type { MediaRef } from '@/features/sessions/types';
import { createId } from '@/lib/id';

import { copyIntoMedia, deleteMediaFile } from './mediaFiles';

export type ImportSource = 'library' | 'camera';

export type PermissionResult = 'granted' | 'denied' | 'blocked';

/**
 * The photo library picker (PHPicker on iOS 14+) runs out of process and needs no
 * permission. Recording needs the camera; iOS asks for the microphone itself
 * using the NSMicrophoneUsageDescription string when capture starts.
 */
export async function ensurePermission(source: ImportSource): Promise<PermissionResult> {
  if (source === 'library') return 'granted';
  const current = await ImagePicker.getCameraPermissionsAsync();
  if (current.granted) return 'granted';
  if (!current.canAskAgain) return 'blocked';
  const requested = await ImagePicker.requestCameraPermissionsAsync();
  if (requested.granted) return 'granted';
  return requested.canAskAgain ? 'denied' : 'blocked';
}

/**
 * Where we can honestly compress. Only iOS camera capture exposes a supported
 * quality setting; library export presets are deprecated and ignored by PHPicker,
 * so we report them as unsupported instead of pretending.
 */
export function compressionSupported(source: ImportSource): boolean {
  return Platform.OS === 'ios' && source === 'camera';
}

export type PickResult =
  { kind: 'picked'; asset: ImagePicker.ImagePickerAsset } | { kind: 'canceled' };

export async function pickVideo(source: ImportSource, compress: boolean): Promise<PickResult> {
  const options: ImagePicker.ImagePickerOptions = {
    mediaTypes: 'videos',
    allowsEditing: false,
    quality: 1,
    // Keep the original representation; transcoding silently would change the footage.
    preferredAssetRepresentationMode:
      ImagePicker.UIImagePickerPreferredAssetRepresentationMode.Current,
  };
  if (source === 'camera' && compress && compressionSupported('camera')) {
    options.videoQuality = ImagePicker.UIImagePickerControllerQualityType.Medium;
  }
  const result =
    source === 'camera'
      ? await ImagePicker.launchCameraAsync(options)
      : await ImagePicker.launchImageLibraryAsync(options);
  if (result.canceled || !result.assets?.[0]) return { kind: 'canceled' };
  return { kind: 'picked', asset: result.assets[0] };
}

/** Copies a picked asset into app storage and builds a MediaRef. Throws with a readable message. */
export async function importAsset(
  asset: ImagePicker.ImagePickerAsset,
  source: ImportSource,
  compressed: boolean,
): Promise<MediaRef> {
  if (asset.type && asset.type !== 'video') {
    throw new Error('That file is not a video. Choose a video to review.');
  }
  const id = createId('media');
  const { fileName, sizeBytes } = await copyIntoMedia(asset.uri, id);

  let thumbFileName: string | null = null;
  try {
    const thumb = await VideoThumbnails.getThumbnailAsync(asset.uri, { time: 1000, quality: 0.6 });
    thumbFileName = (await copyIntoMedia(thumb.uri, `${id}-thumb`, 'jpg')).fileName;
    new File(thumb.uri).delete();
  } catch {
    // A thumbnail is nice-to-have; the list falls back to an icon.
  }

  if (sizeBytes === 0) {
    deleteMediaFile(fileName);
    deleteMediaFile(thumbFileName);
    throw new Error('The video copied as an empty file. Try importing it again.');
  }

  return {
    id,
    fileName,
    thumbFileName,
    source,
    originalName: asset.fileName ?? null,
    durationSec: asset.duration ? asset.duration / 1000 : null,
    width: asset.width || null,
    height: asset.height || null,
    sizeBytes,
    compressed,
    createdAt: new Date().toISOString(),
  };
}
