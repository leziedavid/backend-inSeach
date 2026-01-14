import { Test, TestingModule } from '@nestjs/testing';
import { AnnonceTypeService } from './annonce-type.service';

describe('AnnonceTypeService', () => {
  let service: AnnonceTypeService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AnnonceTypeService],
    }).compile();

    service = module.get<AnnonceTypeService>(AnnonceTypeService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
