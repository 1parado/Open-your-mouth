BEGIN;

CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS citext;
CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE SCHEMA IF NOT EXISTS oral_teacher;
SET search_path TO oral_teacher, public;

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE TABLE media_assets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_type text,
  owner_id uuid,
  media_type text NOT NULL,
  bucket_type text NOT NULL DEFAULT 'local',
  relative_path text NOT NULL,
  mime_type text NOT NULL,
  file_size bigint,
  duration_ms integer,
  checksum text,
  storage_status text NOT NULL DEFAULT 'active',
  meta_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  extra_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT NOW(),
  updated_at timestamptz NOT NULL DEFAULT NOW(),
  deleted_at timestamptz
);

CREATE TABLE media_variants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  media_asset_id uuid NOT NULL REFERENCES media_assets(id) ON DELETE CASCADE,
  variant_type text NOT NULL,
  relative_path text NOT NULL,
  mime_type text NOT NULL,
  file_size bigint,
  meta_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  extra_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT NOW(),
  updated_at timestamptz NOT NULL DEFAULT NOW(),
  deleted_at timestamptz
);

CREATE TABLE users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email citext,
  phone text,
  password_hash text,
  display_name text NOT NULL,
  avatar_media_id uuid REFERENCES media_assets(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'active',
  last_login_at timestamptz,
  extra_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT NOW(),
  updated_at timestamptz NOT NULL DEFAULT NOW(),
  deleted_at timestamptz
);

CREATE TABLE user_identities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  identity_type text NOT NULL,
  identity_key text NOT NULL,
  identity_secret_hash text,
  is_primary boolean NOT NULL DEFAULT false,
  verified_at timestamptz,
  extra_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT NOW(),
  updated_at timestamptz NOT NULL DEFAULT NOW(),
  deleted_at timestamptz
);

CREATE TABLE user_devices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  platform text NOT NULL,
  device_id text NOT NULL,
  push_token text,
  app_version text,
  os_version text,
  last_seen_at timestamptz,
  extra_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT NOW(),
  updated_at timestamptz NOT NULL DEFAULT NOW(),
  deleted_at timestamptz
);

CREATE TABLE auth_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  refresh_token_hash text NOT NULL,
  ip inet,
  user_agent text,
  expired_at timestamptz NOT NULL,
  revoked_at timestamptz,
  extra_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT NOW(),
  updated_at timestamptz NOT NULL DEFAULT NOW()
);

CREATE TABLE organizations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  org_type text NOT NULL DEFAULT 'consumer',
  status text NOT NULL DEFAULT 'active',
  owner_user_id uuid REFERENCES users(id) ON DELETE SET NULL,
  extra_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT NOW(),
  updated_at timestamptz NOT NULL DEFAULT NOW(),
  deleted_at timestamptz
);

CREATE TABLE organization_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role text NOT NULL DEFAULT 'member',
  status text NOT NULL DEFAULT 'active',
  joined_at timestamptz NOT NULL DEFAULT NOW(),
  extra_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT NOW(),
  updated_at timestamptz NOT NULL DEFAULT NOW(),
  deleted_at timestamptz
);

CREATE TABLE learner_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  native_language text NOT NULL,
  target_language text NOT NULL DEFAULT 'en',
  cefr_level text,
  target_exam text,
  learning_goal text,
  accent_preference text,
  teacher_style_preference text,
  correction_preference text,
  daily_goal_minutes integer,
  onboarding_result_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  extra_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT NOW(),
  updated_at timestamptz NOT NULL DEFAULT NOW(),
  deleted_at timestamptz
);

CREATE TABLE learner_preferences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  ui_language text NOT NULL DEFAULT 'zh-CN',
  tts_speed numeric(4,2) NOT NULL DEFAULT 1.00,
  tts_voice_code text,
  subtitle_enabled boolean NOT NULL DEFAULT true,
  auto_correction_enabled boolean NOT NULL DEFAULT true,
  report_detail_level text NOT NULL DEFAULT 'standard',
  extra_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT NOW(),
  updated_at timestamptz NOT NULL DEFAULT NOW(),
  deleted_at timestamptz
);

CREATE TABLE learner_goals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  goal_type text NOT NULL,
  target_value numeric(12,2),
  target_unit text,
  start_date date,
  end_date date,
  status text NOT NULL DEFAULT 'active',
  extra_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT NOW(),
  updated_at timestamptz NOT NULL DEFAULT NOW(),
  deleted_at timestamptz
);

CREATE TABLE learner_skill_snapshots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  snapshot_date date NOT NULL,
  pronunciation_score numeric(5,2),
  fluency_score numeric(5,2),
  grammar_score numeric(5,2),
  vocabulary_score numeric(5,2),
  conversation_score numeric(5,2),
  listening_score numeric(5,2),
  confidence_score numeric(5,2),
  weak_phonemes_json jsonb NOT NULL DEFAULT '[]'::jsonb,
  weak_topics_json jsonb NOT NULL DEFAULT '[]'::jsonb,
  extra_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT NOW(),
  updated_at timestamptz NOT NULL DEFAULT NOW()
);

CREATE TABLE scenario_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL,
  name text NOT NULL,
  parent_id uuid REFERENCES scenario_categories(id) ON DELETE SET NULL,
  sort_order integer NOT NULL DEFAULT 0,
  extra_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT NOW(),
  updated_at timestamptz NOT NULL DEFAULT NOW(),
  deleted_at timestamptz
);

CREATE TABLE scenarios (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL,
  title text NOT NULL,
  description text,
  category_id uuid REFERENCES scenario_categories(id) ON DELETE SET NULL,
  difficulty_level text,
  target_cefr_min text,
  target_cefr_max text,
  target_language text NOT NULL DEFAULT 'en',
  estimated_minutes integer,
  version integer NOT NULL DEFAULT 1,
  is_active boolean NOT NULL DEFAULT true,
  extra_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT NOW(),
  updated_at timestamptz NOT NULL DEFAULT NOW(),
  deleted_at timestamptz
);

CREATE TABLE scenario_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  scenario_id uuid NOT NULL REFERENCES scenarios(id) ON DELETE CASCADE,
  version integer NOT NULL,
  content_status text NOT NULL DEFAULT 'draft',
  objective text,
  setting_description text,
  roleplay_config_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  completion_rules_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  risk_control_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  published_at timestamptz,
  extra_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT NOW(),
  updated_at timestamptz NOT NULL DEFAULT NOW(),
  deleted_at timestamptz
);

CREATE TABLE scenario_objectives (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  scenario_version_id uuid NOT NULL REFERENCES scenario_versions(id) ON DELETE CASCADE,
  objective_type text NOT NULL,
  title text NOT NULL,
  description text,
  weight numeric(6,2),
  extra_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT NOW(),
  updated_at timestamptz NOT NULL DEFAULT NOW(),
  deleted_at timestamptz
);

CREATE TABLE scenario_target_phrases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  scenario_version_id uuid NOT NULL REFERENCES scenario_versions(id) ON DELETE CASCADE,
  phrase text NOT NULL,
  phrase_type text,
  difficulty_level text,
  must_master boolean NOT NULL DEFAULT false,
  example_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  extra_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT NOW(),
  updated_at timestamptz NOT NULL DEFAULT NOW(),
  deleted_at timestamptz
);

CREATE TABLE scenario_target_grammar (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  scenario_version_id uuid NOT NULL REFERENCES scenario_versions(id) ON DELETE CASCADE,
  grammar_code text NOT NULL,
  title text NOT NULL,
  description text,
  weight numeric(6,2),
  extra_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT NOW(),
  updated_at timestamptz NOT NULL DEFAULT NOW(),
  deleted_at timestamptz
);

CREATE TABLE teacher_personas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL,
  name text NOT NULL,
  persona_type text NOT NULL DEFAULT 'teacher',
  voice_style text,
  speaking_style text,
  encouragement_style text,
  avatar_media_id uuid REFERENCES media_assets(id) ON DELETE SET NULL,
  system_prompt_template text,
  extra_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT NOW(),
  updated_at timestamptz NOT NULL DEFAULT NOW(),
  deleted_at timestamptz
);

CREATE TABLE lesson_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  scenario_version_id uuid NOT NULL REFERENCES scenario_versions(id) ON DELETE CASCADE,
  name text NOT NULL,
  objective text,
  warmup_prompt text,
  teacher_strategy_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  correction_policy_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  report_policy_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  extra_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT NOW(),
  updated_at timestamptz NOT NULL DEFAULT NOW(),
  deleted_at timestamptz
);

CREATE TABLE curriculums (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL,
  name text NOT NULL,
  description text,
  target_user_type text,
  target_cefr_min text,
  target_cefr_max text,
  status text NOT NULL DEFAULT 'draft',
  extra_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT NOW(),
  updated_at timestamptz NOT NULL DEFAULT NOW(),
  deleted_at timestamptz
);

CREATE TABLE curriculum_units (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  curriculum_id uuid NOT NULL REFERENCES curriculums(id) ON DELETE CASCADE,
  title text NOT NULL,
  sort_order integer NOT NULL DEFAULT 0,
  objective text,
  extra_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT NOW(),
  updated_at timestamptz NOT NULL DEFAULT NOW(),
  deleted_at timestamptz
);

CREATE TABLE curriculum_lessons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  unit_id uuid NOT NULL REFERENCES curriculum_units(id) ON DELETE CASCADE,
  scenario_version_id uuid NOT NULL REFERENCES scenario_versions(id) ON DELETE RESTRICT,
  lesson_plan_id uuid REFERENCES lesson_plans(id) ON DELETE SET NULL,
  sort_order integer NOT NULL DEFAULT 0,
  is_required boolean NOT NULL DEFAULT true,
  extra_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT NOW(),
  updated_at timestamptz NOT NULL DEFAULT NOW(),
  deleted_at timestamptz
);

CREATE TABLE provider_configs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  capability text NOT NULL,
  provider_name text NOT NULL,
  base_url text NOT NULL,
  model text NOT NULL,
  api_key_hint text,
  timeout_ms integer NOT NULL DEFAULT 30000,
  is_active boolean NOT NULL DEFAULT false,
  upstream_config_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  extra_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT NOW(),
  updated_at timestamptz NOT NULL DEFAULT NOW(),
  deleted_at timestamptz
);

CREATE TABLE prompt_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  template_code text NOT NULL,
  template_type text NOT NULL,
  language text NOT NULL DEFAULT 'en',
  version integer NOT NULL DEFAULT 1,
  title text NOT NULL,
  template_content text NOT NULL,
  status text NOT NULL DEFAULT 'draft',
  extra_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT NOW(),
  updated_at timestamptz NOT NULL DEFAULT NOW(),
  deleted_at timestamptz
);

CREATE TABLE prompt_bindings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  binding_scope text NOT NULL,
  binding_target_id uuid,
  template_id uuid NOT NULL REFERENCES prompt_templates(id) ON DELETE CASCADE,
  priority integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  extra_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT NOW(),
  updated_at timestamptz NOT NULL DEFAULT NOW(),
  deleted_at timestamptz
);

CREATE TABLE plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL,
  name text NOT NULL,
  plan_type text NOT NULL,
  billing_cycle text NOT NULL,
  price_amount numeric(12,2) NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'CNY',
  quota_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  is_active boolean NOT NULL DEFAULT true,
  extra_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT NOW(),
  updated_at timestamptz NOT NULL DEFAULT NOW(),
  deleted_at timestamptz
);

CREATE TABLE subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  plan_id uuid NOT NULL REFERENCES plans(id) ON DELETE RESTRICT,
  status text NOT NULL DEFAULT 'active',
  started_at timestamptz NOT NULL DEFAULT NOW(),
  ended_at timestamptz,
  renewal_at timestamptz,
  cancelled_at timestamptz,
  extra_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT NOW(),
  updated_at timestamptz NOT NULL DEFAULT NOW(),
  deleted_at timestamptz
);

CREATE TABLE usage_counters (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  counter_date date NOT NULL,
  minutes_used integer NOT NULL DEFAULT 0,
  sessions_used integer NOT NULL DEFAULT 0,
  tts_chars_used integer NOT NULL DEFAULT 0,
  llm_tokens_used integer NOT NULL DEFAULT 0,
  pronunciation_requests_used integer NOT NULL DEFAULT 0,
  extra_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT NOW(),
  updated_at timestamptz NOT NULL DEFAULT NOW()
);

CREATE TABLE payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  subscription_id uuid REFERENCES subscriptions(id) ON DELETE SET NULL,
  payment_channel text NOT NULL,
  amount numeric(12,2) NOT NULL,
  currency text NOT NULL DEFAULT 'CNY',
  status text NOT NULL DEFAULT 'pending',
  paid_at timestamptz,
  transaction_no text,
  extra_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT NOW(),
  updated_at timestamptz NOT NULL DEFAULT NOW()
);

CREATE TABLE practice_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  organization_id uuid REFERENCES organizations(id) ON DELETE SET NULL,
  scenario_id uuid REFERENCES scenarios(id) ON DELETE SET NULL,
  scenario_version_id uuid REFERENCES scenario_versions(id) ON DELETE SET NULL,
  lesson_plan_id uuid REFERENCES lesson_plans(id) ON DELETE SET NULL,
  teacher_persona_id uuid REFERENCES teacher_personas(id) ON DELETE SET NULL,
  session_type text NOT NULL DEFAULT 'scenario_practice',
  session_status text NOT NULL DEFAULT 'created',
  difficulty_at_runtime text,
  started_at timestamptz,
  ended_at timestamptz,
  duration_sec integer,
  completion_rate numeric(5,2),
  session_summary_text text,
  session_summary_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  extra_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT NOW(),
  updated_at timestamptz NOT NULL DEFAULT NOW()
);

CREATE TABLE session_runtime_configs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES practice_sessions(id) ON DELETE CASCADE,
  llm_provider_config_id uuid REFERENCES provider_configs(id) ON DELETE SET NULL,
  asr_provider_config_id uuid REFERENCES provider_configs(id) ON DELETE SET NULL,
  tts_provider_config_id uuid REFERENCES provider_configs(id) ON DELETE SET NULL,
  pronunciation_provider_config_id uuid REFERENCES provider_configs(id) ON DELETE SET NULL,
  runtime_prompt_snapshot text,
  feature_flags_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  extra_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT NOW(),
  updated_at timestamptz NOT NULL DEFAULT NOW()
);

CREATE TABLE conversation_turns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES practice_sessions(id) ON DELETE CASCADE,
  turn_index integer NOT NULL,
  speaker text NOT NULL,
  turn_type text,
  turn_status text NOT NULL DEFAULT 'final',
  text text,
  normalized_text text,
  language text,
  start_ms integer,
  end_ms integer,
  latency_ms integer,
  is_interrupted boolean NOT NULL DEFAULT false,
  interruption_reason text,
  audio_asset_id uuid REFERENCES media_assets(id) ON DELETE SET NULL,
  raw_result_json jsonb,
  extra_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT NOW(),
  updated_at timestamptz NOT NULL DEFAULT NOW()
);

CREATE TABLE utterances (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES practice_sessions(id) ON DELETE CASCADE,
  turn_id uuid REFERENCES conversation_turns(id) ON DELETE SET NULL,
  speaker text NOT NULL,
  segment_index integer NOT NULL DEFAULT 0,
  text text,
  normalized_text text,
  language text,
  confidence_score numeric(6,3),
  start_ms integer,
  end_ms integer,
  vad_start_ms integer,
  vad_end_ms integer,
  is_final boolean NOT NULL DEFAULT false,
  audio_asset_id uuid REFERENCES media_assets(id) ON DELETE SET NULL,
  phoneme_timestamps_json jsonb NOT NULL DEFAULT '[]'::jsonb,
  raw_result_json jsonb,
  extra_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT NOW(),
  updated_at timestamptz NOT NULL DEFAULT NOW()
);

CREATE TABLE session_state_snapshots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES practice_sessions(id) ON DELETE CASCADE,
  snapshot_index integer NOT NULL,
  topic_state text,
  goal_state text,
  emotion_state text,
  teacher_strategy_state text,
  memory_summary text,
  snapshot_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  extra_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT NOW(),
  updated_at timestamptz NOT NULL DEFAULT NOW()
);

CREATE TABLE interrupt_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES practice_sessions(id) ON DELETE CASCADE,
  turn_id uuid REFERENCES conversation_turns(id) ON DELETE SET NULL,
  trigger_source text NOT NULL,
  trigger_time_ms integer,
  interrupted_content_type text,
  recovered boolean NOT NULL DEFAULT false,
  extra_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT NOW(),
  updated_at timestamptz NOT NULL DEFAULT NOW()
);

CREATE TABLE asr_results (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES practice_sessions(id) ON DELETE CASCADE,
  utterance_id uuid NOT NULL REFERENCES utterances(id) ON DELETE CASCADE,
  provider text NOT NULL,
  model text NOT NULL,
  language text,
  recognized_text text,
  confidence_score numeric(6,3),
  word_timestamps_json jsonb NOT NULL DEFAULT '[]'::jsonb,
  alternative_results_json jsonb NOT NULL DEFAULT '[]'::jsonb,
  raw_result_json jsonb,
  extra_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT NOW(),
  updated_at timestamptz NOT NULL DEFAULT NOW()
);

CREATE TABLE pronunciation_assessments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES practice_sessions(id) ON DELETE CASCADE,
  turn_id uuid REFERENCES conversation_turns(id) ON DELETE SET NULL,
  utterance_id uuid NOT NULL REFERENCES utterances(id) ON DELETE CASCADE,
  provider text NOT NULL,
  model text NOT NULL,
  reference_text text,
  recognized_text text,
  language text NOT NULL DEFAULT 'en-US',
  granularity text NOT NULL DEFAULT 'phoneme',
  accuracy_score numeric(5,2),
  fluency_score numeric(5,2),
  completeness_score numeric(5,2),
  prosody_score numeric(5,2),
  naturalness_score numeric(5,2),
  overall_score numeric(5,2),
  severity_level text,
  issues_json jsonb NOT NULL DEFAULT '[]'::jsonb,
  raw_result_json jsonb,
  extra_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT NOW(),
  updated_at timestamptz NOT NULL DEFAULT NOW()
);

CREATE TABLE pronunciation_issue_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  assessment_id uuid NOT NULL REFERENCES pronunciation_assessments(id) ON DELETE CASCADE,
  token text,
  phoneme text,
  start_ms integer,
  end_ms integer,
  issue_type text NOT NULL,
  severity text,
  expected_value text,
  actual_value text,
  suggestion_text text,
  extra_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT NOW(),
  updated_at timestamptz NOT NULL DEFAULT NOW()
);

CREATE TABLE grammar_corrections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES practice_sessions(id) ON DELETE CASCADE,
  turn_id uuid REFERENCES conversation_turns(id) ON DELETE SET NULL,
  utterance_id uuid NOT NULL REFERENCES utterances(id) ON DELETE CASCADE,
  provider text NOT NULL,
  model text NOT NULL,
  original_text text NOT NULL,
  corrected_text text,
  native_like_text text,
  error_types_json jsonb NOT NULL DEFAULT '[]'::jsonb,
  explanation_text text,
  feedback_mode text,
  raw_result_json jsonb,
  extra_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT NOW(),
  updated_at timestamptz NOT NULL DEFAULT NOW()
);

CREATE TABLE vocabulary_feedback (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES practice_sessions(id) ON DELETE CASCADE,
  turn_id uuid REFERENCES conversation_turns(id) ON DELETE SET NULL,
  utterance_id uuid NOT NULL REFERENCES utterances(id) ON DELETE CASCADE,
  original_phrase text NOT NULL,
  suggested_phrase text,
  reason text,
  level_tag text,
  example_sentence text,
  extra_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT NOW(),
  updated_at timestamptz NOT NULL DEFAULT NOW()
);

CREATE TABLE fluency_metrics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES practice_sessions(id) ON DELETE CASCADE,
  utterance_id uuid NOT NULL REFERENCES utterances(id) ON DELETE CASCADE,
  speech_rate_wpm numeric(7,2),
  pause_count integer,
  avg_pause_ms numeric(10,2),
  filled_pause_count integer,
  self_repair_count integer,
  rhythm_score numeric(5,2),
  extra_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT NOW(),
  updated_at timestamptz NOT NULL DEFAULT NOW()
);

CREATE TABLE conversation_evaluations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES practice_sessions(id) ON DELETE CASCADE,
  provider text NOT NULL,
  model text NOT NULL,
  task_completion_score numeric(5,2),
  relevance_score numeric(5,2),
  coherence_score numeric(5,2),
  appropriateness_score numeric(5,2),
  interaction_score numeric(5,2),
  evaluation_text text,
  raw_result_json jsonb,
  extra_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT NOW(),
  updated_at timestamptz NOT NULL DEFAULT NOW()
);

CREATE TABLE session_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES practice_sessions(id) ON DELETE CASCADE,
  report_type text NOT NULL,
  summary_text text,
  strengths_json jsonb NOT NULL DEFAULT '[]'::jsonb,
  weaknesses_json jsonb NOT NULL DEFAULT '[]'::jsonb,
  recommended_actions_json jsonb NOT NULL DEFAULT '[]'::jsonb,
  homework_json jsonb NOT NULL DEFAULT '[]'::jsonb,
  review_focus_json jsonb NOT NULL DEFAULT '[]'::jsonb,
  report_asset_id uuid REFERENCES media_assets(id) ON DELETE SET NULL,
  raw_result_json jsonb,
  extra_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT NOW(),
  updated_at timestamptz NOT NULL DEFAULT NOW()
);

CREATE TABLE review_tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  session_id uuid REFERENCES practice_sessions(id) ON DELETE SET NULL,
  task_type text NOT NULL,
  title text NOT NULL,
  content_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  priority integer NOT NULL DEFAULT 0,
  due_at timestamptz,
  status text NOT NULL DEFAULT 'pending',
  completed_at timestamptz,
  extra_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT NOW(),
  updated_at timestamptz NOT NULL DEFAULT NOW()
);

CREATE TABLE flashcards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  source_type text,
  source_id uuid,
  front_text text NOT NULL,
  back_text text,
  phonetic_text text,
  example_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  difficulty_level text,
  extra_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT NOW(),
  updated_at timestamptz NOT NULL DEFAULT NOW(),
  deleted_at timestamptz
);

CREATE TABLE flashcard_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  flashcard_id uuid NOT NULL REFERENCES flashcards(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  reviewed_at timestamptz NOT NULL DEFAULT NOW(),
  score integer,
  next_review_at timestamptz,
  algorithm_state_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  extra_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT NOW(),
  updated_at timestamptz NOT NULL DEFAULT NOW()
);

CREATE TABLE homework_submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  review_task_id uuid NOT NULL REFERENCES review_tasks(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  submission_type text NOT NULL,
  text_content text,
  audio_asset_id uuid REFERENCES media_assets(id) ON DELETE SET NULL,
  submitted_at timestamptz NOT NULL DEFAULT NOW(),
  score_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  feedback_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  extra_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT NOW(),
  updated_at timestamptz NOT NULL DEFAULT NOW()
);

CREATE TABLE model_usage_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid REFERENCES practice_sessions(id) ON DELETE SET NULL,
  provider_config_id uuid REFERENCES provider_configs(id) ON DELETE SET NULL,
  capability text NOT NULL,
  request_type text,
  input_units integer,
  output_units integer,
  latency_ms integer,
  cost_amount numeric(12,6),
  currency text DEFAULT 'USD',
  raw_result_json jsonb,
  extra_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT NOW(),
  updated_at timestamptz NOT NULL DEFAULT NOW()
);

CREATE TABLE async_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_type text NOT NULL,
  queue_name text NOT NULL,
  biz_type text,
  biz_id uuid,
  status text NOT NULL DEFAULT 'queued',
  attempt_count integer NOT NULL DEFAULT 0,
  max_attempts integer NOT NULL DEFAULT 3,
  scheduled_at timestamptz NOT NULL DEFAULT NOW(),
  started_at timestamptz,
  finished_at timestamptz,
  result_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  error_message text,
  extra_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT NOW(),
  updated_at timestamptz NOT NULL DEFAULT NOW()
);

CREATE TABLE job_dead_letters (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id uuid NOT NULL REFERENCES async_jobs(id) ON DELETE CASCADE,
  failed_at timestamptz NOT NULL DEFAULT NOW(),
  error_stack text,
  payload_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  extra_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT NOW(),
  updated_at timestamptz NOT NULL DEFAULT NOW()
);

CREATE TABLE event_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid REFERENCES practice_sessions(id) ON DELETE SET NULL,
  event_type text NOT NULL,
  event_time timestamptz NOT NULL DEFAULT NOW(),
  trace_id text,
  payload_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  extra_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT NOW(),
  updated_at timestamptz NOT NULL DEFAULT NOW()
);

CREATE TABLE api_request_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  trace_id text,
  user_id uuid REFERENCES users(id) ON DELETE SET NULL,
  path text NOT NULL,
  method text NOT NULL,
  status_code integer,
  latency_ms integer,
  request_summary_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  response_summary_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  extra_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT NOW(),
  updated_at timestamptz NOT NULL DEFAULT NOW()
);

CREATE TABLE media_access_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  media_asset_id uuid NOT NULL REFERENCES media_assets(id) ON DELETE CASCADE,
  user_id uuid REFERENCES users(id) ON DELETE SET NULL,
  access_type text NOT NULL,
  access_time timestamptz NOT NULL DEFAULT NOW(),
  ip inet,
  extra_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT NOW(),
  updated_at timestamptz NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_media_assets_owner ON media_assets(owner_type, owner_id);
CREATE INDEX idx_media_assets_status ON media_assets(storage_status);
CREATE INDEX idx_media_variants_media_asset_id ON media_variants(media_asset_id);

CREATE UNIQUE INDEX uq_users_email_active ON users(email) WHERE deleted_at IS NULL AND email IS NOT NULL;
CREATE INDEX idx_users_status ON users(status);

CREATE UNIQUE INDEX uq_user_identities_type_key_active
  ON user_identities(identity_type, identity_key)
  WHERE deleted_at IS NULL;
CREATE INDEX idx_user_identities_user_id ON user_identities(user_id);
CREATE UNIQUE INDEX uq_user_devices_platform_device_active
  ON user_devices(platform, device_id)
  WHERE deleted_at IS NULL;
CREATE INDEX idx_auth_sessions_user_id ON auth_sessions(user_id);
CREATE INDEX idx_auth_sessions_expired_at ON auth_sessions(expired_at);

CREATE INDEX idx_org_members_org_id ON organization_members(organization_id);
CREATE UNIQUE INDEX uq_org_members_org_user_active
  ON organization_members(organization_id, user_id)
  WHERE deleted_at IS NULL;

CREATE UNIQUE INDEX uq_learner_profiles_user_id_active
  ON learner_profiles(user_id)
  WHERE deleted_at IS NULL;
CREATE UNIQUE INDEX uq_learner_preferences_user_id_active
  ON learner_preferences(user_id)
  WHERE deleted_at IS NULL;
CREATE INDEX idx_learner_goals_user_id_status ON learner_goals(user_id, status);
CREATE UNIQUE INDEX uq_learner_skill_snapshots_user_day
  ON learner_skill_snapshots(user_id, snapshot_date);

CREATE UNIQUE INDEX uq_scenario_categories_code_active
  ON scenario_categories(code)
  WHERE deleted_at IS NULL;
CREATE UNIQUE INDEX uq_scenarios_code_active
  ON scenarios(code)
  WHERE deleted_at IS NULL;
CREATE INDEX idx_scenarios_category_id ON scenarios(category_id);
CREATE UNIQUE INDEX uq_scenario_versions_scenario_version
  ON scenario_versions(scenario_id, version)
  WHERE deleted_at IS NULL;
CREATE INDEX idx_scenario_objectives_version_id ON scenario_objectives(scenario_version_id);
CREATE INDEX idx_scenario_target_phrases_version_id ON scenario_target_phrases(scenario_version_id);
CREATE INDEX idx_scenario_target_grammar_version_id ON scenario_target_grammar(scenario_version_id);

CREATE UNIQUE INDEX uq_teacher_personas_code_active
  ON teacher_personas(code)
  WHERE deleted_at IS NULL;
CREATE INDEX idx_lesson_plans_scenario_version_id ON lesson_plans(scenario_version_id);
CREATE UNIQUE INDEX uq_curriculums_code_active
  ON curriculums(code)
  WHERE deleted_at IS NULL;
CREATE INDEX idx_curriculum_units_curriculum_id ON curriculum_units(curriculum_id);
CREATE UNIQUE INDEX uq_curriculum_lessons_unit_sort
  ON curriculum_lessons(unit_id, sort_order)
  WHERE deleted_at IS NULL;

CREATE UNIQUE INDEX uq_provider_configs_one_active_per_capability
  ON provider_configs(capability)
  WHERE is_active = true AND deleted_at IS NULL;
CREATE INDEX idx_provider_configs_capability ON provider_configs(capability, provider_name);
CREATE UNIQUE INDEX uq_prompt_templates_code_lang_version_active
  ON prompt_templates(template_code, language, version)
  WHERE deleted_at IS NULL;
CREATE INDEX idx_prompt_bindings_scope_target_active
  ON prompt_bindings(binding_scope, binding_target_id, is_active);

CREATE UNIQUE INDEX uq_plans_code_active
  ON plans(code)
  WHERE deleted_at IS NULL;
CREATE INDEX idx_subscriptions_user_status ON subscriptions(user_id, status);
CREATE UNIQUE INDEX uq_usage_counters_user_day ON usage_counters(user_id, counter_date);
CREATE INDEX idx_payments_user_status ON payments(user_id, status);

CREATE INDEX idx_practice_sessions_user_started_at ON practice_sessions(user_id, started_at DESC);
CREATE INDEX idx_practice_sessions_scenario_started_at ON practice_sessions(scenario_id, started_at DESC);
CREATE INDEX idx_practice_sessions_status ON practice_sessions(session_status);
CREATE UNIQUE INDEX uq_session_runtime_configs_session_id ON session_runtime_configs(session_id);
CREATE UNIQUE INDEX uq_conversation_turns_session_turn_idx ON conversation_turns(session_id, turn_index);
CREATE INDEX idx_utterances_session_final_start ON utterances(session_id, is_final, start_ms);
CREATE INDEX idx_session_state_snapshots_session_idx ON session_state_snapshots(session_id, snapshot_index);
CREATE INDEX idx_interrupt_events_session_id ON interrupt_events(session_id);

CREATE UNIQUE INDEX uq_asr_results_utterance_id ON asr_results(utterance_id);
CREATE INDEX idx_pronunciation_assessments_utterance_id ON pronunciation_assessments(utterance_id);
CREATE INDEX idx_pronunciation_issue_items_assessment_id ON pronunciation_issue_items(assessment_id);
CREATE INDEX idx_grammar_corrections_utterance_id ON grammar_corrections(utterance_id);
CREATE INDEX idx_vocabulary_feedback_utterance_id ON vocabulary_feedback(utterance_id);
CREATE UNIQUE INDEX uq_fluency_metrics_utterance_id ON fluency_metrics(utterance_id);
CREATE INDEX idx_conversation_evaluations_session_id ON conversation_evaluations(session_id);

CREATE INDEX idx_session_reports_session_type ON session_reports(session_id, report_type);
CREATE INDEX idx_review_tasks_user_status_due ON review_tasks(user_id, status, due_at);
CREATE INDEX idx_flashcards_user_id ON flashcards(user_id);
CREATE INDEX idx_flashcard_reviews_user_next_review ON flashcard_reviews(user_id, next_review_at);
CREATE INDEX idx_homework_submissions_review_task_id ON homework_submissions(review_task_id);

CREATE INDEX idx_model_usage_logs_session_capability ON model_usage_logs(session_id, capability);
CREATE INDEX idx_async_jobs_queue_status ON async_jobs(queue_name, status, scheduled_at);
CREATE INDEX idx_job_dead_letters_job_id ON job_dead_letters(job_id);
CREATE INDEX idx_event_logs_session_time ON event_logs(session_id, event_time DESC);
CREATE INDEX idx_event_logs_type_time ON event_logs(event_type, event_time DESC);
CREATE INDEX idx_api_request_logs_trace_id ON api_request_logs(trace_id);
CREATE INDEX idx_api_request_logs_user_created_at ON api_request_logs(user_id, created_at DESC);
CREATE INDEX idx_media_access_logs_media_time ON media_access_logs(media_asset_id, access_time DESC);

CREATE INDEX gin_users_extra_json ON users USING gin(extra_json);
CREATE INDEX gin_learner_profiles_extra_json ON learner_profiles USING gin(extra_json);
CREATE INDEX gin_scenarios_extra_json ON scenarios USING gin(extra_json);
CREATE INDEX gin_scenario_versions_roleplay_config ON scenario_versions USING gin(roleplay_config_json);
CREATE INDEX gin_teacher_personas_extra_json ON teacher_personas USING gin(extra_json);
CREATE INDEX gin_provider_configs_upstream_config ON provider_configs USING gin(upstream_config_json);
CREATE INDEX gin_practice_sessions_summary_json ON practice_sessions USING gin(session_summary_json);
CREATE INDEX gin_conversation_turns_raw_result_json ON conversation_turns USING gin(raw_result_json);
CREATE INDEX gin_utterances_raw_result_json ON utterances USING gin(raw_result_json);
CREATE INDEX gin_pronunciation_assessments_issues_json ON pronunciation_assessments USING gin(issues_json);
CREATE INDEX gin_grammar_corrections_error_types_json ON grammar_corrections USING gin(error_types_json);
CREATE INDEX gin_session_reports_strengths_json ON session_reports USING gin(strengths_json);
CREATE INDEX gin_review_tasks_content_json ON review_tasks USING gin(content_json);
CREATE INDEX gin_event_logs_payload_json ON event_logs USING gin(payload_json);

DO $$
DECLARE
  tbl text;
BEGIN
  FOREACH tbl IN ARRAY ARRAY[
    'media_assets',
    'media_variants',
    'users',
    'user_identities',
    'user_devices',
    'auth_sessions',
    'organizations',
    'organization_members',
    'learner_profiles',
    'learner_preferences',
    'learner_goals',
    'learner_skill_snapshots',
    'scenario_categories',
    'scenarios',
    'scenario_versions',
    'scenario_objectives',
    'scenario_target_phrases',
    'scenario_target_grammar',
    'teacher_personas',
    'lesson_plans',
    'curriculums',
    'curriculum_units',
    'curriculum_lessons',
    'provider_configs',
    'prompt_templates',
    'prompt_bindings',
    'plans',
    'subscriptions',
    'usage_counters',
    'payments',
    'practice_sessions',
    'session_runtime_configs',
    'conversation_turns',
    'utterances',
    'session_state_snapshots',
    'interrupt_events',
    'asr_results',
    'pronunciation_assessments',
    'pronunciation_issue_items',
    'grammar_corrections',
    'vocabulary_feedback',
    'fluency_metrics',
    'conversation_evaluations',
    'session_reports',
    'review_tasks',
    'flashcards',
    'flashcard_reviews',
    'homework_submissions',
    'model_usage_logs',
    'async_jobs',
    'job_dead_letters',
    'event_logs',
    'api_request_logs',
    'media_access_logs'
  ]
  LOOP
    EXECUTE format(
      'CREATE TRIGGER trg_%I_set_updated_at BEFORE UPDATE ON %I FOR EACH ROW EXECUTE FUNCTION set_updated_at()',
      tbl, tbl
    );
  END LOOP;
END;
$$;

COMMIT;
