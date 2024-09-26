import { Injectable } from '@nestjs/common';
import { UserPointTable } from '../database/userpoint.table';
import { PointHistoryTable } from '../database/pointhistory.table';
import { PointHistory, TransactionType, UserPoint } from './point.model';
import { ChangePoint } from './point.dto';

export interface PointRepository {

    /**
	   * TODO - 특정 유저의 포인트를 조회하는 기능을 작성해주세요.
     */
    point(id: number): Promise<UserPoint>;

    /**
     * TODO - 특정 유저의 포인트 충전/이용 내역을 조회하는 기능을 작성해주세요.
     */
    history(id: number): Promise<PointHistory[]>;

    /**
     * TODO - 특정 유저의 포인트를 충전하는 기능을 작성해주세요.
     */
    charge(changePoint: ChangePoint): Promise<UserPoint>;

    /**
     * TODO - 특정 유저의 포인트를 사용하는 기능을 작성해주세요.
     */
    use(changePoint: ChangePoint): Promise<UserPoint>;

}

@Injectable()
export class PointRepositoryImpl implements PointRepository {

  constructor(
    private readonly userDb: UserPointTable,
    private readonly historyDb: PointHistoryTable,
  ) {}

  /**
   * 유닛테스트가 필요하지 않다고 생각함.
   * - 서비스로부터 id와 point를 받아 table에서 자료를 검색 후 service에 전달하는 역할만을 수행하기때문
   */

  /**
   * 특정 유저의 포인트를 조회하는 기능을 구현합니다.
   */
  async point(id: number): Promise<UserPoint> {
    return this.userDb.selectById(id);
  }

  /**
   * 특정 유저의 포인트 충전/이용 내역을 조회하는 기능을 구현합니다.
   */
  async history(id: number): Promise<PointHistory[]> {
    return this.historyDb.selectAllByUserId(id);
  }

  /**
   * 특정 유저의 포인트를 충전하는 기능을 구현합니다.
   */
  async charge(changePoint: ChangePoint): Promise<UserPoint> {

    // 포인트 업데이트
    const updatedUserPoint = await this.userDb.insertOrUpdate(changePoint.id, changePoint.point);

    // 히스토리 추가
    await this.historyDb.insert(changePoint.id, changePoint.amount, TransactionType.CHARGE, Date.now());

    return updatedUserPoint;

  }

  /**
   * 특정 유저의 포인트를 사용하는 기능을 구현합니다.
   */
  async use(changePoint: ChangePoint): Promise<UserPoint> {

      // 포인트 업데이트
      const updatedUserPoint = await this.userDb.insertOrUpdate(changePoint.id, changePoint.point);

      /** 히스토리 추가
       * 사용하려는 포인트가 기존의 포인트보다 많을 경우
       * error 처리하지 않고 userPoint의 point값 보존 및 실패 이력 추가
       */ 
      let transactionType = TransactionType.USE;
      if(!changePoint.isBigger) transactionType = TransactionType.FAIL;
      await this.historyDb.insert(changePoint.id, changePoint.amount, transactionType, Date.now());

      return updatedUserPoint;

  }

}