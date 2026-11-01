import type { SubmissionStatus } from "@/lib/types/database";

export interface StatusMeta {
  label: string;
  tone: "neutral" | "copper" | "success" | "warning" | "danger";
  dot: string;
}

/** Single source of truth for how a submission status looks and reads. */
export const SUBMISSION_STATUS: Record<SubmissionStatus, StatusMeta> = {
  submitted: { label: "Submitted", tone: "copper", dot: "bg-copper" },
  under_review: { label: "Under review", tone: "warning", dot: "bg-warning" },
  approved: { label: "Approved", tone: "success", dot: "bg-success" },
  rejected: { label: "Rejected", tone: "danger", dot: "bg-danger" },
};

export function submissionStatus(status: SubmissionStatus): StatusMeta {
  return SUBMISSION_STATUS[status];
}

/** A submission still waiting on the owner. */
export function isOpenStatus(status: SubmissionStatus): boolean {
  return status === "submitted" || status === "under_review";
}
