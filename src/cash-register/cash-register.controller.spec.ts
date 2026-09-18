import { Test, TestingModule } from '@nestjs/testing';
import { CashRegisterController } from './cash-register.controller';
import { CashRegisterService } from './cash-register.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

describe('CashRegisterController', () => {
  let controller: CashRegisterController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CashRegisterController],
      providers: [
        {
          provide: CashRegisterService,
          useValue: {},
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({
        canActivate: () => true,
      })
      .compile();

    controller = module.get<CashRegisterController>(CashRegisterController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});