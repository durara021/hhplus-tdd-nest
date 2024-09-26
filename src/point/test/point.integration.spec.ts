import { Test, TestingModule } from '@nestjs/testing';
import { PointService } from '../point.service';
import { PointRepositoryImpl } from '../point.repository';
import { UserPointTable } from '../../database/userpoint.table';
import { PointHistoryTable } from '../../database/pointhistory.table';
import { PointHistory, UserPoint } from '../point.model';

describe('통합 테스트', () => {
  let service: PointService;
  let userPointTable: UserPointTable;
  let pointHistoryTable: PointHistoryTable;
  let pointRepository: PointRepositoryImpl;

  beforeEach(async () => {

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PointService,
        PointRepositoryImpl,  // PointRepositoryImpl 주입
        UserPointTable,  // UserPointTable 주입
        PointHistoryTable,  // PointHistoryTable 주입
      ],
    }).compile();

    service = module.get<PointService>(PointService);
    userPointTable = module.get<UserPointTable>(UserPointTable);
    pointHistoryTable = module.get<PointHistoryTable>(PointHistoryTable);

  });

  describe('단일 기능 테스트', () =>  {
    it('point', async () => {
      expect((await service.point(1)).point).toEqual(0);
      expect((await service.point(1)).id).toEqual(1);
    });

    it('history', async () => {
      expect((await service.history(1)).length).toEqual(0);
    });

    it('charge', async () => {
      expect((await service.charge(1, 1000)).point).toEqual(1000);
    });

    it('use', async () => {
      expect((await service.use(1, 1000)).point).toEqual(0);
    });

  });

  describe('동시성 테스트', () => {

    it('charge테스트', async () => {
      let tests = [
        service.charge(1, 4000),
        service.charge(1, 1000),
        service.charge(1, 2000),
      ];

      await Promise.all(tests);

      
      expect((await service.point(1)).point).toEqual(7000);
    });
      
    it('use테스트', async () => {
      const tests = [
        service.charge(1, 4000),
        service.charge(1, 1000),
        service.charge(1, 2000),
        service.use(1, 4000),
        service.use(1, 1000),
      ];
      
      await Promise.all(tests);
      
      expect((await service.point(1)).point).toEqual(2000);
    });

    it('history 테스트', async () => {

      const pointHistory  =  [
        { id: 1, userId: 1, amount: 4000, type: 0 },
        { id: 2, userId: 1, amount: 2000, type: 0 },
        { id: 3, userId: 1, amount: 3000, type: 1 }
      ];
  
      const tests = [
        service.charge(1, 4000),
        service.charge(1, 2000),
        service.use(1, 3000),
      ];

      await Promise.all(tests);

      expect((await service.history(1)).map((u) => ({
        id: u.id,
        userId: u.userId,
        type: u.type,
        amount: u.amount,
        }))
      ).toEqual(pointHistory);

    });


    it('history 복합 테스트', async () => {

      const tests = [
        service.charge(1, 4000),
        service.use(1, 5000),
        service.charge(2, 2000),
        service.use(1, 1100),
        service.use(3, 3000),
        service.charge(2, 3000),
        service.use(3, 6000),
        service.charge(1, 500),
      ];

      await Promise.all(tests);

      const userHistory1 = [
        { userId: 1, amount: 4000, type:0 },
        { userId: 1, amount: 5000, type:2 },
        { userId: 1, amount: 1100, type:1 },
        { userId: 1, amount: 500, type:0 },
      ];

      const userHistory2 = [
        { userId: 2, amount: 2000, type:0 },
        { userId: 2, amount: 3000, type:0 },
      ];

      const userHistory3 = [
        { userId: 3, amount: 3000, type:2 },
        { userId: 3, amount: 6000, type:2 },
      ];
      
      expect((await service.history(1)).map((u) => ({
        userId: u.userId,
        type: u.type,
        amount: u.amount,
        }))
      ).toEqual(userHistory1);

      expect((await service.history(2)).map((u) => ({
        userId: u.userId,
        type: u.type,
        amount: u.amount,
        }))
      ).toEqual(userHistory2);

      expect((await service.history(3)).map((u) => ({
        userId: u.userId,
        type: u.type,
        amount: u.amount,
        }))
      ).toEqual(userHistory3);

    });

  });

});