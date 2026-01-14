import { Test, TestingModule } from '@nestjs/testing';
import { AppointmentAnnonceController } from './appointment-annonce.controller';

describe('AppointmentAnnonceController', () => {
  let controller: AppointmentAnnonceController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AppointmentAnnonceController],
    }).compile();

    controller = module.get<AppointmentAnnonceController>(AppointmentAnnonceController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
