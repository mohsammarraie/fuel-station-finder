import { BadRequestException, Controller, Get, Inject, Query } from "@nestjs/common";
import { StationService } from "../services/station-service.js";
import { stationQuerySchema } from "../validators/station-query.js";

@Controller("api/stations")
export class StationController {
  constructor(@Inject(StationService) private readonly stationService: StationService) {}

  @Get()
  async listStations(@Query() query: Record<string, unknown>) {
    const parsedQuery = stationQuerySchema.safeParse(query);
    if (!parsedQuery.success) {
      throw new BadRequestException({
        error: {
          code: "INVALID_QUERY",
          message: "The station query parameters are invalid.",
          details: parsedQuery.error.issues.map((issue) => ({
            field: issue.path.join("."),
            message: issue.message,
          })),
        },
      });
    }

    const stations = await this.stationService.findAll(parsedQuery.data);
    return { data: stations, meta: { count: stations.length } };
  }
}
