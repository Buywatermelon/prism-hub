-- 初始化 pg_cron 定时任务
-- 确保 pg_cron 扩展已启用
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- 删除已存在的同名任务（如果有）
-- 使用 IF EXISTS 语法避免任务不存在时报错
DO $$
BEGIN
  -- 尝试删除 sync-openrouter-models 任务
  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'sync-openrouter-models') THEN
    PERFORM cron.unschedule('sync-openrouter-models');
  END IF;
  
  -- 尝试删除 refresh-oauth-tokens 任务
  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'refresh-oauth-tokens') THEN
    PERFORM cron.unschedule('refresh-oauth-tokens');
  END IF;
END $$;

-- 1. 同步 OpenRouter 模型数据
-- 每天凌晨 2:00 执行
SELECT cron.schedule(
  'sync-openrouter-models',
  '0 2 * * *',
  $$
  SELECT net.http_post(
    url := 'http://host.docker.internal:54321/functions/v1/sync-models',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU'
    ),
    body := '{}'::jsonb
  ) AS request_id;
  $$
);

-- 2. 刷新 OAuth 令牌
-- 每小时执行一次
SELECT cron.schedule(
  'refresh-oauth-tokens',
  '0 * * * *',
  $$
  SELECT net.http_post(
    url := 'http://host.docker.internal:54321/functions/v1/refresh-oauth',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU'
    ),
    body := '{}'::jsonb
  ) AS request_id;
  $$
);

