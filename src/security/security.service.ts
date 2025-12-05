import { Injectable, UnauthorizedException, InternalServerErrorException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { GenericService } from '../utils/generic.service';
import { LocalStorageService } from 'src/utils/LocalStorageService';
import { getPublicFileUrl } from 'src/utils/helper';
import { BaseResponse } from 'src/utils/base-response';
import { LoginByPhoneCode } from 'src/common/dto/request/loginByPhoneCode.dto';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { FunctionService } from 'src/utils/pagination.service';
import { PaginationParamsDto } from 'src/common/dto/request/pagination-params.dto';
import { User } from '@prisma/client';
import { mapUser } from 'src/utils/mappers/user.mapper';
import { GeoLocationResult } from 'src/common/dto/response/GeoLocationResult';
import { locationMapping } from 'src/utils/mappers/location-mapper';

@Injectable()
export class SecurityService {
    private generic: GenericService<User>;

    constructor(
        private readonly prisma: PrismaService,
        private readonly jwtService: JwtService,
        private readonly configService: ConfigService,
        private readonly functionService: FunctionService,
        private readonly localStorage: LocalStorageService,
    ) {
        this.generic = new GenericService<User>(prisma, 'user');
    }

    /** --------------------- Reverse geocoding --------------------- */
    async reverseGeocode(lat: number, lon: number): Promise<any> {
        try {
            const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lon}`, { headers: { 'User-Agent': 'inSeach-App' }, });
            if (!response.ok) throw new InternalServerErrorException('Erreur lors de la récupération de la localisation');
            const data = await response.json();
            return data;
        } catch (err) {
            console.error(err);
            return { lat, lng: lon, error: 'Impossible de récupérer l’adresse via reverse-geocoding' };
        }
    }

    /** --------------------- Connexion --------------------- */

    async loginByEmailOrPhone(dto: LoginByPhoneCode): Promise<BaseResponse<any>> {

        const isEmail = /\S+@\S+\.\S+/.test(dto.login);
        const user = isEmail ? await this.prisma.user.findFirst({ where: { email: dto.login } }) : await this.prisma.user.findFirst({ where: { phone: dto.login } });

        if (!user) return new BaseResponse(401, 'Utilisateur non trouvé');

        console.log('user:', user);

        const ok = await bcrypt.compare(dto.password, user.password);
        if (!ok) return new BaseResponse(401, 'Mot de passe incorrect');

        if (user.status !== 'ACTIVE') {
            return new BaseResponse(403, 'Votre compte n’est pas encore activé. Veuillez contacter l’administrateur.');
        }

        let partnerId: string | null = null;

        const file = await this.prisma.fileManager.findFirst({
            where: { targetId: user.id, fileType: 'userFiles' },
            orderBy: { createdAt: 'desc' },
        });
        const imageUrl = file ? getPublicFileUrl(file.fileUrl) : null;
        // Transformer la localisation avec la fonction mapping
        const location = locationMapping(user.location);
        
        const payload = {
            sub: user.id,
            roles: user.roles,
            typeCompte: user.typeCompte,
            companyName: user.companyName,
            serviceType: user.serviceType,
            location: location,
            name: user.name,
            email: user.email,
            imageUrl,
        };

        const access = this.jwtService.sign(payload, {
            expiresIn: this.configService.get('JWT_ACCESS_EXPIRE') || '24h',
        });
        const refresh = this.jwtService.sign(payload, {
            expiresIn: this.configService.get('JWT_REFRESH_EXPIRE') || '7d',
        });

        return new BaseResponse(200, 'Connexion réussie', {
            access_token: access,
            refresh_token: refresh,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                phone: user.phone,
                role: user.roles,
                partnerId,
                imageUrl,
            },
        });
    }

    /** --------------------- Rafraîchir token --------------------- */
    async refreshToken(token: string): Promise<BaseResponse<{ access_token: string }>> {
        try {
            const payload = this.jwtService.verify(token, {
                secret: this.configService.get<string>('JWT_SECRET'),
            });

            const newAccessToken = this.jwtService.sign(payload, {
                expiresIn: this.configService.get<string>('JWT_ACCESS_EXPIRE') || '15m',
            });

            return new BaseResponse(200, 'Token rafraîchi', { access_token: newAccessToken });
        } catch {
            throw new UnauthorizedException('Refresh token invalide ou expiré');
        }
    }


    /** --------------------- Détails d’un utilisateur --------------------- */

    async getUsersInfo(userId: string): Promise<BaseResponse<any>> {

        try {

            const user = await this.prisma.user.findUnique({
                where: { id: userId },
                include: {
                    wallet: true,
                    ratings: true,
                    products: {
                        include: {
                            category: true,
                            subCategory: true,
                            orderItems: true,
                        },
                    },
                    providedServices: {
                        include: {
                            category: true,
                            subcategory: true,
                            appointments: true,
                            orderItems: true,
                        },
                    },
                    clientOrders: {
                        include: {
                            items: {
                                include: {
                                    product: true,
                                    service: true,
                                },
                            },
                            transaction: true,
                        },
                    },
                    providerOrders: {
                        include: {
                            items: {
                                include: {
                                    product: true,
                                    service: true,
                                },
                            },
                            transaction: true,
                        },
                    },
                    clientAppointments: {
                        include: {
                            service: true,
                            transaction: true,
                            rating: true,
                        },
                    },
                    providerAppointments: {
                        include: {
                            service: true,
                            transaction: true,
                            rating: true,
                        },
                    },
                    transactions: true,
                    selectedCategories: { include: { category: true }, },
                    selectedSubcategories: { include: { subcategory: true }, },
                },
            });

            if (!user) {
                return new BaseResponse(404, 'Utilisateur non trouvé');
            }

            // 🔹 Récupération du dernier fichier 'userFiles' pour la photo
            const file = await this.prisma.fileManager.findFirst({
                where: { targetId: userId, fileType: 'userFiles' },
                orderBy: { createdAt: 'desc' },
            });

            const filesMap = file ? { [user.id]: getPublicFileUrl(file.fileUrl) } : {};

            // 🔹 On utilise mapUser avec includeRelations.images et files
            const userInfo = mapUser(user, {
                includeRelations: {
                images: true,
                        selectedCategories: true,       // ← obligatoire
        selectedSubcategories: true,    // ← obligatoire
                },
                files: filesMap,
            });

            return new BaseResponse(200, 'Informations utilisateur récupérées', userInfo);
        } catch (error) {
            console.error('[SecurityService.getUsersInfo] ❌', error);
            throw new InternalServerErrorException('Erreur lors de la récupération des informations utilisateur');
        }

    }

    /** --------------------- Liste paginée des utilisateurs --------------------- */
    async getAllUsersPaginate(params: PaginationParamsDto): Promise<BaseResponse<any>> {
        try {
            const data = await this.functionService.paginate({
                model: 'User',
                page: params.page,
                limit: params.limit,
                selectAndInclude: {
                    select: null,
                    include: {
                        wallet: true,
                        providedServices: true,
                        clientOrders: true,
                        providerOrders: true,
                        clientAppointments: true,
                        providerAppointments: true,
                        transactions: true,
                        selectedCategories: { include: { category: true } },
                        selectedSubcategories: { include: { subcategory: true } },
                    },
                },
                conditions: {}, // <-- ici les conditions de filtrage si besoin
                orderBy: { createdAt: 'desc' },
                fileTypeListes: ['userFiles'],
            });

            const usersWithFiles = data.data.map(user => mapUser(user));

            return new BaseResponse(200, 'Liste paginée des utilisateurs', {
                ...data,
                data: usersWithFiles,
            });
        } catch (error) {
            console.error('[SecurityService.getAllUsersPaginate] ❌', error);
            throw new InternalServerErrorException('Erreur lors de la récupération des utilisateurs');
        }
    }

    /** --------------------- Appointments d’un utilisateur --------------------- */
    async getUserAppointmentsPaginate(userId: string, params: PaginationParamsDto): Promise<BaseResponse<any>> {
        try {
            const data = await this.functionService.paginate({
                model: 'Appointment',
                page: params.page,
                limit: params.limit,
                selectAndInclude: {
                    select: null,
                    include: {
                        service: true,
                        transaction: true,
                        provider: true,
                        client: true,
                        rating: true,
                    },
                },
                conditions: { clientId: userId }, // <-- ici le filtre correct
                orderBy: { createdAt: 'desc' },
            });

            return new BaseResponse(200, 'Liste paginée des rendez-vous', data);
        } catch (error) {
            console.error('[SecurityService.getUserAppointmentsPaginate] ❌', error);
            throw new InternalServerErrorException('Erreur lors de la récupération des rendez-vous');
        }
    }

    /** --------------------- Appointments d’un vendeur --------------------- */
    async getProviderAppointmentsPaginate(userId: string, params: PaginationParamsDto): Promise<BaseResponse<any>> {
        try {
            const data = await this.functionService.paginate({
                model: 'Appointment',
                page: params.page,
                limit: params.limit,
                selectAndInclude: {
                    select: null,
                    include: {
                        service: true,
                        transaction: true,
                        provider: true,
                        client: true,
                        rating: true,
                    },
                },
                conditions: { providerId: userId }, // <-- filtre vendeur
                orderBy: { createdAt: 'desc' },
            });

            return new BaseResponse(200, 'Liste paginée des rendez-vous du vendeur', data);
        } catch (error) {
            console.error('[SecurityService.getProviderAppointmentsPaginate] ❌', error);
            throw new InternalServerErrorException('Erreur lors de la récupération des rendez-vous du vendeur');
        }
    }

    /** --------------------- Commandes d’un utilisateur --------------------- */
    async getUserOrdersPaginate(userId: string, params: PaginationParamsDto): Promise<BaseResponse<any>> {
        try {
            const data = await this.functionService.paginate({
                model: 'Order',
                page: params.page,
                limit: params.limit,
                selectAndInclude: {
                    select: null,
                    include: {
                        items: {
                            include: {
                                product: true,
                                service: true,
                            },
                        },
                        transaction: true,
                        provider: true,
                        client: true,
                    },
                },
                conditions: { clientId: userId },
                orderBy: { createdAt: 'desc' },
            });

            return new BaseResponse(200, 'Liste paginée des commandes', data);
        } catch (error) {
            console.error('[SecurityService.getUserOrdersPaginate] ❌', error);
            throw new InternalServerErrorException('Erreur lors de la récupération des commandes');
        }
    }

    /** --------------------- Commandes d’un vendeur --------------------- */
    async getProviderOrdersPaginate(userId: string, params: PaginationParamsDto): Promise<BaseResponse<any>> {
        try {
            const data = await this.functionService.paginate({
                model: 'Order',
                page: params.page,
                limit: params.limit,
                selectAndInclude: {
                    select: null,
                    include: {
                        items: {
                            include: {
                                product: true,
                                service: true,
                            },
                        },
                        transaction: true,
                        provider: true,
                        client: true,
                    },
                },
                conditions: { providerId: userId },
                orderBy: { createdAt: 'desc' },
            });

            return new BaseResponse(200, 'Liste paginée des commandes du vendeur', data);
        } catch (error) {
            console.error('[SecurityService.getProviderOrdersPaginate] ❌', error);
            throw new InternalServerErrorException('Erreur lors de la récupération des commandes du vendeur');
        }
    }

}
