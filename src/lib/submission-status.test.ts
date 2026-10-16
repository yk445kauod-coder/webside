import { describe, expect, it } from "vitest";
import { isOpenStatus, submissionStatus } from "./submission-status";

describe("submission status", () => {
  it("treats only submitted and under_review as open", () => {
    expect(isOpenStatus("submitted")).toBe(true);
    expect(isOpenStatus("under_review")).toBe(true);
    expect(isOpenStatus("approved")).toBe(false);
    expect(isOpenStatus("rejected")).toBe(false);
  });

  it("always pairs a status with a text label (never colour alone)", () => {
    for (const s of ["submitted", "under_review", "approved", "rejected"] as const) {
      expect(submissionStatus(s).label.length).toBeGreaterThan(0);
    }
  });
});
