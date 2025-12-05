import { Test, TestingModule } from '@nestjs/testing';
import { MyServicesController } from './my-services.controller';

describe('MyServicesController', () => {
  let controller: MyServicesController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [MyServicesController],
    }).compile();

    controller = module.get<MyServicesController>(MyServicesController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
