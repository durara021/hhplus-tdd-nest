import { Injectable } from '@nestjs/common';
import { PointRepositoryImpl } from './point.repositoryImpl';
import { UserPoint, PointHistory } from './point.model';

@Injectable()
export class PointService {

	constructor(
		private readonly pointRepository: PointRepositoryImpl
	) {}

	async point(id: number): Promise<UserPoint> {
		this.isValidNum(id, 'id');
		return this.pointRepository.point(id);
	}

	async history(id: number): Promise<PointHistory[]> {
		this.isValidNum(id, 'id');
		return this.pointRepository.history(id);
	}

	async charge(id: number, amount: number): Promise<UserPoint> {

			this.isValidNum(id, 'id');
			this.isValidNum(amount, 'amount');

			amount += (await this.pointRepository.point(id)).point;

			return this.pointRepository.charge(id, amount);

	}

	async use(id: number, amount: number): Promise<UserPoint> {
			this.isValidNum(id, 'id');
			this.isValidNum(amount, 'amount');

			amount = (await this.pointRepository.point(id)).point - amount;
			if(amount < 0) {
				throw new Error('사용할 수 있는 포인트가 부족합니다.')
			};
			return this.pointRepository.use(id, amount);
	}

	private isValidNum(num: any, gubun: string){
		if(Number.isInteger(num) && num > 0) return;
		throw new Error(`${num}는 입력할 수 없는 ${gubun}형식입니다.`);
	}

}