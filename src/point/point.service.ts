import { Injectable } from '@nestjs/common';
import { PointRepositoryImpl } from './point.repository';
import { UserPoint, PointHistory } from './point.model';
import { ChangePoint } from './point.dto';

class Mutex {

	private mutex = Promise.resolve();

	async lock(): Promise<() => void> {

		let unlock: () => void;

		const clock = new Promise<void>(resolve => unlock = resolve);

		const previousLock = this.mutex;
		this.mutex = this.mutex.then(() => clock);

		await previousLock;

		return unlock;

	}

}

@Injectable()
export class PointService {

	private readonly userMutexes: Map<number, Mutex> = new Map();

	constructor(
		private readonly pointRepository: PointRepositoryImpl
	) {}

	private getUserMutex(id: number): Mutex {
		if (!this.userMutexes.has(id)) {
		  this.userMutexes.set(id, new Mutex());
		}
		return this.userMutexes.get(id) as Mutex;
	}

	/**
	 * 1. point : controller로 부터 전달받은 id 객체를
	 * repo의 point 메서드로 전달하여
	 * 반환받은 UserPoint형태의 객체(id: number, point: number)를 controller로 반환
	 */
	async point(id: number): Promise<UserPoint> {

		this.isValidNum(id, 'id');
		return this.pointRepository.point(id);

	}

	/**
	 * 2. history 기능 : contorller로 부터 전달받은 id 객체를
	 * repo로  전달하여 전달받은 id 객체를 depo의 history 메서드로 전달하여
	 * 반환받은 PointHistory 객체를 controller로 반환
	 */
	async history(id: number): Promise<PointHistory[]> {
		
		this.isValidNum(id, 'id');
		return this.pointRepository.history(id);

	}

	/**
	 * 3. charge 기능 : contoller로 부터 amount객체의 값과 전달받은 id 객체를
	 * repo의 point로 전달하여 반환받은 UserPoint의 point의 값(controller로 부터 전달받은 point 값 + amount 값) 을
	 * 포함하여 ChangePoint의 형식으로 패키징한 뒤 repo의 charge메서드로 전달하여
	 * 데이터 업데이트 및 히스토리 추가
	 */

	async charge(id: number, amount: number): Promise<UserPoint> {

		this.isValidNum(id, 'id');
		this.isValidNum(amount, 'amount');
		this.isOver10000(amount);

		const mutex = this.getUserMutex(id);

		const unlock = await mutex.lock(); // 동시성 제어 시작

		try {
			
			const changePoint:ChangePoint = new ChangePoint();

			changePoint.amount = amount;
			changePoint.point = (await this.pointRepository.point(id)).point + amount;
			changePoint.id = id;

			return await this.pointRepository.charge(changePoint);

		} finally {
			unlock(); // 작업이 끝나면 뮤텍스 해제
		}

	}

	/** 
	 * 4. use 기능 : contoller로 부터 amount객체의 값과 전달받은 id 객체를
	 * repo의 point로 전달하여 반환받은 UserPoint의 point의 값(controller로 부터 전달받은 point 값 - amount 값) 을
	 * 포함하여 ChangePoint의 형식으로 패키징한 뒤 repo의  use메서드로 전달하여
	 * 데이터 업데이트 및 히스토리 추가
	 */
	async use(id: number, amount: number): Promise<UserPoint> {

		this.isValidNum(id, 'id');
		this.isValidNum(amount, 'amount');
		this.isOver10000(amount);

		const mutex = this.getUserMutex(id);
		const unlock = await mutex.lock(); // 동시성 제어 시작

		try {

			const changePoint:ChangePoint = new ChangePoint();

			let isBigger:boolean = false;
			let point = (await this.pointRepository.point(id)).point;

			if(point >= amount) {
				point -= amount;
				isBigger = true;
			}
			
			changePoint.amount = amount;
			changePoint.point = point;
			changePoint.id = id;
			changePoint.isBigger = isBigger;
			
			return await this.pointRepository.use(changePoint);

		} finally {
			unlock(); // 작업이 끝나면 뮤텍스 해제
		}
	}

	//한 번에 10000이상 충전/사용 불가 정책
	private isOver10000(amount: number){

		if(amount < 10000) return;
		throw new Error(`${amount}은 충전/사용 하실 수 없습니다.`);

	}

	private isValidNum(num: any, gubun: string){

		if(Number.isInteger(num) && num > 0) return;
		throw new Error(`${num}는 입력할 수 없는 ${gubun}형식입니다.`);
		
	}

}