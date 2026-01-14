import { Test, TestingModule } from '@nestjs/testing';
import { AnnonceCategoryService } from './annonce-category.service';

describe('AnnonceCategoryService', () => {
  let service: AnnonceCategoryService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AnnonceCategoryService],
    }).compile();

    service = module.get<AnnonceCategoryService>(AnnonceCategoryService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
