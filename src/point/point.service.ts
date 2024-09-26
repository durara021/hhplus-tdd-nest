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

	async point(id: number): Promise<UserPoint> {

		this.isValidNum(id, 'id');
		return this.pointRepository.point(id);

	}

	async history(id: number): Promise<PointHistory[]> {
		
		this.isValidNum(id, 'id');
		return this.pointRepository.history((await this.point(id)).id);

	}

	async charge(id: number, amount: number): Promise<UserPoint> {

		this.isValidNum(id, 'id');
		this.isValidNum(amount, 'amount');

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

	async use(id: number, amount: number): Promise<UserPoint> {

		this.isValidNum(id, 'id');
		this.isValidNum(amount, 'amount');

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

	private isValidNum(num: any, gubun: string){

		if(Number.isInteger(num) && num > 0) return;
		throw new Error(`${num}는 입력할 수 없는 ${gubun}형식입니다.`);
		
	}

}