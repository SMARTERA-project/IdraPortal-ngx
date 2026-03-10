import JSZip from 'jszip';
import { createExtractorFromData } from 'node-unrar-js/esm/index.esm';
import { ungzip } from 'pako';

export type CompressionType = 'none' | 'zip' | 'gzip' | 'rar';

export interface ExtractedFileEntry {
  name: string;
  bytes: Uint8Array;
}

export interface ExtractedPayload {
  compression: CompressionType;
  entries: ExtractedFileEntry[];
}

const UTF8_TEXT_DECODER = new TextDecoder('utf-8');

let rarWasmBinaryPromise: Promise<ArrayBuffer> | null = null;

function matchesSignature(bytes: Uint8Array, signature: number[]): boolean {
  if (bytes.length < signature.length) {
    return false;
  }
  return signature.every((value, index) => bytes[index] === value);
}

function resolveSuggestedName(suggestedName: string): string {
  if (!suggestedName) {
    return 'payload';
  }

  try {
    const parsed = new URL(suggestedName);
    const pathName = decodeURIComponent(parsed.pathname || '');
    const lastPathSegment = pathName.split('/').filter(Boolean).pop();
    return lastPathSegment || 'payload';
  } catch (_error) {
    const sanitized = suggestedName.split('?')[0].split('#')[0];
    const lastPathSegment = sanitized.split('/').filter(Boolean).pop();
    return lastPathSegment || 'payload';
  }
}

function removeGzipExtension(fileName: string): string {
  return fileName.replace(/\.gz$/i, '') || 'payload';
}

async function extractZipEntries(buffer: ArrayBuffer): Promise<ExtractedFileEntry[]> {
  const zip = await JSZip.loadAsync(buffer);
  const entries: ExtractedFileEntry[] = [];

  for (const [name, zipEntry] of Object.entries(zip.files)) {
    if (zipEntry.dir) {
      continue;
    }

    const bytes = await zipEntry.async('uint8array');
    entries.push({ name, bytes });
  }

  return entries;
}

async function gunzip(buffer: ArrayBuffer): Promise<ArrayBuffer> {
  if (typeof DecompressionStream !== 'undefined') {
    const stream = new Blob([buffer]).stream().pipeThrough(new DecompressionStream('gzip'));
    return new Response(stream).arrayBuffer();
  }

  const inflated = ungzip(new Uint8Array(buffer));

  if (inflated instanceof Uint8Array) {
    return Uint8Array.from(inflated).buffer;
  }

  return Uint8Array.from(inflated || []).buffer;
}

async function getRarWasmBinary(): Promise<ArrayBuffer> {
  if (!rarWasmBinaryPromise) {
    const wasmUrl = new URL('assets/wasm/unrar.wasm', document.baseURI).toString();
    rarWasmBinaryPromise = fetch(wasmUrl).then(async (response) => {
      if (!response.ok) {
        throw new Error(`Unable to load unrar wasm binary (${response.status})`);
      }
      return response.arrayBuffer();
    });
  }

  return rarWasmBinaryPromise;
}

async function extractRarEntries(buffer: ArrayBuffer): Promise<ExtractedFileEntry[]> {
  const wasmBinary = await getRarWasmBinary();
  const extractor = await createExtractorFromData({ data: buffer, wasmBinary });
  const extracted = extractor.extract({});
  const entries: ExtractedFileEntry[] = [];

  // The iterator must be consumed fully to avoid leaked native memory.
  for (const archiveFile of extracted.files) {
    if (archiveFile.fileHeader.flags.directory || !archiveFile.extraction) {
      continue;
    }

    entries.push({
      name: archiveFile.fileHeader.name || `entry-${entries.length}`,
      bytes: archiveFile.extraction,
    });
  }

  return entries;
}

export function detectCompressionType(bytes: Uint8Array): CompressionType {
  if (matchesSignature(bytes, [0x50, 0x4b, 0x03, 0x04]) || matchesSignature(bytes, [0x50, 0x4b, 0x05, 0x06]) || matchesSignature(bytes, [0x50, 0x4b, 0x07, 0x08])) {
    return 'zip';
  }

  if (matchesSignature(bytes, [0x1f, 0x8b])) {
    return 'gzip';
  }

  if (matchesSignature(bytes, [0x52, 0x61, 0x72, 0x21, 0x1a, 0x07, 0x00]) || matchesSignature(bytes, [0x52, 0x61, 0x72, 0x21, 0x1a, 0x07, 0x01, 0x00])) {
    return 'rar';
  }

  return 'none';
}

export async function extractPayloadEntries(buffer: ArrayBuffer, suggestedName = 'payload'): Promise<ExtractedPayload> {
  const bytes = new Uint8Array(buffer);
  const detectedType = detectCompressionType(bytes);
  const resolvedName = resolveSuggestedName(suggestedName);

  if (detectedType === 'zip') {
    return {
      compression: detectedType,
      entries: await extractZipEntries(buffer),
    };
  }

  if (detectedType === 'gzip') {
    const decompressed = await gunzip(buffer);
    return {
      compression: detectedType,
      entries: [{ name: removeGzipExtension(resolvedName), bytes: new Uint8Array(decompressed) }],
    };
  }

  if (detectedType === 'rar') {
    return {
      compression: detectedType,
      entries: await extractRarEntries(buffer),
    };
  }

  return {
    compression: 'none',
    entries: [{ name: resolvedName, bytes }],
  };
}

export function decodeBytesToText(bytes: Uint8Array): string {
  let text = UTF8_TEXT_DECODER.decode(bytes);
  if (text.charCodeAt(0) === 0xfeff) {
    text = text.slice(1);
  }
  return text;
}

export function isProbablyText(bytes: Uint8Array): boolean {
  if (!bytes.length) {
    return true;
  }

  const sampleLength = Math.min(512, bytes.length);
  let controlChars = 0;

  for (let i = 0; i < sampleLength; i++) {
    const code = bytes[i];
    if (code === 0) {
      return false;
    }
    if (code < 0x20 && code !== 0x09 && code !== 0x0a && code !== 0x0d) {
      controlChars++;
    }
  }

  return controlChars / sampleLength < 0.1;
}

function getExtension(fileName: string): string {
  const normalized = (fileName || '').replace(/\\/g, '/');
  const leafName = normalized.split('/').pop() || normalized;
  const extensionSeparator = leafName.lastIndexOf('.');
  if (extensionSeparator < 0) {
    return '';
  }
  return leafName.slice(extensionSeparator + 1).toLowerCase();
}

export function pickEntryByExtensions(entries: ExtractedFileEntry[], extensions: string[]): ExtractedFileEntry | undefined {
  const allowedExtensions = new Set(extensions.map((item) => item.toLowerCase()));
  return entries.find((entry) => allowedExtensions.has(getExtension(entry.name)));
}

export function pickFirstTextEntry(entries: ExtractedFileEntry[], preferredExtensions: string[] = []): ExtractedFileEntry | undefined {
  const preferred = pickEntryByExtensions(entries, preferredExtensions);
  if (preferred && isProbablyText(preferred.bytes)) {
    return preferred;
  }

  return entries.find((entry) => isProbablyText(entry.bytes));
}
