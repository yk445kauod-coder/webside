// Commits rendered sites into this same repo through the GitHub Git Data API, so one atomic
// commit adds/replaces/removes everything under sites/<slug>/ and the deploy workflow ships it.
//
// Secrets: GITHUB_PUBLISH_TOKEN is a fine-grained PAT limited to this one repository
// (Contents: read & write). It is a server-only environment variable and never reaches the client.

import type { RenderedFile } from "./render";

const API = "https://api.github.com";

function config() {
  const token = process.env.GITHUB_PUBLISH_TOKEN;
  const repo = process.env.GITHUB_PUBLISH_REPO || "yk445kauod-coder/webside";
  const branch = process.env.GITHUB_PUBLISH_BRANCH || "master";
  if (!token) return null;
  if (!/^[\w.-]+\/[\w.-]+$/.test(repo)) return null;
  return { token, repo, branch };
}

export const publishingConfigured = () => config() !== null;

class GhError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

async function gh<T>(cfg: { token: string }, method: string, path: string, body?: unknown): Promise<T> {
  const res = await fetch(`${API}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${cfg.token}`,
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
      "User-Agent": "webside-publisher",
      ...(body ? { "Content-Type": "application/json" } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    let msg = res.statusText;
    try {
      msg = ((await res.json()) as { message?: string }).message ?? msg;
    } catch {}
    throw new GhError(res.status, msg);
  }
  return (await res.json()) as T;
}

interface TreeEntry {
  path: string;
  mode: string;
  type: string;
  sha: string;
}

/** Every file path currently under sites/<slug>/ at the given tree. */
async function existingFiles(cfg: { token: string; repo: string }, rootTree: string, slug: string): Promise<string[]> {
  const root = await gh<{ tree: TreeEntry[] }>(cfg, "GET", `/repos/${cfg.repo}/git/trees/${rootTree}`);
  const sites = root.tree.find((e) => e.path === "sites" && e.type === "tree");
  if (!sites) return [];
  const list = await gh<{ tree: TreeEntry[] }>(cfg, "GET", `/repos/${cfg.repo}/git/trees/${sites.sha}`);
  const dir = list.tree.find((e) => e.path === slug && e.type === "tree");
  if (!dir) return [];
  const all = await gh<{ tree: TreeEntry[]; truncated?: boolean }>(
    cfg,
    "GET",
    `/repos/${cfg.repo}/git/trees/${dir.sha}?recursive=1`,
  );
  return all.tree.filter((e) => e.type === "blob").map((e) => `sites/${slug}/${e.path}`);
}

export type CommitResult = { ok: true; commit: string } | { ok: false; error: string };

/**
 * Replace everything under sites/<slug>/ with `files` (an empty list removes the site).
 * Retries when someone else moved the branch between our read and our write.
 */
export async function commitSite(slug: string, files: RenderedFile[], message: string): Promise<CommitResult> {
  const cfg = config();
  if (!cfg) return { ok: false, error: "Publishing is not configured (GITHUB_PUBLISH_TOKEN is missing)." };
  if (!/^[a-z0-9][a-z0-9-]*$/.test(slug)) return { ok: false, error: "Invalid site address." };
  for (const f of files) {
    if (!f.path.startsWith(`sites/${slug}/`) || f.path.includes("..")) {
      return { ok: false, error: "Refusing to write outside the site folder." };
    }
  }

  try {
    for (let attempt = 0; attempt < 3; attempt++) {
      const ref = await gh<{ object: { sha: string } }>(cfg, "GET", `/repos/${cfg.repo}/git/ref/heads/${cfg.branch}`);
      const parent = ref.object.sha;
      const commit = await gh<{ tree: { sha: string } }>(cfg, "GET", `/repos/${cfg.repo}/git/commits/${parent}`);
      const old = await existingFiles(cfg, commit.tree.sha, slug);

      const keep = new Set(files.map((f) => f.path));
      const entries: { path: string; mode: "100644"; type: "blob"; sha: string | null }[] = [];
      for (const f of files) {
        const blob = await gh<{ sha: string }>(cfg, "POST", `/repos/${cfg.repo}/git/blobs`, {
          content: f.content,
          encoding: "utf-8",
        });
        entries.push({ path: f.path, mode: "100644", type: "blob", sha: blob.sha });
      }
      for (const p of old) if (!keep.has(p)) entries.push({ path: p, mode: "100644", type: "blob", sha: null });
      if (entries.length === 0) return { ok: true, commit: parent };

      const tree = await gh<{ sha: string }>(cfg, "POST", `/repos/${cfg.repo}/git/trees`, {
        base_tree: commit.tree.sha,
        tree: entries,
      });
      const created = await gh<{ sha: string }>(cfg, "POST", `/repos/${cfg.repo}/git/commits`, {
        message,
        tree: tree.sha,
        parents: [parent],
      });
      try {
        await gh(cfg, "PATCH", `/repos/${cfg.repo}/git/refs/heads/${cfg.branch}`, { sha: created.sha, force: false });
        return { ok: true, commit: created.sha };
      } catch (e) {
        // 422 = not a fast-forward: the branch moved. Start over from its new head.
        if (e instanceof GhError && e.status === 422 && attempt < 2) continue;
        throw e;
      }
    }
    return { ok: false, error: "The repository changed too often. Try again." };
  } catch (e) {
    if (e instanceof GhError) {
      if (e.status === 401 || e.status === 403) return { ok: false, error: "GitHub rejected the publishing token." };
      return { ok: false, error: `GitHub error: ${e.message}` };
    }
    return { ok: false, error: "Could not reach GitHub." };
  }
}
