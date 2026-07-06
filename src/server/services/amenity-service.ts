import { findAmenitiesByType } from "@/server/data/repositories/stadium-repository";
import type { AmenityType } from "@/types/domain";
import type { Amenity, UserContext } from "@/types/stadium";

export type GetAmenitiesInput = {
  type: AmenityType;
  nearSection?: string;
  context?: UserContext;
};

export function getAmenities(input: GetAmenitiesInput): Amenity[] {
  let results = findAmenitiesByType(input.type, input.nearSection);

  if (input.context?.accessibility.mobility === "wheelchair") {
    results = results.filter((amenity) => amenity.accessible);
  }

  if (input.context?.accessibility.sensorySensitive) {
    const sensory = findAmenitiesByType("sensory_room");
    results = [...results, ...sensory];
  }

  return results;
}
