import { AMENITY_SEED } from "@/server/data/seeds/amenities";
import { CROWD_AREAS } from "@/server/data/seeds/crowd";
import { SOP_SEED } from "@/server/data/seeds/sop";
import { TRANSPORT_SEED } from "@/server/data/seeds/transport";
import type { AmenityType } from "@/types/domain";
import type { Amenity, SopResult } from "@/types/stadium";

export function listAmenities(): Amenity[] {
  return AMENITY_SEED;
}

export function findAmenitiesByType(
  type: AmenityType,
  nearSection?: string,
): Amenity[] {
  return AMENITY_SEED.filter((amenity) => {
    if (
      amenity.type !== type &&
      !(type === "toilet" && amenity.type === "accessible_toilet")
    ) {
      return false;
    }
    if (nearSection && amenity.nearSection !== nearSection) {
      return false;
    }
    return true;
  });
}

export function listCrowdAreas() {
  return CROWD_AREAS;
}

export function findSopByTopic(topic: string): SopResult | null {
  const normalized = topic.trim().toLowerCase().replace(/\s+/g, "_");
  return SOP_SEED.find((sop) => sop.topic === normalized) ?? null;
}

export function listTransportTemplates() {
  return TRANSPORT_SEED;
}
