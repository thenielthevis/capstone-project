/**
 * offlineTileManager.ts
 *
 * Pre-downloads map tiles around the user's location so the map renders
 * smoothly when the device goes offline (e.g. leaving Wi-Fi range).
 *
 * Uses MapLibreGL.offlineManager which stores tiles in the device's
 * internal storage — nothing is added to the project folder.
 *
 * Strategy:
 *   - On recording start, download a ~3 km radius pack at zoom 14-19
 *     (covers a typical outdoor run around a neighbourhood).
 *   - Re-use existing pack if user is still inside the cached area.
 *   - Periodically expand coverage as the user moves (edge packs).
 *   - Clean up old packs to avoid filling storage.
 *
 * Tile size estimate:
 *   ~3 km radius, zoom 14-19 ≈ 10-25 MB depending on style complexity.
 */

import MapLibreGL from "@maplibre/maplibre-react-native";

// ── Configuration ──────────────────────────────────────────────
/** Approx radius around the user to cache (in degrees, ~0.03 ≈ 3 km) */
const CACHE_RADIUS_DEG = 0.03;
/** Min zoom to cache (city-level overview) */
const MIN_ZOOM = 14;
/** Max zoom to cache (street-level detail for recording) */
const MAX_ZOOM = 19;
/** Pack name prefix — we append a numerator for edge expansions */
const PACK_PREFIX = "activity_area_";
/** Max age of unused packs before cleanup (ms) — 7 days */
const MAX_PACK_AGE_MS = 7 * 24 * 60 * 60 * 1000;
/** How many expansion packs to allow before pruning oldest */
const MAX_EXPANSION_PACKS = 4;

// ── State ──────────────────────────────────────────────────────
let currentPackName: string | null = null;
let expansionCounter = 0;
let lastExpansionCenter: [number, number] | null = null;

// ── Helpers ────────────────────────────────────────────────────

/** Build a bounding box [sw, ne] around a coordinate */
function boundsAround(
  lon: number,
  lat: number,
  radiusDeg: number = CACHE_RADIUS_DEG
): [[number, number], [number, number]] {
  return [
    [lon - radiusDeg, lat - radiusDeg], // SW
    [lon + radiusDeg, lat + radiusDeg], // NE
  ];
}

/** Check if a coordinate is well inside an existing bound (80% margin) */
function isInsideBounds(
  lon: number,
  lat: number,
  bounds: [[number, number], [number, number]]
): boolean {
  const margin = CACHE_RADIUS_DEG * 0.2; // 20% buffer before we consider out-of-bounds
  const [[swLon, swLat], [neLon, neLat]] = bounds;
  return (
    lon > swLon + margin &&
    lon < neLon - margin &&
    lat > swLat + margin &&
    lat < neLat - margin
  );
}

// ── Public API ─────────────────────────────────────────────────

/**
 * Download tiles around a starting coordinate.
 * Call this when the user presses Record.
 *
 * @param lon  Longitude of starting position
 * @param lat  Latitude of starting position
 * @param styleURL  The map style URL to cache tiles for
 * @param onProgress  Optional progress callback (0-100)
 */
export async function downloadTilesForRecording(
  lon: number,
  lat: number,
  styleURL: string,
  onProgress?: (pct: number) => void
): Promise<void> {
  try {
    const bounds = boundsAround(lon, lat);
    currentPackName = `${PACK_PREFIX}main_${Date.now()}`;
    lastExpansionCenter = [lon, lat];
    expansionCounter = 0;

    console.log(
      `[OfflineTiles] Downloading pack "${currentPackName}" around [${lon.toFixed(4)}, ${lat.toFixed(4)}]`
    );

    await MapLibreGL.offlineManager.createPack(
      {
        name: currentPackName,
        styleURL,
        bounds,
        minZoom: MIN_ZOOM,
        maxZoom: MAX_ZOOM,
      },
      (region: any, status: any) => {
        // Progress callback
        if (status?.percentage != null && onProgress) {
          onProgress(Math.round(status.percentage));
        }
      },
      (region: any, error: any) => {
        console.warn("[OfflineTiles] Download error:", error);
      }
    );

    console.log("[OfflineTiles] Initial pack download started");
  } catch (err) {
    console.warn("[OfflineTiles] Failed to create offline pack:", err);
  }
}

/**
 * Expand the cached area if the user has moved near the edge.
 * Call periodically (e.g. every 30 s while recording).
 *
 * @param lon  Current longitude
 * @param lat  Current latitude
 * @param styleURL  The map style URL
 */
export async function expandIfNeeded(
  lon: number,
  lat: number,
  styleURL: string
): Promise<void> {
  if (!lastExpansionCenter) return;

  // Check if user is still well inside cached area
  const lastBounds = boundsAround(
    lastExpansionCenter[0],
    lastExpansionCenter[1]
  );
  if (isInsideBounds(lon, lat, lastBounds)) return;

  // User is near the edge — download a new pack centered on current position
  if (expansionCounter >= MAX_EXPANSION_PACKS) {
    console.log("[OfflineTiles] Max expansion packs reached, skipping");
    return;
  }

  expansionCounter++;
  const packName = `${PACK_PREFIX}expand_${expansionCounter}_${Date.now()}`;
  const bounds = boundsAround(lon, lat);
  lastExpansionCenter = [lon, lat];

  console.log(
    `[OfflineTiles] Expanding coverage (pack ${expansionCounter}) around [${lon.toFixed(4)}, ${lat.toFixed(4)}]`
  );

  try {
    await MapLibreGL.offlineManager.createPack(
      {
        name: packName,
        styleURL,
        bounds,
        minZoom: MIN_ZOOM,
        maxZoom: MAX_ZOOM,
      },
      () => {},
      (region: any, error: any) => {
        console.warn("[OfflineTiles] Expansion error:", error);
      }
    );
  } catch (err) {
    console.warn("[OfflineTiles] Failed to expand:", err);
  }
}

/**
 * Clean up old offline packs to free device storage.
 * Call on app launch or when a recording ends.
 */
export async function cleanupOldPacks(): Promise<void> {
  try {
    const packs = await MapLibreGL.offlineManager.getPacks();
    if (!packs || packs.length === 0) return;

    const now = Date.now();
    let removed = 0;

    for (const pack of packs) {
      const name: string = pack?.name || "";
      if (!name.startsWith(PACK_PREFIX)) continue;

      // Extract timestamp from pack name
      const parts = name.split("_");
      const timestamp = parseInt(parts[parts.length - 1], 10);
      if (isNaN(timestamp)) continue;

      if (now - timestamp > MAX_PACK_AGE_MS) {
        await MapLibreGL.offlineManager.deletePack(name);
        removed++;
      }
    }

    if (removed > 0) {
      console.log(`[OfflineTiles] Cleaned up ${removed} old pack(s)`);
    }
  } catch (err) {
    console.warn("[OfflineTiles] Cleanup error:", err);
  }
}

/**
 * Get the current map style URL for a given theme mode.
 * Centralised here so Activity.tsx and the offline manager use the same URL.
 */
export function getMapStyleURL(mode: "dark" | "light", apiKey: string): string {
  if (mode === "dark") {
    return `https://api.maptiler.com/maps/019b1d6d-f87f-771b-88b8-776fa8f37312/style.json?key=${apiKey}`;
  }
  return `https://api.maptiler.com/maps/streets-v4/style.json?key=${apiKey}`;
}
