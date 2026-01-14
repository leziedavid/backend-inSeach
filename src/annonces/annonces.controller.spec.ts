import { Test, TestingModule } from '@nestjs/testing';
import { AnnoncesController } from './annonces.controller';

describe('AnnoncesController', () => {
  let controller: AnnoncesController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AnnoncesController],
    }).compile();

    controller = module.get<AnnoncesController>(AnnoncesController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
