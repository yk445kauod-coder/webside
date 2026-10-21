import type { AnyBlock, SnapshotPage } from "./blocks";

// ============================================================
// WebSide database row shapes
// ============================================================

export type SubmissionStatus =
  | "submitted"
  | "under_review"
  | "approved"
  | "rejected";

export interface Profile {
  id: string;
  email: string | null;
  display_name: string | null;
  created_at: string;
}

export interface SiteRow {
  id: string;
  owner_id: string;
  name: string;
  slug: string;
  description: string | null;
  template_key: string;
  created_at: string;
  updated_at: string;
}

export interface PageRow {
  id: string;
  site_id: string;
  key: string;
  title: string;
  path: string;
  blocks: AnyBlock[];
  created_at: string;
  updated_at: string;
}

export interface RevisionRow {
  id: string;
  site_id: string;
  number: number;
  pages: Record<string, SnapshotPage>;
  content_hash: string;
  label: string | null;
  created_by: string | null;
  created_at: string;
}

export interface SubmissionRow {
  id: string;
  site_id: string;
  revision_id: string;
  status: SubmissionStatus;
  note: string | null;
  owner_notes: string | null;
  payment_proof_path: string | null;
  reviewed_by: string | null;
  submitted_at: string;
  reviewed_at: string | null;
}

export interface PublicationRow {
  id: string;
  site_id: string;
  submission_id: string;
  url: string;
  note: string | null;
  recorded_by: string | null;
  recorded_at: string;
}

export interface AuditLogRow {
  id: number;
  actor_id: string | null;
  actor_role: string | null;
  action: string;
  entity: string | null;
  entity_id: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
}