import { Test, TestingModule } from '@nestjs/testing';
import { AnnonceTypeController } from './annonce-type.controller';

describe('AnnonceTypeController', () => {
  let controller: AnnonceTypeController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AnnonceTypeController],
    }).compile();

    controller = module.get<AnnonceTypeController>(AnnonceTypeController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
