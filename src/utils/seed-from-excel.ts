// utils/seed-from-excel.ts
import * as XLSX from 'xlsx';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface SeedResult {
    success: boolean;
    importedCategories: number;
    importedSubcategories: number;
    skippedRows: number;
    errors: string[];
}

/**
 * Importe les catégories et sous-catégories depuis un buffer Excel ou CSV
 * @param fileBuffer Buffer du fichier
 * @returns résumé de l'import
 */
export async function seedFromExcelBuffer(fileBuffer: Buffer): Promise<SeedResult> {
    const result: SeedResult = {
        success: false,
        importedCategories: 0,
        importedSubcategories: 0,
        skippedRows: 0,
        errors: [],
    };

    try {
        if (!fileBuffer || !(fileBuffer instanceof Buffer)) throw new Error('Buffer invalide');

        const workbook = XLSX.read(fileBuffer, { type: 'buffer' });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const rows: any[] = XLSX.utils.sheet_to_json(sheet);

        const validEnumValues = ['APPOINTMENT', 'ORDER', 'PRODUCT', 'MIXED'];

        for (const [index, row] of rows.entries()) {
            try {
                const categoryName = (row.Category || '').trim();
                const subName = (row.Subcategory || '').trim();
                const rawTypes = (row.ServiceTypes || '').trim();
                const description = (row.Description || '').trim();

                if (!categoryName || !subName) {
                    result.skippedRows++;
                    continue;
                }

                const types = rawTypes
                    .split(',')
                    .map((t: string) => t.trim().toUpperCase())
                    .filter((t: string) => validEnumValues.includes(t));
                const finalTypes = types.length > 0 ? types : ['MIXED'];

                // 1️⃣ Créer ou récupérer la catégorie
                let category = await prisma.serviceCategory.findUnique({ where: { name: categoryName } });
                if (!category) {
                    category = await prisma.serviceCategory.create({ data: { name: categoryName, description } });
                    result.importedCategories++;
                    console.log(`Nouvelle catégorie créée: ${categoryName}`);
                }

                // 2️⃣ Créer ou mettre à jour la sous-catégorie
                let sub = await prisma.serviceSubcategory.findFirst({
                    where: { name: subName, categoryId: category.id },
                });

                if (!sub) {
                    await prisma.serviceSubcategory.create({
                        data: { name: subName, description, categoryId: category.id, serviceType: finalTypes },
                    });
                    result.importedSubcategories++;
                    console.log(`Nouvelle sous-catégorie créée: ${subName}`);
                } else {
                    const mergedTypes = Array.from(new Set([...(sub.serviceType || []), ...finalTypes]));
                    if (mergedTypes.length !== (sub.serviceType || []).length) {
                        await prisma.serviceSubcategory.update({ where: { id: sub.id }, data: { serviceType: mergedTypes } });
                        console.log(`Sous-catégorie mise à jour: ${subName}`);
                    }
                }
            } catch (rowError) {
                result.skippedRows++;
                result.errors.push(`Ligne ${index + 2}: ${rowError.message || rowError}`);
                console.warn(`Erreur ligne ${index + 2}:`, rowError);
            }
        }

        result.success = true;
        return result;
    } catch (error) {
        console.error('Erreur seedFromExcelBuffer:', error);
        result.errors.push(error.message || String(error));
        return result;
    }
}
