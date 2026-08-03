export interface GeoResult {
  lat: number;
  lon: number;
  /** GPS accuracy in meters (95% confidence radius). */
  accuracyM: number;
}

export type GeoErrorKind =
  | 'unsupported'
  | 'permission_denied'
  | 'position_unavailable'
  | 'timeout';

export class GeoError extends Error {
  constructor(public readonly kind: GeoErrorKind, message: string) {
    super(message);
    this.name = 'GeoError';
  }
}

export function getCurrentPosition(): Promise<GeoResult> {
  return new Promise((resolve, reject) => {
    if (!('geolocation' in navigator)) {
      reject(new GeoError('unsupported', 'Geolocation not supported by this browser.'));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        resolve({
          lat: pos.coords.latitude,
          lon: pos.coords.longitude,
          accuracyM: pos.coords.accuracy,
        });
      },
      (err) => {
        const kind: GeoErrorKind =
          err.code === err.PERMISSION_DENIED      ? 'permission_denied'
          : err.code === err.POSITION_UNAVAILABLE ? 'position_unavailable'
          : err.code === err.TIMEOUT              ? 'timeout'
          : 'position_unavailable';
        reject(new GeoError(kind, err.message));
      },
      { enableHighAccuracy: true, timeout: 10_000, maximumAge: 0 },
    );
  });
}
