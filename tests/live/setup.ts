import dotenv from "dotenv";
import { vi } from "vitest";

dotenv.config({ path: ".env.local" });
dotenv.config({ path: ".env" });

vi.mock("server-only", () => ({}));
