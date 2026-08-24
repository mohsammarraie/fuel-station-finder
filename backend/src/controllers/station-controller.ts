import type { RequestHandler } from "express";
import type { StationRepository } from "../repositories/station-repository.js";
import { stationQuerySchema } from "../validators/station-query.js";

export function createListStationsHandler(
  stationRepository: StationRepository,
): RequestHandler {
  return async (request, response, next) => {
    const parsedQuery = stationQuerySchema.safeParse(request.query);

    if (!parsedQuery.success) {
      response.status(400).json({
        error: {
          code: "INVALID_QUERY",
          message: "The station query parameters are invalid.",
          details: parsedQuery.error.issues.map((issue) => ({
            field: issue.path.join("."),
            message: issue.message,
          })),
        },
      });
      return;
    }

    try {
      const stations = await stationRepository.findAll(parsedQuery.data);

      response.json({
        data: stations,
        meta: {
          count: stations.length,
        },
      });
    } catch (error) {
      next(error);
    }
  };
}
