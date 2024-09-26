import { IsInt } from "class-validator";

export class PointBody {
    @IsInt()
    amount: number
}

export class ChangePoint {
    @IsInt()
    id: number
    amount: number
    point: number
    isBigger: boolean
}