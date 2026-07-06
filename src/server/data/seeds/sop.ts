import type { SopResult } from "@/types/stadium";

export const SOP_SEED: SopResult[] = [
  {
    topic: "lost_child",
    title: "Lost Child Protocol",
    steps: [
      {
        order: 1,
        action: "Keep the child in a safe, visible location.",
        contact: "Gate supervisor",
      },
      { order: 2, action: "Notify Lost & Found radio channel.", contact: "Channel 3" },
      {
        order: 3,
        action: "Request PA announcement without revealing child details.",
        contact: "Control room",
      },
      {
        order: 4,
        action: "Escort guardian to Guest Services if present.",
        contact: "Guest Services Desk",
      },
    ],
  },
  {
    topic: "medical_emergency",
    title: "Medical Emergency Protocol",
    steps: [
      {
        order: 1,
        action: "Call stadium medical team immediately.",
        contact: "Ext. 9110",
      },
      {
        order: 2,
        action: "Clear a path for medics; do not move injured person unless unsafe.",
        contact: "Medical lead",
      },
      { order: 3, action: "Log incident in ops dashboard.", contact: "Ops center" },
    ],
  },
  {
    topic: "crowd_surge",
    title: "Crowd Surge Response",
    steps: [
      {
        order: 1,
        action: "Open overflow lanes and redirect to alternate gate.",
        contact: "Gate B lead",
      },
      {
        order: 2,
        action: "Deploy stewards to slow ingress and communicate wait time.",
        contact: "Steward captain",
      },
      {
        order: 3,
        action: "Notify organizer ops for staffing adjustment.",
        contact: "Ops center",
      },
    ],
  },
];
