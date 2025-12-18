// utils/user.mapper.ts
import { User, Wallet, Service, Order, Appointment, Transaction, UserCategory, UserSubcategory, Icone, FileManager } from '@prisma/client';

interface MappingOptions {
    includeRelations?: {
        wallet?: boolean;
        providedServices?: boolean;
        clientOrders?: boolean;
        providerOrders?: boolean;
        clientAppointments?: boolean;
        providerAppointments?: boolean;
        transactions?: boolean;
        selectedCategories?: boolean;
        selectedSubcategories?: boolean;
        icone?: boolean;
        images?: boolean;
    };
    files?: Record<string, string>; // mapping id utilisateur -> url fichier
}

/**
 * Map un User Prisma vers un objet léger pour API
 */
export function mapUser(user: any & {
    wallet?: Wallet;
    providedServices?: Service[];
    clientOrders?: Order[];
    providerOrders?: Order[];
    clientAppointments?: Appointment[];
    providerAppointments?: Appointment[];
    transactions?: Transaction[];
    selectedCategories?: UserCategory[];
    selectedSubcategories?: UserSubcategory[];
    icone?: Icone;
    images: true,
},

options?: MappingOptions) {

    const mapped: any = {
        id: user.id,
        email: user.email ?? undefined,
        name: user.name ?? undefined,
        phone: user.phone ?? undefined,
        typeCompte: user.typeCompte,
        roles: user.roles,
        serviceType:user.serviceType,
        companyName: user.companyName ?? undefined,
        status: user.status,
        createdAt: user.createdAt.toISOString(),
        updatedAt: user.updatedAt.toISOString(),
        location: user.location ?? undefined,
        
    };

    // Relations optionnelles
    if (options?.includeRelations?.wallet && user.wallet) mapped.wallet = user.wallet;
    if (options?.includeRelations?.providedServices && user.providedServices) mapped.providedServices = user.providedServices;
    if (options?.includeRelations?.clientOrders && user.clientOrders) mapped.clientOrders = user.clientOrders;
    if (options?.includeRelations?.providerOrders && user.providerOrders) mapped.providerOrders = user.providerOrders;
    if (options?.includeRelations?.clientAppointments && user.clientAppointments) mapped.clientAppointments = user.clientAppointments;
    if (options?.includeRelations?.providerAppointments && user.providerAppointments) mapped.providerAppointments = user.providerAppointments;
    if (options?.includeRelations?.transactions && user.transactions) mapped.transactions = user.transactions;
    if (options?.includeRelations?.selectedCategories && user.selectedCategories) mapped.selectedCategories = user.selectedCategories;
    if (options?.includeRelations?.selectedSubcategories && user.selectedSubcategories) mapped.selectedSubcategories = user.selectedSubcategories;
    if (options?.includeRelations?.icone && user.icone) mapped.icone = user.icone;

    // Images
    if (options?.includeRelations?.images && options.files) {
        mapped.images = options.files[user.id] ? [options.files[user.id]] : undefined;
    }

    return mapped;
}

