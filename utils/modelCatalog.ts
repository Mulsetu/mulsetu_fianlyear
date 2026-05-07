import { fetchModelCatalog as fetchFromServer } from './aiPrediction';

export type NormalizedModelCatalog = {
  supportedCropFolders: string[];
  supportedCrops: string[];
  supportedMandisByCrop: Record<string, string[]>;
};

export function normalizeModelKey(input: string | null | undefined): string {
  if (!input) return '';
  return String(input).toLowerCase().replace(/[^a-z0-9]/g, '');
}

export async function fetchModelCatalog(): Promise<NormalizedModelCatalog | null> {
  try {
    const raw = await fetchFromServer();
    if (!raw) return null;

    const cropFolders = Array.isArray((raw as any).supportedCropFolders)
      ? (raw as any).supportedCropFolders.map(String).filter(Boolean)
      : [];

    const rawMandisByCrop = (raw as any).supportedMandisByCrop ?? (raw as any).crops ?? {};
    const supportedMandisByCrop: Record<string, string[]> = {};

    for (const cropKey of cropFolders) {
      const directMandis = rawMandisByCrop?.[cropKey] ?? [];
      const normalizedCropKey = normalizeModelKey(cropKey);
      const fallbackEntry = Object.entries(rawMandisByCrop).find(([key]) => normalizeModelKey(key) === normalizedCropKey);
      const mandis = Array.isArray(directMandis) && directMandis.length > 0
        ? directMandis
        : (Array.isArray(fallbackEntry?.[1]) ? fallbackEntry[1] : []);

      supportedMandisByCrop[String(cropKey)] = mandis.map(String).filter(Boolean);
    }

    return {
      supportedCropFolders: cropFolders,
      supportedCrops: cropFolders,
      supportedMandisByCrop,
    };
  } catch {
    return { supportedCropFolders: [], supportedCrops: [], supportedMandisByCrop: {} };
  }
}

export default fetchModelCatalog;
