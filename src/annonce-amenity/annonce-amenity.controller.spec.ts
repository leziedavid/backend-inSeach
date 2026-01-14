import { Test, TestingModule } from '@nestjs/testing';
import { AnnonceAmenityController } from './annonce-amenity.controller';

describe('AnnonceAmenityController', () => {
  let controller: AnnonceAmenityController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AnnonceAmenityController],
    }).compile();

    controller = module.get<AnnonceAmenityController>(AnnonceAmenityController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
