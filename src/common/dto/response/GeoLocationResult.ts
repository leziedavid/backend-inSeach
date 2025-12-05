// request.ts

export interface GeoLocationResult {
    lat: number | null;
    lng: number | null;
    country?: string | null;
    city?: string | null;
    district?: string | null;
    street?: string | null;
    error?: string | null;
}
