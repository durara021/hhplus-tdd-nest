import { Test, TestingModule } from '@nestjs/testing';
import { PointService } from './point.service';
import { PointRepositoryImpl } from './point.repositoryImpl';
import { UserPoint } from './point.model';

describe('PointService', () => {
  let service: PointService;
  let pointRepository: PointRepositoryImpl;

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

  let userIds: any[] = [null, '20', -30, 40.5, 'fifty', {}, [], true];
  let userId: number = 1;
  let amounts: any[] = [null, '20', -30, 40.5, 'fifty', {}, [], true];;
  let amount = 1000;

  describe('유효성 검사', () => {
    userIds.forEach(id =>{
        it('point_id', async () => {
          await expect(service.point(id)).rejects.toThrow(`${id}는 입력할 수 없는 id형식입니다.`);
        });
  
        it('history_id', async () => {
          await expect(service.history(id)).rejects.toThrow(`${id}는 입력할 수 없는 id형식입니다.`);
        });
  
        it('charge_id', async () => {
          await expect(service.charge(id, amount)).rejects.toThrow(`${id}는 입력할 수 없는 id형식입니다.`);
        });
  
        it('use_id', async () => {
          await expect(service.use(id, amount)).rejects.toThrow(`${id}는 입력할 수 없는 id형식입니다.`);
        });
      });
      
    amounts.forEach(amt =>{
      it('charge_amount', async () => {
        await expect(service.charge(userId, amt)).rejects.toThrow(`${amt}는 입력할 수 없는 amount형식입니다.`);
      });

      it('use_amount', async () => {
        await expect(service.use(userId, amt)).rejects.toThrow(`${amt}는 입력할 수 없는 amount형식입니다.`);
      });
    });    
  });

  let userPoint:UserPoint = {id:1, point:2000, updateMillis: Date.now() };
  describe('기능 검사', () => {
    it('charge', async () => {
      pointRepository.charge = jest.fn().mockResolvedValue(userPoint);
      expect((await service.charge(userId, amount)).point).toBe((await service.point(userId)).point + amount);
    });

    it('use_point>=amount', async () => {
      userPoint.point = 0;
      pointRepository.use = jest.fn().mockResolvedValue(userPoint);
      expect((await service.use(userId, amount)).point).toBe((await service.point(userId)).point - amount);
    });

    it('use_point<amount', () => {
      amount = 2000;
      expect(service.use(userId, amount)).rejects.toThrow('가용 포인트가 부족합니다.');
    });
  });
});