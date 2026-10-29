import "reflect-metadata";
import { Module, type Type } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import type { INestApplication } from "@nestjs/common";
import { HealthController } from "./controllers/health-controller.js";
import { StationController } from "./controllers/station-controller.js";
import { ApiExceptionFilter } from "./filters/api-exception.filter.js";
import { requestLogger } from "./logger.js";
import { PostgresStationRepository } from "./repositories/station-repository.js";
import { StationService } from "./services/station-service.js";

@Module({
  controllers: [HealthController, StationController],
  providers: [PostgresStationRepository, StationService],
})
export class AppModule {}

export async function createApp(module: Type<unknown> = AppModule): Promise<INestApplication> {
  const app = await NestFactory.create(module, { logger: false });
  app.getHttpAdapter().getInstance().disable("x-powered-by");
  app.use(requestLogger);
  app.enableCors();
  app.useGlobalFilters(new ApiExceptionFilter());
  return app;
}
