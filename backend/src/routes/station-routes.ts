import { Router } from "express";
import { createListStationsHandler } from "../controllers/station-controller.js";
import {
  PostgresStationRepository,
  type StationRepository,
} from "../repositories/station-repository.js";

export function createStationRouter(
  stationRepository: StationRepository = new PostgresStationRepository(),
): Router {
  const router = Router();

  router.get("/", createListStationsHandler(stationRepository));

  return router;
}
