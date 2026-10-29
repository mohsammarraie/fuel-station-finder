import { Inject, Injectable } from "@nestjs/common";
import {
  PostgresStationRepository,
  type StationRepository,
} from "../repositories/station-repository.js";
import type { StationListFilters } from "../validators/station-query.js";

@Injectable()
export class StationService {
  constructor(
    @Inject(PostgresStationRepository)
    private readonly stationRepository: StationRepository,
  ) {}

  findAll(filters: StationListFilters) {
    return this.stationRepository.findAll(filters);
  }
}
