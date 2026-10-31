import { addDoc, collection, doc, getDoc, serverTimestamp } from 'firebase/firestore/lite';
import { useEffect, useState } from 'react';
import { db } from './firebase';

/*
 * Free photo uploads without Cloud Storage (which needs the paid Blaze plan):
 * the dashboard shrinks a photo in the browser and stores it as a data URL in the
 * `media` collection. Treatments and products then reference it as "media:<id>".
 */

export const MEDIA_PREFIX = 'media:';
/** Kept well under Firestore's 1 MiB document limit; must match firestore.rules. */
export const MAX_DATA_URL_CHARS = 900_000;

export const isMediaRef = (src: string) => src.startsWith(MEDIA_PREFIX);

const cache = new Map<string, Promise<string>>();

/** Resolves "media:<id>" to its data URL (cached); returns other sources unchanged. */
export function resolveMedia(src: string): Promise<string> {
  if (!isMediaRef(src)) return Promise.resolve(src);
  const id = src.slice(MEDIA_PREFIX.length);
  if (!cache.has(id)) {
    const p = db
      ? getDoc(doc(db, 'media', id)).then((s) => (s.exists() ? String(s.data().dataUrl ?? '') : ''))
      : Promise.resolve('');
    // Don't cache failures, so a later render can retry.
    p.catch(() => cache.delete(id));
    cache.set(id, p);
  }
  return cache.get(id)!;
}

/** React hook: the displayable URL for an image source ('' while an uploaded photo loads). */
export function useImageSrc(src: string): string {
  const [url, setUrl] = useState(() => (isMediaRef(src) ? '' : src));
  useEffect(() => {
    let alive = true;
    if (!isMediaRef(src)) {
      setUrl(src);
      return;
    }
    setUrl('');
    resolveMedia(src)
      .then((u) => alive && setUrl(u))
      .catch(() => alive && setUrl(''));
    return () => {
      alive = false;
    };
  }, [src]);
  return url;
}

/** Largest side, in pixels, after shrinking. Plenty for cards and detail pages. */
const MAX_SIDE = 1200;

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('That file could not be opened as a photo.'));
    };
    img.src = url;
  });
}

/** Shrinks a photo to at most MAX_SIDE px and re-encodes it until it fits the size limit. */
export async function shrinkPhoto(file: File): Promise<string> {
  if (!file.type.startsWith('image/')) throw new Error('Please choose a photo (JPG, PNG or WebP).');
  const img = await loadImage(file);
  let scale = Math.min(1, MAX_SIDE / Math.max(img.naturalWidth, img.naturalHeight));
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('This browser cannot resize photos.');
  // Try progressively smaller/lower-quality versions until one fits.
  for (let attempt = 0; attempt < 8; attempt++) {
    canvas.width = Math.max(1, Math.round(img.naturalWidth * scale));
    canvas.height = Math.max(1, Math.round(img.naturalHeight * scale));
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    const quality = Math.max(0.5, 0.82 - attempt * 0.06);
    let dataUrl = canvas.toDataURL('image/webp', quality);
    // Older Safari can't encode WebP and silently returns PNG; use JPEG there.
    if (!dataUrl.startsWith('data:image/webp')) dataUrl = canvas.toDataURL('image/jpeg', quality);
    if (dataUrl.length <= MAX_DATA_URL_CHARS / 3) return dataUrl; // aim for ~300 KB or less
    scale *= 0.8;
  }
  throw new Error('That photo is too large even after shrinking. Try a smaller photo.');
}

/** Saves a shrunk photo to Firestore and returns the "media:<id>" reference. */
export async function uploadPhoto(file: File): Promise<string> {
  if (!db) throw new Error('Firebase is not connected.');
  const dataUrl = await shrinkPhoto(file);
  const ref = await addDoc(collection(db, 'media'), { dataUrl, name: file.name.slice(0, 120), createdAt: serverTimestamp() });
  cache.set(ref.id, Promise.resolve(dataUrl));
  return MEDIA_PREFIX + ref.id;
}
