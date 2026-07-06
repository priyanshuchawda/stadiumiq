import { Type, type FunctionDeclaration } from "@google/genai";

export const STADIUM_TOOL_DECLARATIONS: FunctionDeclaration[] = [
  {
    name: "getRoute",
    description: "Find an indoor stadium route between two locations.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        from: { type: Type.STRING },
        to: { type: Type.STRING },
        stepFree: { type: Type.BOOLEAN },
        avoidStairs: { type: Type.BOOLEAN },
      },
      required: ["from", "to"],
    },
  },
  {
    name: "getCrowdStatus",
    description: "Get live crowd density and wait time for a stadium area.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        area: { type: Type.STRING },
      },
      required: ["area"],
    },
  },
  {
    name: "getTransportOptions",
    description: "List transport options from the stadium to a destination.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        destination: { type: Type.STRING },
        ecoPriority: { type: Type.BOOLEAN },
      },
      required: ["destination"],
    },
  },
  {
    name: "getAmenities",
    description: "Find amenities such as toilets, food, water, or sensory rooms.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        type: { type: Type.STRING },
        nearSection: { type: Type.STRING },
      },
      required: ["type"],
    },
  },
  {
    name: "getSOP",
    description: "Fetch a volunteer or staff standard operating procedure.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        topic: { type: Type.STRING },
      },
      required: ["topic"],
    },
  },
];
