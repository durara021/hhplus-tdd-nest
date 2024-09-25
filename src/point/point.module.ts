import { Module } from "@nestjs/common";
import { PointController } from "./point.controller";
import { PointService } from "./point.service";
import { DatabaseModule } from "src/database/database.module";
import { PointRepositoryImpl } from "./point.repositoryImpl";

@Module({
    imports: [DatabaseModule],
    controllers: [PointController],
    providers: [PointService, PointRepositoryImpl],
})
export class PointModule {}