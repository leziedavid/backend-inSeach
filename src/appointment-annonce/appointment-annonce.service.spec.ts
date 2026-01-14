import { Test, TestingModule } from '@nestjs/testing';
import { AppointmentAnnonceService } from './appointment-annonce.service';

describe('AppointmentAnnonceService', () => {
  let service: AppointmentAnnonceService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AppointmentAnnonceService],
    }).compile();

    service = module.get<AppointmentAnnonceService>(AppointmentAnnonceService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
