import { Injectable } from '@nestjs/common';

@Injectable()
export class ServiceMapper {

    /**
     * Map un service unique
     */
    mapService(service: any, imageUrl?: string, iconUrl?: string) {
        const loc = service.location ?? {};

        return {
            id: service.id,
            title: service.title,
            description: service.description ?? null,
            providerId: service.providerId ?? null,
            serviceType: service.serviceType,
            basePriceCents: service.basePriceCents ?? null,

            location: {
                lat: loc.lat ?? null,
                lng: loc.lng ?? null,
                country: loc.country ?? null,
                city: loc.city ?? null,
                district: loc.district ?? null,
                street: loc.street ?? null,
            },

            iconId: service.iconId ?? null,
            icone: service.icone ?? null,
            images: imageUrl ?? null,
            iconUrl: iconUrl ?? null,

            createdAt: service.createdAt,
            updatedAt: service.updatedAt,

            categoryId: service.categoryId ?? null,
            category: service.category ?? null,

            subcategoryId: service.subcategoryId ?? null,
            subcategory: service.subcategory ?? null,

            appointments: service.appointments ?? [],
            orderItems: service.orderItems ?? [],
            userLinks: service.userLinks ?? [],


        };
    }

    /**
     * Map une liste de services
     */
    mapServices(services: any[], fileMap: Record<string, string>, iconUrlMap: Record<string, string>) {
        return services.map(service => {
            const imageUrl = fileMap[service.id] ?? null;
            const iconUrl = iconUrlMap[service.iconId] ?? null;
            return this.mapService(service, imageUrl, iconUrl);
        });
    }
}
