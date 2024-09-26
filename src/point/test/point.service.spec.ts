import { Test, TestingModule } from '@nestjs/testing';
import { PointService } from '../point.service';
import { PointRepositoryImpl } from '../point.repository';
import { ChangePoint } from '../point.dto';

describe('PointService', () => {
  let service: PointService;
  let pointRepository: PointRepositoryImpl;

  let ids: any[];
  let id: number;
  let amounts: any[];
  let amount: number;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PointService,
        {
          provide: PointRepositoryImpl,
          useValue: {
            point: jest.fn().mockResolvedValue({ point: 1000 }),
            history: jest.fn(),
            charge: jest.fn(),
            use: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<PointService>(PointService);
    pointRepository = module.get<PointRepositoryImpl>(PointRepositoryImpl);

    });

  describe('id 유효성 검사(실패)', () => {
    ids = [null, '20', -30, 40.5, 'fifty', {}, [], true];
    amount = 500;
    ids.forEach(id =>{
      it('point에서', async () => {
        await expect(service.point(id)).rejects.toThrow(`${id}는 입력할 수 없는 id형식입니다.`);
      });

      it('history에서', async () => {
        await expect(service.history(id)).rejects.toThrow(`${id}는 입력할 수 없는 id형식입니다.`);
      });

      it('charge에서', async () => {
        await expect(service.charge(id, amount)).rejects.toThrow(`${id}는 입력할 수 없는 id형식입니다.`);
      });

      it('use에서', async () => {
        await expect(service.use(id, amount)).rejects.toThrow(`${id}는 입력할 수 없는 id형식입니다.`);
      });
    });
  });

  describe('amount 유효성 검사', () => {

    id = 1;
    amounts = [null, '20', -30, 40.5, 'fifty', {}, [], true];

    amounts.forEach(amount =>{
      it('charge에서 amount유효성 검사', async () => {
        await expect(service.charge(id, amount)).rejects.toThrow(`${amount}는 입력할 수 없는 amount형식입니다.`);
      });

      it('use에서 amount유효성 검사', async () => {
        await expect(service.use(id, amount)).rejects.toThrow(`${amount}는 입력할 수 없는 amount형식입니다.`);
      });
    });

  });

});