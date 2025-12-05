import { Test, TestingModule } from '@nestjs/testing';
import { MyServicesService } from './my-services.service';

describe('MyServicesService', () => {
  let service: MyServicesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [MyServicesService],
    }).compile();

    service = module.get<MyServicesService>(MyServicesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
