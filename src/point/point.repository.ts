import { PointHistory, UserPoint } from "./point.model";

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
    charge(id: number, amount: number): Promise<UserPoint>;

    /**
     * TODO - 특정 유저의 포인트를 사용하는 기능을 작성해주세요.
     */
    use(id: number, amount: number): Promise<UserPoint>;

}