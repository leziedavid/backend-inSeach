import { Test, TestingModule } from '@nestjs/testing';
import { AllCategoriesController } from './all-categories.controller';

describe('AllCategoriesController', () => {
  let controller: AllCategoriesController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AllCategoriesController],
    }).compile();

    controller = module.get<AllCategoriesController>(AllCategoriesController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
