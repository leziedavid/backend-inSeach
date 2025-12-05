import {Controller,Post,Get,Patch,Delete,Body,Param,UseInterceptors,UploadedFiles,UseGuards,Query,Req,BadRequestException,} from '@nestjs/common';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiResponse, ApiConsumes, ApiBearerAuth, ApiQuery, ApiBody } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/guards/jwt-auth.guard';
import { Request } from 'express';
import { CreateProductDto, UpdateProductDto } from 'src/common/dto/request/products.dto';
import { ProductService } from './product.service';
import { FilterParamsDto } from 'src/common/dto/request/filter-params.dto';

@ApiTags('Product Api')
@ApiBearerAuth('access-token')
@Controller('product')

export class ProductController {

    constructor(private readonly productService: ProductService) { }

    /* -------------------
     * CREATE PRODUCT
     * ------------------*/
    @UseGuards(JwtAuthGuard)
    @Post()
    @ApiOperation({ summary: 'Créer un nouveau produit' })
    @ApiConsumes('multipart/form-data')
    @UseInterceptors(FileFieldsInterceptor([  { name: 'images', maxCount: 10 },]))
    @ApiResponse({ status: 201, description: 'Produit créé avec succès.' })
    async createProduct(
        @UploadedFiles() files: { images?: Express.Multer.File[] },
        @Body() dto: CreateProductDto,
        @Req() req: Request, ) {
        dto.images = files.images ?? [];
        const user = req.user as any;
        return this.productService.create(dto, user.id);
    }

    /* -------------------
     * UPDATE PRODUCT
     * ------------------*/
    @UseGuards(JwtAuthGuard)
    @Patch(':id')
    @ApiOperation({ summary: 'Mettre à jour un produit' })
    @ApiConsumes('multipart/form-data')
    @UseInterceptors(FileFieldsInterceptor([
        { name: 'images', maxCount: 10 },
    ]))
    @ApiResponse({ status: 200, description: 'Produit mis à jour.' })
    @ApiResponse({ status: 404, description: 'Produit non trouvé.' })
    async updateProduct(
        @Param('id') id: string,
        @UploadedFiles() files: { images?: Express.Multer.File[] },
        @Body() dto: UpdateProductDto,
        @Req() req: Request,
    ) {
        dto.images = files.images ?? [];
        const user = req.user as any;
        return this.productService.update(id, dto);
    }

    /* -------------------
     * GET ONE PRODUCT
     * ------------------*/
    @Get(':id')
    @ApiOperation({ summary: 'Récupérer un produit par ID' })
    @ApiResponse({ status: 200, description: 'Produit récupéré avec succès.' })
    async getProductById(@Param('id') id: string) {
        return this.productService.findOne(id);
    }

    /* -------------------
     * GET ALL PRODUCTS
     * ------------------*/
    @Get()
    @ApiOperation({ summary: 'Liste paginée de tous les produits' })
    @ApiQuery({ name: 'page', required: false, type: Number })
    @ApiQuery({ name: 'limit', required: false, type: Number })
    @ApiResponse({ status: 200, description: 'Liste des produits récupérée avec succès.' })
    async getAllProducts(@Query() params: FilterParamsDto) {
        return this.productService.findAll(params);
    }

    /* -------------------
     * DELETE PRODUCT
     * ------------------*/
    @UseGuards(JwtAuthGuard)
    @Delete(':id')
    @ApiOperation({ summary: 'Supprimer un produit' })
    @ApiResponse({ status: 200, description: 'Produit supprimé avec succès.' })
    async deleteProduct(@Param('id') id: string, @Req() req: Request) {
        const user = req.user as any;
        return this.productService.remove(id);
    }

    /* -------------------
     * GET BEST SELLERS
     * ------------------*/
    @Get('bestsellers')
    @ApiOperation({ summary: 'Récupérer les produits best-sellers' })
    @ApiQuery({ name: 'page', required: false, type: Number })
    @ApiQuery({ name: 'limit', required: false, type: Number })
    async getBestSellers(@Query() params: FilterParamsDto) {
        return this.productService.getBestSellers(params);
    }

    /* -------------------
     * GET PRODUCTS BY CATEGORY / SUBCATEGORY (POST)
     * ------------------*/
    @Post('filter-produits')
    @ApiOperation({ summary: 'Récupérer les produits par catégorie et sous-catégorie (optionnelle)' })
    @ApiBody({ description: 'Filtres et pagination', type: FilterParamsDto })
    async getProductsByCategory(@Body() params: FilterParamsDto) {

        if (!params.categoryId) {
            throw new BadRequestException('categoryId requis');
        }
        return this.productService.getProductsByCategoryEndSubCategory(params);
    }


}
