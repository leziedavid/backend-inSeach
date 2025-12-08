import { Injectable, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Role, ServiceType, User } from '@prisma/client';
import { GenericService } from '../utils/generic.service';
import { CreateUserDto, UpdateUserDto } from 'src/common/dto/request/user.dto';
import { BaseResponse } from 'src/utils/base-response';
import { LocalStorageService } from 'src/utils/LocalStorageService';
import { getPublicFileUrl } from 'src/utils/helper';
import { PaginationParamsDto } from 'src/common/dto/request/pagination-params.dto';
import { FunctionService, PaginateOptions } from 'src/utils/pagination.service';
import * as bcrypt from 'bcrypt';
import { mapUser } from 'src/utils/mappers/user.mapper';

@Injectable()
export class UserService {
    private generic: GenericService<User>;

    constructor(
        private readonly prisma: PrismaService,
        private readonly localStorage: LocalStorageService,
        private readonly functionService: FunctionService,
    ) {
        this.generic = new GenericService<User>(prisma, 'user');
    }

    /** --------------------- Création utilisateur --------------------- */
    // const userStatus = allData.role !== 'ADMIN' ? 'INACTIVE' : 'ACTIVE';

    async create(dto: CreateUserDto): Promise<BaseResponse<User>> {
        const { password, images, serviceCategories, serviceSubcategories, accountType, ...allData } = dto as any;
        let type;

        if (dto.roles === Role.ADMIN) {

            type = ServiceType.MIXED;

        } else if (dto.roles === Role.PROVIDER) {

            type = ServiceType.APPOINTMENT;

        } else if (dto.roles === Role.CLIENT) {
            type = ServiceType.ORDER;

        } else if (dto.roles === Role.SELLER) {

            type = ServiceType.PRODUCT;
        }

        const dataToSave = {
            ...allData,
            typeCompte: accountType,
            serviceType: type,
        };

        /* ---------------------------------------
        🔎 Vérification si le numéro existe déjà
        ----------------------------------------*/

        const existingUser = await this.prisma.user.findFirst({
            where: { phone: dto.phone }, // change par email si nécessaire
        });

        if (existingUser) {
            return new BaseResponse( 400, "Un compte avec ce numéro existe déjà.", null );
        }

        try {

            const hashedPassword = await bcrypt.hash(password, 10);
            const user = await this.generic.create({
                ...dataToSave,
                password: hashedPassword,
                status: "ACTIVE",
            });

            /* ---------------------------
             * CATEGORIES
             * --------------------------- */
            if (serviceCategories?.length) {
                await this.prisma.userCategory.createMany({
                    data: serviceCategories.map(catId => ({
                        userId: user.id,
                        categoryId: catId,
                    })),
                });
            }

            /* ---------------------------
             * SOUS-CATEGORIES
             * --------------------------- */
            if (serviceSubcategories?.length) {
                await this.prisma.userSubcategory.createMany({
                    data: serviceSubcategories.map(subId => ({
                        userId: user.id,
                        subcategoryId: subId,
                    })),
                });
            }
            // 💰 Création automatique de wallet
            await this.prisma.wallet.create({
                data: {
                    userId: user.id,
                    balance: 0,
                    paymentMethod: 'MOBILE_MONEY',
                    rechargeType: 'WAVE',
                },
            });

            return new BaseResponse(201, 'Utilisateur créé avec succès', user);

        } catch (error) {
            console.error('[UserService.create] ❌', error);
            throw new InternalServerErrorException("Erreur lors de la création de l'utilisateur");
        }
        
    }

    /** --------------------- Mise à jour utilisateur --------------------- */
    async update(id: string, dto: UpdateUserDto): Promise<BaseResponse<User>> {

        const { images, serviceCategories, serviceSubcategories, accountType, ...allData } = dto as any;

        const dataToUpdate = {
            ...allData,
            ...(accountType !== undefined && { typeCompte: accountType }),
        };

        const user = await this.generic.findOne({ id });
        if (!user) throw new BadRequestException("Utilisateur introuvable");

        try {
            // 1️⃣ Mise à jour simple de l’utilisateur
            const updatedUser = await this.generic.update({ id }, dataToUpdate);

            // 2️⃣ Mettre à jour les catégories
            if (serviceCategories) {
                await this.prisma.userCategory.deleteMany({ where: { userId: id } });

                await this.prisma.userCategory.createMany({
                    data: serviceCategories.map(catId => ({
                        userId: id,
                        categoryId: catId,
                    })),
                });
            }

            // 3️⃣ Mettre à jour les sous-catégories
            if (serviceSubcategories) {
                await this.prisma.userSubcategory.deleteMany({ where: { userId: id } });

                await this.prisma.userSubcategory.createMany({
                    data: serviceSubcategories.map(subId => ({
                        userId: id,
                        subcategoryId: subId,
                    })),
                });
            }

            return new BaseResponse(200, "Utilisateur mis à jour avec succès", updatedUser);

        } catch (error) {
            console.error('[UserService.update] ❌', error);
            throw new InternalServerErrorException("Erreur lors de la mise à jour de l'utilisateur");
        }
    }

    /** --------------------- Pagination utilisateurs --------------------- */

    async getAllPaginate(params: PaginationParamsDto): Promise<BaseResponse<any>> {
        try {
            const data = await this.functionService.paginate<PaginateOptions>({
                model: 'User',
                page: params.page,
                limit: params.limit,
                selectAndInclude: {
                    select: null, // on prend tout
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
                                items: true,
                                transaction: true,
                            },
                        },
                        providerOrders: {
                            include: {
                                items: true,
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
                        selectedCategories: { include: { category: true } },
                        selectedSubcategories: { include: { subcategory: true } },
                    },
                },
                orderBy: { createdAt: 'desc' },
            });

            const userIds = data.data.map(u => u.id);

            const allFiles = await this.prisma.fileManager.findMany({
                where: { targetId: { in: userIds }, fileType: 'userFiles' },
                orderBy: { createdAt: 'desc' },
            });

            const filesMap: Record<string, string> = {};
            for (const file of allFiles) {
                if (!filesMap[file.targetId]) {
                    filesMap[file.targetId] = getPublicFileUrl(file.fileUrl);
                }
            }

            const usersWithFiles = data.data.map(user =>
                mapUser(user, {
                    includeRelations: {
                        wallet: true,
                        providedServices: true,
                        clientOrders: true,
                        providerOrders: true,
                        clientAppointments: true,
                        providerAppointments: true,
                        transactions: true,
                        selectedCategories: true,
                        selectedSubcategories: true,
                        images: true,
                    },
                    files: filesMap,
                })
            );

            return new BaseResponse(200, 'Liste paginée des utilisateurs', {
                ...data,
                data: usersWithFiles,
            });
        } catch (error) {
            console.error('[UserService.getAllPaginate] ❌', error);
            throw new InternalServerErrorException('Erreur lors de la récupération des utilisateurs');
        }
    }

    /** --------------------- Supprimer utilisateur --------------------- */
    async delete(id: string): Promise<BaseResponse<User>> {
        const user = await this.generic.findOne({ id });
        if (!user) throw new BadRequestException('Utilisateur introuvable');

        try {
            await this.generic.delete({ id });
            await this.prisma.fileManager.deleteMany({ where: { targetId: id } });
            return new BaseResponse(200, 'Utilisateur supprimé avec succès', user);
        } catch (error) {
            console.error('[UserService.delete] ❌', error);
            throw new InternalServerErrorException('Erreur lors de la suppression de l’utilisateur');
        }
    }

    /** --------------------- Mise à jour du statut utilisateur --------------------- */
    async updateUserStatus(userId: string, status: 'ACTIVE' | 'INACTIVE' | 'BLOCKED'): Promise<BaseResponse<User>> {
        const user = await this.generic.findOne({ id: userId });
        if (!user) throw new BadRequestException('Utilisateur introuvable');

        try {
            const updated = await this.generic.update({ id: userId }, { status });
            return new BaseResponse(200, `Statut de l'utilisateur mis à jour vers ${status}`, updated);
        } catch (error) {
            console.error('[UserService.updateUserStatus] ❌', error);
            throw new InternalServerErrorException('Erreur lors de la mise à jour du statut de l’utilisateur');
        }
    }

    /** --------------------- Upload fichier --------------------- */
    private async uploadFile(userId: string, fileBuffer: Buffer | string, fileType: string, folder: string) {
        const existingFile = await this.prisma.fileManager.findFirst({
            where: { targetId: userId, fileType },
            orderBy: { createdAt: 'desc' },
        });

        if (existingFile?.fileCode) {
            try {
                await this.localStorage.deleteFile(existingFile.fileCode);
            } catch (err) {
                console.warn(`Erreur suppression du fichier ${existingFile.fileCode}: ${err.message}`);
            }
            await this.prisma.fileManager.deleteMany({ where: { targetId: userId, fileType } });
        }

        const uploadResult = await this.localStorage.saveFile(fileBuffer, folder);
        await this.prisma.fileManager.create({
            data: { ...uploadResult, fileType, targetId: userId },
        });
    }

    /** --------------------- Récupération des images --------------------- */
    async getUserImages(userId: string): Promise<{ main?: string; others?: string[] }> {
        const main = await this.prisma.fileManager.findFirst({ where: { targetId: userId, fileType: 'userMain' } });
        const others = await this.prisma.fileManager.findMany({ where: { targetId: userId, fileType: 'userOther' } });

        return {
            main: main ? getPublicFileUrl(main.fileUrl) : null,
            others: others.map(f => getPublicFileUrl(f.fileUrl)),
        };
    }
}
