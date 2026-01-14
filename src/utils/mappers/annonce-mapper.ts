import { Injectable } from '@nestjs/common';
import { Annonce, AnnonceAmenity, Review, User, FileManager, AnnonceType, Appointment } from '@prisma/client';
import { getPublicFileUrl } from 'src/utils/helper';

@Injectable()
export class AnnonceMapper {

    /**
     * Map un objet gpsLocation en objet structuré
     */
    private mapLocation(locationData: any) {
        if (!locationData) {
            return { lat: null, lng: null, country: null, city: null, district: null, street: null };
        }

        if (typeof locationData === 'object') {
            return {
                lat: locationData.lat ?? locationData.latitude ?? null,
                lng: locationData.lng ?? locationData.longitude ?? null,
                country: locationData.country ?? null,
                city: locationData.city ?? null,
                district: locationData.district ?? null,
                street: locationData.street ?? null,
            };
        }

        if (typeof locationData === 'string') {
            try {
                const parsed = JSON.parse(locationData);
                return {
                    lat: parsed.lat ?? parsed.latitude ?? null,
                    lng: parsed.lng ?? parsed.longitude ?? null,
                    country: parsed.country ?? null,
                    city: parsed.city ?? null,
                    district: parsed.district ?? null,
                    street: parsed.street ?? null,
                };
            } catch {
                return { lat: null, lng: null, country: null, city: null, district: null, street: null };
            }
        }

        return { lat: null, lng: null, country: null, city: null, district: null, street: null };
    }

    /**
     * Map une annonce unique
     */
    mapAnnonce(
        annonce: Annonce & {
            amenities: (AnnonceAmenity & { amenity: { icon?: string | null; label: string } })[];
            reviews?: Review[];
            provider?: User | null;
            category?: { id: string; value: string; label: string };
            type?: AnnonceType;
            appointments?: Appointment[];
        },
        files?: FileManager[],
        amenityIcons?: FileManager[]
    ) {
        const images = files?.filter(f => f.targetId === annonce.id).sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime()).map(f => getPublicFileUrl(f.fileUrl)) || [];

        const amenities = annonce.amenities?.map(a => {
            const iconFile = amenityIcons?.find(i => i.targetId === a.amenityId);

            return {
                id: a.amenityId,
                label: a.amenity.label,
                icon: iconFile ? getPublicFileUrl(iconFile.fileUrl) : null,
            };
        }) || [];

        const review = annonce.reviews && annonce.reviews.length > 0
            ? {
                id: annonce.reviews[0].id,
                author: annonce.reviews[0].author,
                rating: annonce.reviews[0].rating,
                comment: annonce.reviews[0].comment ?? null,
            }
            : null;

        const type = annonce.type ? annonce.type : null;
        const appointments = annonce.appointments ? annonce.appointments : null;

        return {
            id: annonce.id,
            title: annonce.title,
            category: annonce.category ?? null,
            categoryId: annonce.categoryId,
            location: annonce.location,
            price: annonce.price,
            rating: annonce.rating,
            capacity: annonce.capacity,
            rooms: annonce.rooms,
            beds: annonce.beds,
            certifiedAt: annonce.certifiedAt ? annonce.certifiedAt.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' }) : null,
            description: annonce.description ?? null,
            amenities,
            images,
            review,
            type,
            typeId: annonce.typeId,
            gpsLocation: this.mapLocation(annonce.gpsLocation),
            provider: annonce.provider ?? null,
            providerId: annonce.providerId ?? null,
            pinned: annonce.pinned,
            status: annonce.status,
            expiration: annonce.expiration,
            appointments,
            createdAt: annonce.createdAt,
            updatedAt: annonce.updatedAt,
            
        };
    }

    /**
     * Map une liste d'annonces
     */
    mapAnnonces(
        annonces: (Annonce & {
            amenities: (AnnonceAmenity & { amenity: { icon?: string | null; label: string } })[];
            reviews?: Review[];
            provider?: User | null;
            category?: { id: string; value: string; label: string };
        })[],
        files?: FileManager[],
        amenityIcons?: FileManager[]
    ) {
        return annonces.map(annonce => this.mapAnnonce(annonce, files, amenityIcons));
    }
}
