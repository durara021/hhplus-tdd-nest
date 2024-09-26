import { Body, Controller, Get, Param, Patch, ValidationPipe } from "@nestjs/common";
import { PointHistory, UserPoint } from "./point.model";
import { PointBody as PointDto } from "./point.dto";
import { PointService } from "./point.service";

@Controller('/point')
export class PointController {

    constructor(
        private readonly pointService: PointService
    ) {}
    
    /**
     * 유닛테스트가 필요하지 않다고 판단됨.
     *  - 단순히 id의 형변환 및 UserPoint속성의 point만 service로 넘겨주는 역할을 하기 때문
    */

    /**
     * TODO - 특정 유저의 포인트를 조회하는 기능을 작성해주세요.
     */
    @Get(':id')
    async point(@Param('id') id): Promise<UserPoint> {
        return this.pointService.point(Number.parseInt(id));
    }

    /**
     * TODO - 특정 유저의 포인트 충전/이용 내역을 조회하는 기능을 작성해주세요.
     */
    @Get(':id/histories')
    async history(@Param('id') id): Promise<PointHistory[]> {
        return this.pointService.history(Number.parseInt(id));
    }

    /**
     * TODO - 특정 유저의 포인트를 충전하는 기능을 작성해주세요.
     */
    @Patch(':id/charge')
    async charge(
        @Param('id') id,
        @Body(ValidationPipe) pointDto: PointDto,
    ): Promise<UserPoint> {
        return this.pointService.charge(Number.parseInt(id), pointDto.amount);
    }

    /**
     * TODO - 특정 유저의 포인트를 사용하는 기능을 작성해주세요.
     */
    @Patch(':id/use')
    async use(
        @Param('id') id,
        @Body(ValidationPipe) pointDto: PointDto,
    ): Promise<UserPoint> {
        return this.pointService.use(Number.parseInt(id), pointDto.amount);
    }
  
}