import { UserLocation } from "../user-location.interface";

/**
 * Transforme la localisation JSON en objet clé-valeur structuré
 */

export function locationMapping(locationData: any): UserLocation {
    if (!locationData) {
        return {
            lat: null,
            lng: null,
            country: null,
            city: null,
            district: null,
            street: null
        };
    }

    // Si c'est déjà un objet avec les bonnes propriétés
    if (typeof locationData === 'object') {
        return {
            lat: locationData.lat ?? locationData.latitude ?? null,
            lng: locationData.lng ?? locationData.longitude ?? null,
            country: locationData.country ?? null,
            city: locationData.city ?? null,
            district: locationData.district ?? null,
            street: locationData.street ?? null
        };
    }

    // Si c'est une chaîne JSON, on la parse
    if (typeof locationData === 'string') {
        try {
            const parsed = JSON.parse(locationData);
            return {
                lat: parsed.lat ?? parsed.latitude ?? null,
                lng: parsed.lng ?? parsed.longitude ?? null,
                country: parsed.country ?? null,
                city: parsed.city ?? null,
                district: parsed.district ?? null,
                street: parsed.street ?? null
            };
        } catch {
            // Si le parsing échoue, retourner une localisation vide
            return {
                lat: null,
                lng: null,
                country: null,
                city: null,
                district: null,
                street: null
            };
        }
    }

    // Par défaut, retourner une localisation vide
    return {
        lat: null,
        lng: null,
        country: null,
        city: null,
        district: null,
        street: null
    };
}