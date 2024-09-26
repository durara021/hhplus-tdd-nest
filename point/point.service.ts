import { Injectable } from '@nestjs/common';
import { PointRepositoryImpl } from './point.repositoryImpl';
import { UserPoint, PointHistory } from './point.model';

@Injectable()
export class PointService {

	constructor(
		private readonly pointRepository: PointRepositoryImpl
	) {}

	async point(userId: number): Promise<UserPoint> {
		this.isValidNum(userId, 'id');
		return this.pointRepository.point(userId);
	}

	async history(userId: number): Promise<PointHistory[]> {
		this.isValidNum(userId, 'id');
		return this.pointRepository.history(userId);
	}

	async charge(userId: number, amount: number): Promise<UserPoint> {

			this.isValidNum(userId, 'id');
			this.isValidNum(amount, 'amount');

			amount += (await this.pointRepository.point(userId)).point;
			return this.pointRepository.charge(userId, amount);
	
	}

	async use(userId: number, amount: number): Promise<UserPoint> {

			this.isValidNum(userId, 'id');
			this.isValidNum(amount, 'amount');

			amount = (await this.pointRepository.point(userId)).point - amount;
			//console.log(amount);
			if(amount < 0) throw new Error('가용 포인트가 부족합니다.');
			return this.pointRepository.use(userId, amount);
		
	}

	private isValidNum(num: any, gubun: string){
		if(Number.isInteger(num) && num > 0) return;
		throw new Error(`${num}는 입력할 수 없는 ${gubun}형식입니다.`);
	}

}