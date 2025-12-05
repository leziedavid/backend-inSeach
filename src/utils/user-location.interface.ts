export interface UserLocation {
    lat: number | null;
    lng: number | null;
    country?: string | null;
    city?: string | null;
    district?: string | null;
    street?: string | null;
    postalCode?: string | null;
    formattedAddress?: string | null;
}

export interface RawUserLocation {
    latitude?: number;
    longitude?: number;
    lat?: number;
    lng?: number;
    country?: string;
    city?: string;
    district?: string;
    street?: string;
    postalCode?: string;
    formattedAddress?: string;
    [key: string]: any; // Pour les données supplémentaires
}