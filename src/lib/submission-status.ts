import type { SubmissionStatus } from "@/lib/types/database";

interface StatusMeta {
  label: string;
  tone: "neutral" | "cobalt" | "success" | "warning" | "danger";
  dot: string;
}

export const SUBMISSION_STATUS: Record<SubmissionStatus, StatusMeta> = {
  submitted: {
    label: "Submitted",
    tone: "cobalt",
    dot: "bg-cobalt",
  },
  under_review: {
    label: "Under review",
    tone: "warning",
    dot: "bg-warning",
  },
  approved: {
    label: "Approved",
    tone: "success",
    dot: "bg-success",
  },
  rejected: {
    label: "Rejected",
    tone: "danger",
    dot: "bg-danger",
  },
};

export function submissionStatus(status: SubmissionStatus): StatusMeta {
  return SUBMISSION_STATUS[status];
}

export function getStatusTone(status: SubmissionStatus) {
  return submissionStatus(status).tone;
}