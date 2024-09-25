import { Injectable } from '@nestjs/common';
import { UserPointTable } from '../database/userpoint.table';
import { PointHistoryTable } from '../database/pointhistory.table';
import { PointHistory, TransactionType, UserPoint } from './point.model';
import { PointRepository } from './point.repository';

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
  async charge(id: number, amount: number): Promise<UserPoint> {

    // 포인트 업데이트
    const updatedUserPoint = await this.userDb.insertOrUpdate(id, amount);

    // 히스토리 추가
    await this.historyDb.insert(id, amount, TransactionType.CHARGE, Date.now());

    return updatedUserPoint;
  }

  /**
   * 특정 유저의 포인트를 사용하는 기능을 구현합니다.
   */
  async use(id: number, amount: number): Promise<UserPoint> {

    // 포인트 업데이트
    const updatedUserPoint = await this.userDb.insertOrUpdate(id, amount);

    // 히스토리 추가
    await this.historyDb.insert(id, amount, TransactionType.USE, Date.now());

    return updatedUserPoint;
  }
}