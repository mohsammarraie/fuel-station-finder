import { z } from "zod";

export const ALLOWED_RADII_KM = [2, 5, 10] as const;

export type AllowedRadiusKm = (typeof ALLOWED_RADII_KM)[number];
export type StationSort = "asc" | "desc" | "nearest" | "farthest";

export interface StationListFilters {
  latitude?: number;
  longitude?: number;
  radiusKm?: AllowedRadiusKm;
  search?: string;
  sort: StationSort;
}

const numericString = z
  .string()
  .trim()
  .regex(
    /^[+-]?(?:\d+(?:\.\d*)?|\.\d+)$/,
    "Must be a valid decimal number.",
  )
  .transform(Number);

const latitudeSchema = numericString.pipe(
  z.number().min(-90, "Must be at least -90.").max(90, "Must be at most 90."),
);

const longitudeSchema = numericString.pipe(
  z
    .number()
    .min(-180, "Must be at least -180.")
    .max(180, "Must be at most 180."),
);

const radiusSchema = z.enum(["2", "5", "10"]).transform(
  (value): AllowedRadiusKm => Number(value) as AllowedRadiusKm,
);

export const stationQuerySchema = z
  .object({
    lat: latitudeSchema.optional(),
    lng: longitudeSchema.optional(),
    radius: radiusSchema.optional(),
    search: z
      .string()
      .trim()
      .max(100, "Must contain at most 100 characters.")
      .optional()
      .transform((value) => value || undefined),
    sort: z.enum(["asc", "desc", "nearest", "farthest"]).default("asc"),
  })
  .strict()
  .superRefine((query, context) => {
    const locationValues = [query.lat, query.lng, query.radius];
    const providedCount = locationValues.filter(
      (value) => value !== undefined,
    ).length;

    if (providedCount !== 0 && providedCount !== locationValues.length) {
      context.addIssue({
        code: "custom",
        message: "lat, lng, and radius must be provided together.",
        path: ["location"],
      });
    }

    if (
      (query.sort === "nearest" || query.sort === "farthest") &&
      providedCount !== locationValues.length
    ) {
      context.addIssue({
        code: "custom",
        message: "Distance sorting requires lat, lng, and radius.",
        path: ["sort"],
      });
    }
  })
  .transform((query): StationListFilters => {
    const filters: StationListFilters = { sort: query.sort };

    if (query.lat !== undefined) {
      filters.latitude = query.lat;
      filters.longitude = query.lng;
      filters.radiusKm = query.radius;
    }

    if (query.search !== undefined) {
      filters.search = query.search;
    }

    return filters;
  });
