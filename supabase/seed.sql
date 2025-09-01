-- ==================== Claude Relay 种子数据 ====================

-- ==================== RBAC 权限系统种子数据 ====================

-- 插入初始角色数据
INSERT INTO roles (name, display_name, description, is_system) VALUES
  ('owner', '所有者', '工作空间创建者，拥有最高权限', true),
  ('admin', '管理员', '可以管理工作空间资源和成员', true),
  ('member', '成员', '可以查看和使用工作空间资源', true)
ON CONFLICT (name) DO NOTHING;

-- 插入权限数据
INSERT INTO permissions (action, subject, description) VALUES
  -- 工作空间权限
  ('read', 'Workspace', '查看工作空间信息'),
  ('update', 'Workspace', '更新工作空间设置'),
  ('delete', 'Workspace', '删除工作空间'),
  
  -- 成员管理权限
  ('read', 'Membership', '查看成员列表'),
  ('create', 'Membership', '邀请新成员'),
  ('update', 'Membership', '修改成员角色'),
  ('delete', 'Membership', '移除成员'),
  ('approve', 'Membership', '审批加入申请'),
  ('reject', 'Membership', '拒绝加入申请'),
  
  -- Provider 权限
  ('read', 'Provider', '查看供应商'),
  ('create', 'Provider', '创建供应商'),
  ('update', 'Provider', '更新供应商'),
  ('delete', 'Provider', '删除供应商'),
  
  -- Credential 权限
  ('read', 'Credential', '查看凭证'),
  ('create', 'Credential', '创建凭证'),
  ('update', 'Credential', '更新凭证'),
  ('delete', 'Credential', '删除凭证'),
  
  -- API Key 权限
  ('read', 'ApiKey', '查看 API 密钥'),
  ('create', 'ApiKey', '创建 API 密钥'),
  ('update', 'ApiKey', '更新 API 密钥'),
  ('delete', 'ApiKey', '删除 API 密钥'),
  
  -- AuditLog 权限
  ('read', 'AuditLog', '查看审计日志')
ON CONFLICT (action, subject) DO NOTHING;

-- 为角色分配权限
-- Owner: 拥有所有权限
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id 
FROM roles r 
CROSS JOIN permissions p 
WHERE r.name = 'owner'
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- Admin: 除了删除工作空间外的所有权限
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id 
FROM roles r 
CROSS JOIN permissions p 
WHERE r.name = 'admin' 
  AND NOT (p.action = 'delete' AND p.subject = 'Workspace')
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- Member: 只有读权限
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id 
FROM roles r 
CROSS JOIN permissions p 
WHERE r.name = 'member' 
  AND p.action = 'read'
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- ==================== OAuth 令牌自动刷新设置 ====================

-- 启用必要的扩展
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- 授予权限
GRANT USAGE ON SCHEMA cron TO postgres;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA cron TO postgres;

-- 创建 OAuth 令牌刷新定时任务（每30分钟执行一次）
-- 注意：本地环境使用 host.docker.internal，生产环境需要替换为实际的项目 URL
DO $$
BEGIN
  -- 检查是否已存在同名任务
  IF NOT EXISTS (
    SELECT 1 FROM cron.job WHERE jobname = 'refresh-oauth-tokens'
  ) THEN
    PERFORM cron.schedule(
      'refresh-oauth-tokens',
      '*/30 * * * *',
      $CRON$
      SELECT net.http_post(
        url := 'http://host.docker.internal:54321/functions/v1/refresh-oauth',
        headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU'
        ),
        body := '{}'::jsonb
      ) as request_id;
      $CRON$
    );
    RAISE NOTICE 'OAuth 令牌刷新定时任务已创建';
  END IF;
END $$;