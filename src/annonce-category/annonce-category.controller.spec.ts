import { Test, TestingModule } from '@nestjs/testing';
import { AnnonceCategoryController } from './annonce-category.controller';

describe('AnnonceCategoryController', () => {
  let controller: AnnonceCategoryController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AnnonceCategoryController],
    }).compile();

    controller = module.get<AnnonceCategoryController>(AnnonceCategoryController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
