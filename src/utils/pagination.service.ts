import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import { Doshuffle } from './utils';

export type PaginateOptions = {
  model: Prisma.ModelName;
  page: number;
  limit: number;
  selectAndInclude?: {
    select?: Record<string, any>;
    include?: Record<string, any>;
  };
  conditions?: Record<string, any>;
  orderBy?: Record<string, any>;
  shuffle?: boolean;
  fileTypeListes?: string[];
  includeTotalElements?: boolean;
};

@Injectable()
export class FunctionService {
  constructor(private readonly prisma: PrismaService) {}

  private async enrichWithFiles(entity: any, fileTypeListes: string[]): Promise<any> {
    if (!fileTypeListes?.length) return { ...entity, files: [] };

    const files = await this.prisma.fileManager.findMany({
      where: {
        targetId: entity.id,
        fileType: { in: fileTypeListes },
      },
      orderBy: { createdAt: 'desc' },
    });

    return { ...entity, files };
  }

  async paginate<T>({
    model,
    page,
    limit,
    selectAndInclude,
    conditions,
    orderBy,
    shuffle,
    fileTypeListes,
    includeTotalElements = false,
  }: PaginateOptions) {
    // 🟢 VALIDATION STRICTE DES PARAMÈTRES
    const validPage = Math.max(1, Math.floor(Number(page) || 1));
    const validLimit = Math.min(Math.max(1, Math.floor(Number(limit) || 10)), 100); // Max 100 par page
    
    const skip = (validPage - 1) * validLimit;
    const take = validLimit;

    // 🔹 Nombre total pour la pagination
    const total = await this.prisma[model].count({
      where: { ...conditions },
    });

    // 🔹 Nombre total d'éléments (optionnel, identique ici mais peut différer avec d'autres logiques)
    let totalElements: number | undefined;
    if (includeTotalElements) {
      totalElements = total; // Optimisation : réutiliser le même count
    }

    // 🟢 REQUÊTE AVEC LIMITE FORCÉE
    let data = await this.prisma[model].findMany({
      skip,
      take, // ✅ Toujours défini maintenant
      where: { ...conditions },
      orderBy: { ...orderBy },
      ...(selectAndInclude || {}),
    });

    // 🔹 Supprimer le password si User
    if (model === 'User') {
      data = data.map(({ password, ...rest }) => rest);
    }

    if (shuffle) data = Doshuffle(data);

    // 🔄 Enrichir avec les fichiers si demandé
    if (fileTypeListes?.length) {
      data = await Promise.all(data.map((item) => this.enrichWithFiles(item, fileTypeListes)));
    }

    return {
      status: true,
      total,
      page: validPage,
      limit: validLimit,
      totalPages: Math.ceil(total / validLimit), // 🆕 Nombre de pages
      data,
      ...(includeTotalElements ? { totalElements } : {}),
    };
  }

  async search<T>({
    model,
    search,
    limit,
    selectAndInclude,
    conditions,
    wheres,
  }: {
    model: Prisma.ModelName;
    search: string;
    limit: number;
    selectAndInclude?: Prisma.SelectAndInclude;
    conditions?: Record<string, any>;
    wheres: string[];
  }) {
    if (!search) return { limit, data: [] };

    // 🟢 VALIDATION DE LA LIMITE
    const validLimit = Math.min(Math.max(1, Math.floor(Number(limit) || 10)), 15);

    const queries = wheres.map((key) => ({
      [key]: {
        contains: search,
        mode: 'insensitive',
      },
    }));

    let data = await this.prisma[model].findMany({
      take: validLimit, // ✅ Utiliser la limite validée
      where: {
        OR: queries,
        ...conditions,
      },
      ...(selectAndInclude || {}),
    });

    // 🔹 Supprimer le password si User
    if (model === 'User') {
      data = data.map(({ password, ...rest }) => rest);
    }

    return { limit: validLimit, data };
  }
}