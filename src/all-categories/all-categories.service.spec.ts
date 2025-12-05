import { Test, TestingModule } from '@nestjs/testing';
import { AllCategoriesService } from './all-categories.service';

describe('AllCategoriesService', () => {
  let service: AllCategoriesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AllCategoriesService],
    }).compile();

    service = module.get<AllCategoriesService>(AllCategoriesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
