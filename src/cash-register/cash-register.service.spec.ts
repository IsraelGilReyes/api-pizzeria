import { Test, TestingModule } from '@nestjs/testing';
import { CashRegisterService } from './cash-register.service';
import { PrismaService } from '../prisma/prisma.service';

describe('CashRegisterService', () => {
  let service: CashRegisterService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CashRegisterService,
        {
          provide: PrismaService,
          useValue: {},
        },
      ],
    }).compile();

    service = module.get<CashRegisterService>(CashRegisterService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});