import { Test, TestingModule } from '@nestjs/testing';
import { AnnonceAmenityService } from './annonce-amenity.service';

describe('AnnonceAmenityService', () => {
  let service: AnnonceAmenityService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AnnonceAmenityService],
    }).compile();

    service = module.get<AnnonceAmenityService>(AnnonceAmenityService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
