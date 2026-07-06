import { describe, expect, it } from "vitest";
import {
  getGreenestOption,
  getTransportOptions,
} from "@/server/services/transport-service";

describe("getTransportOptions", () => {
  it("sorts by duration when eco is not prioritized", () => {
    const options = getTransportOptions({ destination: "Airport", ecoPriority: false });
    expect(options[0]?.mode).toBe("rideshare");
  });

  it("sorts by eco score when eco is prioritized", () => {
    const options = getTransportOptions({ destination: "Airport", ecoPriority: true });
    expect(options[0]?.mode).toBe("walk");
    expect(
      getGreenestOption({ destination: "Airport", ecoPriority: true })?.carbonGrams,
    ).toBe(0);
  });
});
