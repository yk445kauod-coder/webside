import type { Metadata } from "next";
import { getAuditLogs } from "@/lib/queries/sudo";
import { Badge } from "@/components/ui/badge";
import { formatDateTime } from "@/lib/utils";

export const metadata: Metadata = { title: "Audit · SUDO" };

export default async function SudoAuditPage() {
  const logs = await getAuditLogs(100);

  return (
    <div>
      <div className="mb-8">
        <h1 className="ws-h1">Audit trail</h1>
        <p className="mt-1 text-muted">
          Every governance action — submissions, reviews, publications — is
          recorded automatically by the database.
        </p>
      </div>

      {logs.length === 0 ? (
        <p className="rounded-xl border border-dashed border-line bg-surface px-4 py-8 text-sm text-muted">
          No audit events recorded yet.
        </p>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-line bg-surface">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-line bg-canvas text-left text-xs uppercase tracking-wider text-muted">
                <th className="px-4 py-3 font-medium">When</th>
                <th className="px-4 py-3 font-medium">Action</th>
                <th className="hidden px-4 py-3 font-medium sm:table-cell">Actor</th>
                <th className="hidden px-4 py-3 font-medium md:table-cell">Entity</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((l) => (
                <tr key={l.id} className="border-b border-line last:border-b-0">
                  <td className="whitespace-nowrap px-4 py-2.5 text-xs text-muted">
                    {formatDateTime(l.created_at)}
                  </td>
                  <td className="px-4 py-2.5">
                    <Badge tone={actionTone(l.action)}>{l.action}</Badge>
                  </td>
                  <td className="hidden px-4 py-2.5 font-mono text-xs text-muted sm:table-cell">
                    {l.actor_role ?? "—"}
                    {l.actor_id ? ` · ${l.actor_id.slice(0, 8)}` : ""}
                  </td>
                  <td className="hidden px-4 py-2.5 font-mono text-xs text-muted md:table-cell">
                    {l.entity}
                    {l.entity_id ? ` / ${l.entity_id.slice(0, 8)}` : ""}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function actionTone(action: string): "success" | "danger" | "neutral" {
  if (action.includes("approved") || action.includes("published"))
    return "success";
  if (action.includes("rejected")) return "danger";
  return "neutral";
}