-- Demo-only manual AI queue for admin copy/paste workflow.
-- 1) User submits prompt from AI Prediction tab.
-- 2) Admin copies prompt, runs Gemini manually, pastes JSON response.
-- 3) User tab polls this table and renders completed response.

create table if not exists public.ai_prediction_manual_requests (
  id uuid primary key default gen_random_uuid(),
  crop text not null,
  mandi text not null,
  horizon text not null check (horizon in ('1D', '7D')),
  candidate_mandis jsonb not null default '[]'::jsonb,
  prompt text not null,
  status text not null default 'pending' check (status in ('pending', 'completed', 'failed')),
  response_json jsonb,
  admin_note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.ai_prediction_manual_requests enable row level security;

drop policy if exists ai_prediction_manual_requests_select_all on public.ai_prediction_manual_requests;
create policy ai_prediction_manual_requests_select_all
on public.ai_prediction_manual_requests
for select
using (true);

drop policy if exists ai_prediction_manual_requests_insert_all on public.ai_prediction_manual_requests;
create policy ai_prediction_manual_requests_insert_all
on public.ai_prediction_manual_requests
for insert
with check (true);

drop policy if exists ai_prediction_manual_requests_update_all on public.ai_prediction_manual_requests;
create policy ai_prediction_manual_requests_update_all
on public.ai_prediction_manual_requests
for update
using (true)
with check (true);
