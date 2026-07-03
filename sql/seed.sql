BEGIN;

SET search_path TO oral_teacher, public;

INSERT INTO scenario_categories (code, name, sort_order)
SELECT 'daily_life', 'Daily Life', 10
WHERE NOT EXISTS (
  SELECT 1 FROM scenario_categories WHERE code = 'daily_life' AND deleted_at IS NULL
);

INSERT INTO scenario_categories (code, name, sort_order)
SELECT 'workplace', 'Workplace', 20
WHERE NOT EXISTS (
  SELECT 1 FROM scenario_categories WHERE code = 'workplace' AND deleted_at IS NULL
);

INSERT INTO scenario_categories (code, name, sort_order)
SELECT 'exam_prep', 'Exam Preparation', 30
WHERE NOT EXISTS (
  SELECT 1 FROM scenario_categories WHERE code = 'exam_prep' AND deleted_at IS NULL
);

INSERT INTO teacher_personas (
  code,
  name,
  persona_type,
  voice_style,
  speaking_style,
  encouragement_style,
  system_prompt_template,
  extra_json
)
SELECT
  'supportive_teacher',
  'Supportive Teacher',
  'teacher',
  'warm_clear_us',
  'patient_supportive',
  'high',
  'You are a supportive English speaking teacher. Keep the learner talking, give concise corrections, and adapt difficulty dynamically.',
  jsonb_build_object('recommended_for', jsonb_build_array('beginner', 'general-speaking'))
WHERE NOT EXISTS (
  SELECT 1 FROM teacher_personas WHERE code = 'supportive_teacher' AND deleted_at IS NULL
);

INSERT INTO teacher_personas (
  code,
  name,
  persona_type,
  voice_style,
  speaking_style,
  encouragement_style,
  system_prompt_template,
  extra_json
)
SELECT
  'strict_examiner',
  'Strict Examiner',
  'teacher',
  'neutral_formal_uk',
  'formal_precise',
  'low',
  'You are an IELTS-style examiner. Stay concise, professional, and ask controlled follow-up questions without over-helping the learner.',
  jsonb_build_object('recommended_for', jsonb_build_array('ielts', 'toefl', 'advanced'))
WHERE NOT EXISTS (
  SELECT 1 FROM teacher_personas WHERE code = 'strict_examiner' AND deleted_at IS NULL
);

INSERT INTO teacher_personas (
  code,
  name,
  persona_type,
  voice_style,
  speaking_style,
  encouragement_style,
  system_prompt_template,
  extra_json
)
SELECT
  'friendly_colleague',
  'Friendly Colleague',
  'teacher',
  'confident_modern_us',
  'casual_natural',
  'medium',
  'You are a friendly English-speaking colleague. Focus on realistic workplace conversation and natural phrasing.',
  jsonb_build_object('recommended_for', jsonb_build_array('workplace', 'intermediate'))
WHERE NOT EXISTS (
  SELECT 1 FROM teacher_personas WHERE code = 'friendly_colleague' AND deleted_at IS NULL
);

INSERT INTO scenarios (
  code,
  title,
  description,
  category_id,
  difficulty_level,
  target_cefr_min,
  target_cefr_max,
  target_language,
  estimated_minutes,
  version,
  is_active,
  extra_json
)
SELECT
  'airport_checkin',
  'Airport Check-in',
  'Practice checking in for an international flight, answering luggage and seat questions.',
  sc.id,
  'A2-B1',
  'A2',
  'B1',
  'en',
  10,
  1,
  true,
  jsonb_build_object('scene_tags', jsonb_build_array('travel', 'daily_life'))
FROM scenario_categories sc
WHERE sc.code = 'daily_life'
  AND NOT EXISTS (
    SELECT 1 FROM scenarios s WHERE s.code = 'airport_checkin' AND s.deleted_at IS NULL
  );

INSERT INTO scenarios (
  code,
  title,
  description,
  category_id,
  difficulty_level,
  target_cefr_min,
  target_cefr_max,
  target_language,
  estimated_minutes,
  version,
  is_active,
  extra_json
)
SELECT
  'job_interview_intro',
  'Job Interview Introduction',
  'Practice self-introduction, project explanation, and follow-up questions in an interview.',
  sc.id,
  'B1-B2',
  'B1',
  'B2',
  'en',
  12,
  1,
  true,
  jsonb_build_object('scene_tags', jsonb_build_array('workplace', 'interview'))
FROM scenario_categories sc
WHERE sc.code = 'workplace'
  AND NOT EXISTS (
    SELECT 1 FROM scenarios s WHERE s.code = 'job_interview_intro' AND s.deleted_at IS NULL
  );

INSERT INTO scenarios (
  code,
  title,
  description,
  category_id,
  difficulty_level,
  target_cefr_min,
  target_cefr_max,
  target_language,
  estimated_minutes,
  version,
  is_active,
  extra_json
)
SELECT
  'ielts_part1_hometown',
  'IELTS Part 1: Hometown',
  'Practice short IELTS-style questions about hometown, study, and daily routines.',
  sc.id,
  'B1-B2',
  'B1',
  'B2',
  'en',
  8,
  1,
  true,
  jsonb_build_object('scene_tags', jsonb_build_array('ielts', 'exam'))
FROM scenario_categories sc
WHERE sc.code = 'exam_prep'
  AND NOT EXISTS (
    SELECT 1 FROM scenarios s WHERE s.code = 'ielts_part1_hometown' AND s.deleted_at IS NULL
  );

INSERT INTO scenario_versions (
  scenario_id,
  version,
  content_status,
  objective,
  setting_description,
  roleplay_config_json,
  completion_rules_json,
  risk_control_json,
  published_at,
  extra_json
)
SELECT
  s.id,
  1,
  'published',
  'Complete airport check-in smoothly and respond to routine travel questions.',
  'The learner is at an international airport counter speaking with an airline agent.',
  jsonb_build_object(
    'teacher_role', 'airline_agent',
    'learner_role', 'passenger',
    'must_use_phrases', jsonb_build_array('check in', 'boarding pass', 'window seat')
  ),
  jsonb_build_object(
    'success_conditions', jsonb_build_array('confirm destination', 'answer baggage question', 'request seat preference'),
    'min_turns', 6
  ),
  jsonb_build_object('avoid_topics', jsonb_build_array('politics', 'medical advice')),
  NOW(),
  jsonb_build_object('default_teacher_persona', 'supportive_teacher')
FROM scenarios s
WHERE s.code = 'airport_checkin'
  AND NOT EXISTS (
    SELECT 1 FROM scenario_versions sv
    WHERE sv.scenario_id = s.id AND sv.version = 1 AND sv.deleted_at IS NULL
  );

INSERT INTO scenario_versions (
  scenario_id,
  version,
  content_status,
  objective,
  setting_description,
  roleplay_config_json,
  completion_rules_json,
  risk_control_json,
  published_at,
  extra_json
)
SELECT
  s.id,
  1,
  'published',
  'Deliver a clear self-introduction and answer basic interview questions naturally.',
  'The learner is interviewing for an English-speaking role.',
  jsonb_build_object(
    'teacher_role', 'interviewer',
    'learner_role', 'candidate',
    'must_use_phrases', jsonb_build_array('I am responsible for', 'One challenge I faced', 'I would like to')
  ),
  jsonb_build_object(
    'success_conditions', jsonb_build_array('introduce background', 'describe experience', 'answer follow-up'),
    'min_turns', 8
  ),
  jsonb_build_object('avoid_topics', jsonb_build_array('illegal employment advice')),
  NOW(),
  jsonb_build_object('default_teacher_persona', 'friendly_colleague')
FROM scenarios s
WHERE s.code = 'job_interview_intro'
  AND NOT EXISTS (
    SELECT 1 FROM scenario_versions sv
    WHERE sv.scenario_id = s.id AND sv.version = 1 AND sv.deleted_at IS NULL
  );

INSERT INTO scenario_versions (
  scenario_id,
  version,
  content_status,
  objective,
  setting_description,
  roleplay_config_json,
  completion_rules_json,
  risk_control_json,
  published_at,
  extra_json
)
SELECT
  s.id,
  1,
  'published',
  'Answer IELTS Part 1 questions in 2-4 natural sentences with concrete examples.',
  'The learner is taking a mock IELTS speaking test.',
  jsonb_build_object(
    'teacher_role', 'examiner',
    'learner_role', 'candidate',
    'must_use_phrases', jsonb_build_array('In my hometown', 'What I like most is', 'It depends')
  ),
  jsonb_build_object(
    'success_conditions', jsonb_build_array('answer directly', 'extend answer', 'use natural examples'),
    'min_turns', 6
  ),
  jsonb_build_object('avoid_topics', jsonb_build_array('score guarantees')),
  NOW(),
  jsonb_build_object('default_teacher_persona', 'strict_examiner')
FROM scenarios s
WHERE s.code = 'ielts_part1_hometown'
  AND NOT EXISTS (
    SELECT 1 FROM scenario_versions sv
    WHERE sv.scenario_id = s.id AND sv.version = 1 AND sv.deleted_at IS NULL
  );

INSERT INTO scenario_objectives (scenario_version_id, objective_type, title, description, weight)
SELECT
  sv.id,
  'communication',
  'Handle check-in flow',
  'The learner should answer destination, baggage, and seat-preference questions smoothly.',
  0.50
FROM scenario_versions sv
JOIN scenarios s ON s.id = sv.scenario_id
WHERE s.code = 'airport_checkin' AND sv.version = 1
  AND NOT EXISTS (
    SELECT 1 FROM scenario_objectives so
    WHERE so.scenario_version_id = sv.id AND so.title = 'Handle check-in flow' AND so.deleted_at IS NULL
  );

INSERT INTO scenario_objectives (scenario_version_id, objective_type, title, description, weight)
SELECT
  sv.id,
  'fluency',
  'Respond without long pauses',
  'The learner should keep answers understandable and avoid breaking every phrase.',
  0.50
FROM scenario_versions sv
JOIN scenarios s ON s.id = sv.scenario_id
WHERE s.code = 'airport_checkin' AND sv.version = 1
  AND NOT EXISTS (
    SELECT 1 FROM scenario_objectives so
    WHERE so.scenario_version_id = sv.id AND so.title = 'Respond without long pauses' AND so.deleted_at IS NULL
  );

INSERT INTO scenario_target_phrases (
  scenario_version_id,
  phrase,
  phrase_type,
  difficulty_level,
  must_master,
  example_json
)
SELECT
  sv.id,
  phrase_data.phrase,
  phrase_data.phrase_type,
  phrase_data.difficulty_level,
  phrase_data.must_master,
  phrase_data.example_json
FROM scenario_versions sv
JOIN scenarios s ON s.id = sv.scenario_id
JOIN (
  VALUES
    ('check in', 'functional', 'A2', true, '{"example":"I would like to check in for my flight."}'::jsonb),
    ('boarding pass', 'noun_chunk', 'A2', true, '{"example":"Here is your boarding pass."}'::jsonb),
    ('window seat', 'noun_chunk', 'A2', true, '{"example":"Could I have a window seat?"}'::jsonb)
) AS phrase_data(phrase, phrase_type, difficulty_level, must_master, example_json) ON TRUE
WHERE s.code = 'airport_checkin' AND sv.version = 1
  AND NOT EXISTS (
    SELECT 1 FROM scenario_target_phrases stp
    WHERE stp.scenario_version_id = sv.id
      AND stp.phrase = phrase_data.phrase
      AND stp.deleted_at IS NULL
  );

INSERT INTO scenario_target_grammar (scenario_version_id, grammar_code, title, description, weight)
SELECT
  sv.id,
  grammar_data.grammar_code,
  grammar_data.title,
  grammar_data.description,
  grammar_data.weight
FROM scenario_versions sv
JOIN scenarios s ON s.id = sv.scenario_id
JOIN (
  VALUES
    ('polite_request', 'Polite requests', 'Use could/would for polite travel requests.', 0.50::numeric),
    ('present_simple', 'Present simple for facts', 'State travel facts clearly in the present simple.', 0.50::numeric)
) AS grammar_data(grammar_code, title, description, weight) ON TRUE
WHERE s.code = 'airport_checkin' AND sv.version = 1
  AND NOT EXISTS (
    SELECT 1 FROM scenario_target_grammar stg
    WHERE stg.scenario_version_id = sv.id
      AND stg.grammar_code = grammar_data.grammar_code
      AND stg.deleted_at IS NULL
  );

INSERT INTO lesson_plans (
  scenario_version_id,
  name,
  objective,
  warmup_prompt,
  teacher_strategy_json,
  correction_policy_json,
  report_policy_json,
  extra_json
)
SELECT
  sv.id,
  'Airport Check-in Core Plan',
  'Help the learner complete a realistic check-in dialogue with targeted phrase practice.',
  'Ask the learner one simple travel warm-up question before moving into role play.',
  jsonb_build_object(
    'steps', jsonb_build_array('warmup', 'roleplay', 'followup', 'micro_feedback', 'wrapup'),
    'difficulty_adaptation', true
  ),
  jsonb_build_object(
    'mode', 'light_realtime',
    'max_realtime_corrections', 1,
    'post_session_focus', jsonb_build_array('pronunciation', 'functional_phrases')
  ),
  jsonb_build_object(
    'include_homework', true,
    'include_model_answer', true
  ),
  jsonb_build_object('default_persona_code', 'supportive_teacher')
FROM scenario_versions sv
JOIN scenarios s ON s.id = sv.scenario_id
WHERE s.code = 'airport_checkin' AND sv.version = 1
  AND NOT EXISTS (
    SELECT 1 FROM lesson_plans lp
    WHERE lp.scenario_version_id = sv.id
      AND lp.name = 'Airport Check-in Core Plan'
      AND lp.deleted_at IS NULL
  );

INSERT INTO lesson_plans (
  scenario_version_id,
  name,
  objective,
  warmup_prompt,
  teacher_strategy_json,
  correction_policy_json,
  report_policy_json,
  extra_json
)
SELECT
  sv.id,
  'Interview Introduction Plan',
  'Improve self-introduction clarity, confidence, and follow-up answering.',
  'Start with a simple question about the learner''s current role or study major.',
  jsonb_build_object(
    'steps', jsonb_build_array('warmup', 'self_intro', 'experience_probe', 'followup', 'wrapup'),
    'difficulty_adaptation', true
  ),
  jsonb_build_object(
    'mode', 'post_turn_feedback',
    'max_realtime_corrections', 1,
    'post_session_focus', jsonb_build_array('grammar', 'natural_expression')
  ),
  jsonb_build_object(
    'include_homework', true,
    'include_model_answer', true
  ),
  jsonb_build_object('default_persona_code', 'friendly_colleague')
FROM scenario_versions sv
JOIN scenarios s ON s.id = sv.scenario_id
WHERE s.code = 'job_interview_intro' AND sv.version = 1
  AND NOT EXISTS (
    SELECT 1 FROM lesson_plans lp
    WHERE lp.scenario_version_id = sv.id
      AND lp.name = 'Interview Introduction Plan'
      AND lp.deleted_at IS NULL
  );

INSERT INTO lesson_plans (
  scenario_version_id,
  name,
  objective,
  warmup_prompt,
  teacher_strategy_json,
  correction_policy_json,
  report_policy_json,
  extra_json
)
SELECT
  sv.id,
  'IELTS Part 1 Base Plan',
  'Train short, direct, and extended answers under IELTS-style pacing.',
  'Begin the speaking test naturally and keep the questions short.',
  jsonb_build_object(
    'steps', jsonb_build_array('intro', 'question_round_1', 'question_round_2', 'micro_feedback', 'wrapup'),
    'difficulty_adaptation', false
  ),
  jsonb_build_object(
    'mode', 'post_session_only',
    'max_realtime_corrections', 0,
    'post_session_focus', jsonb_build_array('coherence', 'fluency', 'lexical_range')
  ),
  jsonb_build_object(
    'include_homework', true,
    'include_model_answer', false
  ),
  jsonb_build_object('default_persona_code', 'strict_examiner')
FROM scenario_versions sv
JOIN scenarios s ON s.id = sv.scenario_id
WHERE s.code = 'ielts_part1_hometown' AND sv.version = 1
  AND NOT EXISTS (
    SELECT 1 FROM lesson_plans lp
    WHERE lp.scenario_version_id = sv.id
      AND lp.name = 'IELTS Part 1 Base Plan'
      AND lp.deleted_at IS NULL
  );

INSERT INTO curriculums (
  code,
  name,
  description,
  target_user_type,
  target_cefr_min,
  target_cefr_max,
  status,
  extra_json
)
SELECT
  'spoken_english_starter',
  'Spoken English Starter',
  'A practical starter curriculum covering travel, work, and exam-style conversation.',
  'adult_learner',
  'A2',
  'B2',
  'published',
  jsonb_build_object('recommended_sequence', jsonb_build_array('airport_checkin', 'job_interview_intro', 'ielts_part1_hometown'))
WHERE NOT EXISTS (
  SELECT 1 FROM curriculums WHERE code = 'spoken_english_starter' AND deleted_at IS NULL
);

INSERT INTO curriculum_units (curriculum_id, title, sort_order, objective)
SELECT
  c.id,
  'Real-life communication',
  1,
  'Use English in practical daily-life situations.'
FROM curriculums c
WHERE c.code = 'spoken_english_starter'
  AND NOT EXISTS (
    SELECT 1 FROM curriculum_units cu
    WHERE cu.curriculum_id = c.id AND cu.sort_order = 1 AND cu.deleted_at IS NULL
  );

INSERT INTO curriculum_units (curriculum_id, title, sort_order, objective)
SELECT
  c.id,
  'Academic and career speaking',
  2,
  'Speak more clearly in academic and professional contexts.'
FROM curriculums c
WHERE c.code = 'spoken_english_starter'
  AND NOT EXISTS (
    SELECT 1 FROM curriculum_units cu
    WHERE cu.curriculum_id = c.id AND cu.sort_order = 2 AND cu.deleted_at IS NULL
  );

INSERT INTO curriculum_lessons (unit_id, scenario_version_id, lesson_plan_id, sort_order, is_required)
SELECT
  cu.id,
  sv.id,
  lp.id,
  1,
  true
FROM curriculum_units cu
JOIN curriculums c ON c.id = cu.curriculum_id
JOIN scenarios s ON s.code = 'airport_checkin'
JOIN scenario_versions sv ON sv.scenario_id = s.id AND sv.version = 1
JOIN lesson_plans lp ON lp.scenario_version_id = sv.id AND lp.name = 'Airport Check-in Core Plan'
WHERE c.code = 'spoken_english_starter'
  AND cu.sort_order = 1
  AND NOT EXISTS (
    SELECT 1 FROM curriculum_lessons cl
    WHERE cl.unit_id = cu.id AND cl.sort_order = 1 AND cl.deleted_at IS NULL
  );

INSERT INTO curriculum_lessons (unit_id, scenario_version_id, lesson_plan_id, sort_order, is_required)
SELECT
  cu.id,
  sv.id,
  lp.id,
  1,
  true
FROM curriculum_units cu
JOIN curriculums c ON c.id = cu.curriculum_id
JOIN scenarios s ON s.code = 'job_interview_intro'
JOIN scenario_versions sv ON sv.scenario_id = s.id AND sv.version = 1
JOIN lesson_plans lp ON lp.scenario_version_id = sv.id AND lp.name = 'Interview Introduction Plan'
WHERE c.code = 'spoken_english_starter'
  AND cu.sort_order = 2
  AND NOT EXISTS (
    SELECT 1 FROM curriculum_lessons cl
    WHERE cl.unit_id = cu.id AND cl.sort_order = 1 AND cl.deleted_at IS NULL
  );

INSERT INTO curriculum_lessons (unit_id, scenario_version_id, lesson_plan_id, sort_order, is_required)
SELECT
  cu.id,
  sv.id,
  lp.id,
  2,
  false
FROM curriculum_units cu
JOIN curriculums c ON c.id = cu.curriculum_id
JOIN scenarios s ON s.code = 'ielts_part1_hometown'
JOIN scenario_versions sv ON sv.scenario_id = s.id AND sv.version = 1
JOIN lesson_plans lp ON lp.scenario_version_id = sv.id AND lp.name = 'IELTS Part 1 Base Plan'
WHERE c.code = 'spoken_english_starter'
  AND cu.sort_order = 2
  AND NOT EXISTS (
    SELECT 1 FROM curriculum_lessons cl
    WHERE cl.unit_id = cu.id AND cl.sort_order = 2 AND cl.deleted_at IS NULL
  );

INSERT INTO prompt_templates (
  template_code,
  template_type,
  language,
  version,
  title,
  template_content,
  status,
  extra_json
)
SELECT
  'teacher_session_system',
  'system',
  'en',
  1,
  'Teacher Session System Prompt',
  'You are an AI oral English teacher. Stay in role, keep responses concise, maintain speaking momentum, and only correct the learner in line with the correction policy.',
  'published',
  jsonb_build_object('used_by', jsonb_build_array('realtime_orchestrator'))
WHERE NOT EXISTS (
  SELECT 1 FROM prompt_templates
  WHERE template_code = 'teacher_session_system' AND language = 'en' AND version = 1 AND deleted_at IS NULL
);

INSERT INTO prompt_templates (
  template_code,
  template_type,
  language,
  version,
  title,
  template_content,
  status,
  extra_json
)
SELECT
  'session_report_generator',
  'report',
  'en',
  1,
  'Session Report Generator',
  'Generate a structured language-learning report with strengths, weaknesses, pronunciation notes, expression upgrades, and targeted homework.',
  'published',
  jsonb_build_object('used_by', jsonb_build_array('worker'))
WHERE NOT EXISTS (
  SELECT 1 FROM prompt_templates
  WHERE template_code = 'session_report_generator' AND language = 'en' AND version = 1 AND deleted_at IS NULL
);

INSERT INTO prompt_bindings (
  binding_scope,
  binding_target_id,
  template_id,
  priority,
  is_active,
  extra_json
)
SELECT
  'global',
  NULL,
  pt.id,
  100,
  true,
  jsonb_build_object('description', 'Default system prompt for teacher sessions')
FROM prompt_templates pt
WHERE pt.template_code = 'teacher_session_system' AND pt.version = 1 AND pt.deleted_at IS NULL
  AND NOT EXISTS (
    SELECT 1 FROM prompt_bindings pb
    WHERE pb.binding_scope = 'global' AND pb.template_id = pt.id AND pb.deleted_at IS NULL
  );

INSERT INTO provider_configs (
  capability,
  provider_name,
  base_url,
  model,
  api_key_hint,
  timeout_ms,
  is_active,
  upstream_config_json,
  extra_json
)
SELECT
  'llm',
  'remote-openai-compatible',
  'https://your-llm-provider.example.com/v1',
  'gpt-4.1-mini',
  'replace-with-real-key',
  30000,
  true,
  jsonb_build_object('protocol', 'openai-compatible', 'stream', true),
  jsonb_build_object('note', 'Replace base_url, api_key_hint, and model with your actual provider values.')
WHERE NOT EXISTS (
  SELECT 1 FROM provider_configs
  WHERE capability = 'llm' AND provider_name = 'remote-openai-compatible' AND deleted_at IS NULL
);

INSERT INTO provider_configs (
  capability,
  provider_name,
  base_url,
  model,
  api_key_hint,
  timeout_ms,
  is_active,
  upstream_config_json,
  extra_json
)
SELECT
  'asr',
  'remote-asr-compatible',
  'https://your-asr-provider.example.com/v1',
  'gpt-4o-mini-transcribe',
  'replace-with-real-key',
  30000,
  true,
  jsonb_build_object('protocol', 'openai-compatible', 'path', '/audio/transcriptions'),
  jsonb_build_object('note', 'If your LLM provider does not offer ASR, replace this with a local gateway later.')
WHERE NOT EXISTS (
  SELECT 1 FROM provider_configs
  WHERE capability = 'asr' AND provider_name = 'remote-asr-compatible' AND deleted_at IS NULL
);

INSERT INTO provider_configs (
  capability,
  provider_name,
  base_url,
  model,
  api_key_hint,
  timeout_ms,
  is_active,
  upstream_config_json,
  extra_json
)
SELECT
  'tts',
  'local-tts-gateway',
  'http://127.0.0.1:8091/v1',
  'teacher-default-voice',
  'local-gateway',
  30000,
  true,
  jsonb_build_object('protocol', 'openai-compatible', 'path', '/audio/speech'),
  jsonb_build_object('note', 'Gateway placeholder for TTS provider adaptation.')
WHERE NOT EXISTS (
  SELECT 1 FROM provider_configs
  WHERE capability = 'tts' AND provider_name = 'local-tts-gateway' AND deleted_at IS NULL
);

INSERT INTO provider_configs (
  capability,
  provider_name,
  base_url,
  model,
  api_key_hint,
  timeout_ms,
  is_active,
  upstream_config_json,
  extra_json
)
SELECT
  'pronunciation',
  'local-pronunciation-gateway',
  'http://127.0.0.1:8092/v1',
  'pronunciation-default-v1',
  'local-gateway',
  45000,
  true,
  jsonb_build_object('protocol', 'openai-compatible', 'path', '/pronunciation/assessments', 'language', 'en-US'),
  jsonb_build_object('note', 'Gateway placeholder for pronunciation scoring provider adaptation.')
WHERE NOT EXISTS (
  SELECT 1 FROM provider_configs
  WHERE capability = 'pronunciation' AND provider_name = 'local-pronunciation-gateway' AND deleted_at IS NULL
);

INSERT INTO plans (
  code,
  name,
  plan_type,
  billing_cycle,
  price_amount,
  currency,
  quota_json,
  is_active,
  extra_json
)
SELECT
  'free',
  'Free',
  'consumer',
  'monthly',
  0,
  'CNY',
  jsonb_build_object(
    'minutes_per_day', 15,
    'reports_per_day', 3,
    'advanced_pronunciation', false
  ),
  true,
  jsonb_build_object('recommended_for', 'trial')
WHERE NOT EXISTS (
  SELECT 1 FROM plans WHERE code = 'free' AND deleted_at IS NULL
);

INSERT INTO plans (
  code,
  name,
  plan_type,
  billing_cycle,
  price_amount,
  currency,
  quota_json,
  is_active,
  extra_json
)
SELECT
  'pro_monthly',
  'Pro Monthly',
  'consumer',
  'monthly',
  99,
  'CNY',
  jsonb_build_object(
    'minutes_per_day', 120,
    'reports_per_day', 999,
    'advanced_pronunciation', true
  ),
  true,
  jsonb_build_object('recommended_for', 'serious_learner')
WHERE NOT EXISTS (
  SELECT 1 FROM plans WHERE code = 'pro_monthly' AND deleted_at IS NULL
);

COMMIT;
