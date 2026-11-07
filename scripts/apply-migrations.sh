#!/usr/bin/env bash
# Applies supabase/migrations/*.sql that have not been applied yet, in filename order.
# Tracks what ran in public._app_migrations. Each file runs in one transaction.
# Needs SUPABASE_DB_URL (the Postgres connection string, with password).
# BASELINE lists files that were applied by hand before this runner existed.
set -euo pipefail
: "${SUPABASE_DB_URL:?SUPABASE_DB_URL is not set}"
BASELINE="${BASELINE:-00001_initial_schema.sql 00002_sudo_read_access.sql 00003_security_and_performance_hardening.sql 00004_payment_proof_and_sudo_hardening.sql 00005_plans_and_server_side_limits.sql 00006_revoke_trigger_function_execute.sql}"

psql() { command psql "$SUPABASE_DB_URL" -v ON_ERROR_STOP=1 -X -q "$@"; }

psql -c "create table if not exists public._app_migrations (name text primary key, applied_at timestamptz not null default now());
alter table public._app_migrations enable row level security;"

# First run only: record the files that production already has.
if [ "$(psql -tA -c 'select count(*) from public._app_migrations')" = "0" ]; then
  for f in $BASELINE; do
    psql -c "insert into public._app_migrations(name) values ('$f') on conflict do nothing"
  done
fi

for path in $(ls supabase/migrations/*.sql | sort); do
  name=$(basename "$path")
  if [ "$(psql -tA -c "select count(*) from public._app_migrations where name='$name'")" != "0" ]; then
    echo "skip   $name"; continue
  fi
  echo "apply  $name"
  { echo "begin;"; cat "$path"; echo; echo "insert into public._app_migrations(name) values ('$name');"; echo "commit;"; } | psql -f -
done
echo "migrations up to date"
