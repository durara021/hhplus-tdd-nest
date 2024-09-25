import { Test, TestingModule } from '@nestjs/testing';
import { PointService } from './point.service';
import { PointRepositoryImpl } from './point.repositoryImpl';
import { UserPoint, PointHistory, TransactionType } from './point.model';

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
            point: jest.fn().mockResolvedValue({point: 1000}),
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
  
  //id에 맞지 않는 값이 부여될 경우
  const ids: any[] = [null, '20', -30, 40.5, 'fifty', {}, [], true];
  //정상적인 id
  const id: number = 1;
  
  //amount에 맞지 않는 값이 부여될 경우
  const amounts: any[] = [null, '20', -30, 40.5, 'fifty', {}, [], true];
  //정상적인 amount
  let amount: number = 2000;

  describe('id 유효성 검사(실패)', () => {
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

  describe('amount 유효성 검사(실패)', () => {
    amounts.forEach(amount =>{
      it('charge에서', async () => {
        await expect(service.charge(id, amount)).rejects.toThrow(`${amount}는 입력할 수 없는 amount형식입니다.`);
      });

      it('use에서', async () => {
        await expect(service.use(id, amount)).rejects.toThrow(`${amount}는 입력할 수 없는 amount형식입니다.`);
      });
    });

  });

  describe('charge 기능', () => {
    it('성공', async () => {
      const userPoint:UserPoint = {id:1, point:3000, updateMillis: Date.now()};
      pointRepository.charge = jest.fn().mockResolvedValue(userPoint);
      expect((await service.charge(id, amount)).point).toEqual(amount +(await pointRepository.point(id)).point);
    });
  });

  describe('use 유효성 검사', () => {
    it('point가 amount보다 작을 경우', async () => {
      await expect(service.use(id, amount)).rejects.toThrow('사용할 수 있는 포인트가 부족합니다.');
    });
    it('point가 amount보다 클 경우', async () => {
      const userPoint:UserPoint = {id:1, point:500, updateMillis: Date.now()};
      pointRepository.use = jest.fn().mockResolvedValue(userPoint);
      amount = 500;
      expect((await service.use(id, amount)).point).toEqual((await pointRepository.point(id)).point - amount);
    });
  });
  
});