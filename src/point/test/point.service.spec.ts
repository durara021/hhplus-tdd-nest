import { Test, TestingModule } from '@nestjs/testing';
import { PointService } from '../point.service';
import { PointRepositoryImpl } from '../point.repository';

/**

  1. controller 및 depository의 경우 고유의 비즈니스 로직이 없이 파라미터의 전달만을 담당하고 있어 1개의 layer에서만 테스트 하는 단위 테스트는 불가능 하다고 판단하여 생략
  2. point와 history의 경우 마찬가지로 고유의 비즈니스 로직 없지만 controller로 부터 전달받은 파라미터의 유효성 검사 테스트 진행
  3. charge와 use의 경우 고유로직은 있지만 repo로 부터 UserPoint객체를 전달받아 로직을 구현해야 함으로 전달받은 파라미터의 유효성 검사 테스트만 진행.
  4. database에 stub가 구현되어 있기 때문에 stub를 이용한 테스를 하는게 힘들다고 판단.
  */

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

  describe('id 유효성 검사(실패 하는 경우)', () => {
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

  describe('amount 유효성 검사(실패 하는 경우)', () => {

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