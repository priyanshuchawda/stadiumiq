import type { UserContext } from "@/types/stadium";

export const fanContext: UserContext = {
  persona: "fan",
  language: "en",
  accessibility: { mobility: "none", lowVision: false, sensorySensitive: false },
};

export const wheelchairFanContext: UserContext = {
  ...fanContext,
  accessibility: {
    mobility: "wheelchair",
    lowVision: false,
    sensorySensitive: false,
  },
};

export function makeApiRequest(path: string, ip = "127.0.0.1"): Request {
  return new Request(`http://localhost:3000${path}`, {
    method: "POST",
    headers: {
      "x-real-ip": ip,
      origin: "http://localhost:3000",
    },
  });
}
