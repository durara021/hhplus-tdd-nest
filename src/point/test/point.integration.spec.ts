import { Test, TestingModule } from '@nestjs/testing';
import { PointService } from '../point.service';
import { PointRepositoryImpl } from '../point.repository';
import { UserPointTable } from '../../database/userpoint.table';
import { PointHistoryTable } from '../../database/pointhistory.table';

describe('통합 테스트', () => {
  let service: PointService;
  let userPointTable: UserPointTable;
  let pointHistoryTable: PointHistoryTable;

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

  /**
   * service 요청 repo로 부터 전달받은
   * database 에서 검색된 값이 정확한지 테스트 
   */
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

  /**
   * 하나의 기능이 동시에 여러번 요청되었을 때
   * 모든 요청이 정상적으로 반영되는지 테스트
   */
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

    /**
     * 동시성 제어를 하였을 경우
     * 실패한 테스트 이후의 테스트가 정상적으로 진행되는지에 대한 테스트
     * + 이 테스트 때문에 실패할 경우 Error처리를 하지 않고 실패한 히스토리를 작성하는 정책 추가
     */
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