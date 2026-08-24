import { z } from "zod";
import type { SourceStation } from "../types/source-station.js";

export const DEFAULT_STATION_SOURCE_URL =
  "https://geoportal.stadt-koeln.de/arcgis/rest/services/verkehr/gefahrgutstrecken/MapServer/0/query";

const DEFAULT_PAGE_SIZE = 500;
const REQUEST_TIMEOUT_MS = 30_000;
const MAX_PAGES = 1_000;

const arcGisFeatureSchema = z.object({
  attributes: z.object({
    objectid: z.number().int().positive(),
    adresse: z.string().trim().min(1),
  }),
  geometry: z.object({
    x: z.number().min(-180).max(180),
    y: z.number().min(-90).max(90),
  }),
});

const arcGisPageSchema = z.object({
  features: z.array(arcGisFeatureSchema),
  exceededTransferLimit: z.boolean().optional(),
});

const arcGisErrorSchema = z.object({
  error: z.object({
    code: z.number().optional(),
    message: z.string(),
    details: z.array(z.string()).optional(),
  }),
});

export type FetchLike = (
  input: string | URL,
  init?: RequestInit,
) => Promise<Response>;

export interface CologneStationClientOptions {
  sourceUrl?: string;
  pageSize?: number;
  fetchImpl?: FetchLike;
}

export class CologneStationClient {
  readonly sourceUrl: string;
  private readonly pageSize: number;
  private readonly fetchImpl: FetchLike;

  constructor(options: CologneStationClientOptions = {}) {
    this.sourceUrl = options.sourceUrl ?? DEFAULT_STATION_SOURCE_URL;
    this.pageSize = options.pageSize ?? DEFAULT_PAGE_SIZE;
    this.fetchImpl = options.fetchImpl ?? fetch;

    if (!Number.isInteger(this.pageSize) || this.pageSize < 1 || this.pageSize > 5_000) {
      throw new Error("Station import page size must be an integer from 1 to 5000.");
    }
  }

  async fetchStations(): Promise<SourceStation[]> {
    const stations = new Map<number, SourceStation>();
    let offset = 0;

    for (let pageNumber = 1; pageNumber <= MAX_PAGES; pageNumber += 1) {
      const page = await this.fetchPage(offset);

      for (const feature of page.features) {
        const station: SourceStation = {
          externalId: feature.attributes.objectid,
          address: feature.attributes.adresse,
          longitude: feature.geometry.x,
          latitude: feature.geometry.y,
        };

        if (stations.has(station.externalId)) {
          throw new Error(
            `Station source returned duplicate objectid ${station.externalId}.`,
          );
        }

        stations.set(station.externalId, station);
      }

      const hasMore =
        page.exceededTransferLimit ?? page.features.length === this.pageSize;

      if (!hasMore) {
        return [...stations.values()];
      }

      if (page.features.length === 0) {
        throw new Error("Station source indicated another page but returned no records.");
      }

      offset += page.features.length;
    }

    throw new Error(`Station import exceeded the safety limit of ${MAX_PAGES} pages.`);
  }

  private async fetchPage(offset: number) {
    const url = new URL(this.sourceUrl);
    url.searchParams.set("where", "objectid is not null");
    url.searchParams.set("outFields", "objectid,adresse");
    url.searchParams.set("returnGeometry", "true");
    url.searchParams.set("outSR", "4326");
    url.searchParams.set("orderByFields", "objectid ASC");
    url.searchParams.set("resultOffset", String(offset));
    url.searchParams.set("resultRecordCount", String(this.pageSize));
    url.searchParams.set("f", "json");

    const response = await this.fetchImpl(url, {
      headers: { accept: "application/json" },
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });

    if (!response.ok) {
      throw new Error(
        `Station source request failed with HTTP ${response.status} ${response.statusText}.`,
      );
    }

    const payload: unknown = await response.json();
    const sourceError = arcGisErrorSchema.safeParse(payload);

    if (sourceError.success) {
      const { code, message, details } = sourceError.data.error;
      const detailText = details?.length ? ` ${details.join(" ")}` : "";
      throw new Error(
        `ArcGIS error${code === undefined ? "" : ` ${code}`}: ${message}.${detailText}`,
      );
    }

    const parsedPage = arcGisPageSchema.safeParse(payload);

    if (!parsedPage.success) {
      const issues = parsedPage.error.issues
        .map((issue) => `${issue.path.join(".") || "response"}: ${issue.message}`)
        .join("; ");
      throw new Error(`Invalid station source response: ${issues}`);
    }

    return parsedPage.data;
  }
}
