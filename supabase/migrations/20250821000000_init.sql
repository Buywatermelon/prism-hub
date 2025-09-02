-- ==================== Claude Relay 数据库 Schema ====================
-- 包含所有核心表结构

-- ==================== 工作空间模块 ====================

-- 创建工作空间表
CREATE TABLE IF NOT EXISTS workspaces (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text UNIQUE NOT NULL,
  description text,
  join_code text UNIQUE NOT NULL,
  settings jsonb DEFAULT '{}' NOT NULL,
  preferences jsonb DEFAULT '{}' NOT NULL,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

COMMENT ON TABLE workspaces IS '工作空间表，用于多租户隔离';
COMMENT ON COLUMN workspaces.name IS '工作空间名称';
COMMENT ON COLUMN workspaces.slug IS 'URL 友好的唯一标识符';
COMMENT ON COLUMN workspaces.description IS '工作空间描述';
COMMENT ON COLUMN workspaces.join_code IS '工作空间加入码，用于邀请新成员';
COMMENT ON COLUMN workspaces.settings IS '工作空间设置，JSON 格式存储';
COMMENT ON COLUMN workspaces.preferences IS '工作空间偏好设置，包含默认供应商优先级等配置，格式：{"provider_priority": ["provider_id_1", "provider_id_2"], "last_updated": "2025-01-01T00:00:00Z"}';
COMMENT ON COLUMN workspaces.created_by IS '创建者用户 ID';

-- 创建工作空间成员表
CREATE TABLE IF NOT EXISTS workspace_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid REFERENCES workspaces(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role text NOT NULL CHECK (role IN ('owner', 'admin', 'member')),
  status text DEFAULT 'active' CHECK (status IN ('pending', 'active', 'rejected')),
  permissions jsonb DEFAULT '{}' NOT NULL,
  preferences jsonb DEFAULT '{}' NOT NULL,
  joined_at timestamptz DEFAULT now() NOT NULL,
  invited_by uuid REFERENCES auth.users(id),
  applied_at timestamptz DEFAULT now() NOT NULL,
  approved_at timestamptz,
  approved_by uuid REFERENCES auth.users(id),
  reject_reason text,
  UNIQUE(workspace_id, user_id)
);

COMMENT ON TABLE workspace_members IS '工作空间成员表，管理用户与工作空间的关系';
COMMENT ON COLUMN workspace_members.workspace_id IS '工作空间 ID';
COMMENT ON COLUMN workspace_members.user_id IS '用户 ID';
COMMENT ON COLUMN workspace_members.role IS '成员角色：owner-所有者，admin-管理员，member-普通成员';
COMMENT ON COLUMN workspace_members.status IS '成员状态：pending-待审批，active-已激活，rejected-已拒绝';
COMMENT ON COLUMN workspace_members.permissions IS '自定义权限覆盖，JSON 格式';
COMMENT ON COLUMN workspace_members.preferences IS '用户在该工作空间的偏好设置，格式：{"provider_priority": ["provider_id_1", "provider_id_2"], "last_updated": "2025-01-01T00:00:00Z"}';
COMMENT ON COLUMN workspace_members.joined_at IS '加入工作空间的时间';
COMMENT ON COLUMN workspace_members.invited_by IS '邀请人用户 ID';
COMMENT ON COLUMN workspace_members.applied_at IS '申请加入时间';
COMMENT ON COLUMN workspace_members.approved_at IS '审批通过时间';
COMMENT ON COLUMN workspace_members.approved_by IS '审批人用户 ID';
COMMENT ON COLUMN workspace_members.reject_reason IS '拒绝原因';

-- ==================== 供应商模块 ====================

-- 创建供应商表
CREATE TABLE IF NOT EXISTS providers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid REFERENCES workspaces(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  type text NOT NULL CHECK (type IN ('claude', 'openai', 'gemini')),
  endpoint text,
  config jsonb DEFAULT '{}' NOT NULL,
  models jsonb DEFAULT '[]' NOT NULL,
  description text,
  icon text,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  UNIQUE(workspace_id, name)
);

COMMENT ON TABLE providers IS '供应商配置表，存储 AI 服务提供商信息';
COMMENT ON COLUMN providers.workspace_id IS '所属工作空间 ID';
COMMENT ON COLUMN providers.name IS '供应商名称，在工作空间内唯一';
COMMENT ON COLUMN providers.type IS '供应商类型：claude-官方Claude，openai-OpenAI兼容，gemini-Google Gemini';
COMMENT ON COLUMN providers.endpoint IS 'API 端点地址';
COMMENT ON COLUMN providers.config IS '供应商配置，JSON 格式，包含认证方式、特殊参数等';
COMMENT ON COLUMN providers.models IS '支持的模型列表，JSON 数组格式';
COMMENT ON COLUMN providers.description IS '供应商描述';
COMMENT ON COLUMN providers.icon IS '供应商图标 URL';
COMMENT ON COLUMN providers.created_by IS '创建者用户 ID';

-- 创建供应商凭证表
CREATE TABLE IF NOT EXISTS provider_credentials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid REFERENCES workspaces(id) ON DELETE CASCADE NOT NULL,
  provider_id uuid REFERENCES providers(id) ON DELETE CASCADE NOT NULL,
  credential_type text NOT NULL CHECK (credential_type IN ('api_key', 'oauth_account')),
  name text NOT NULL,
  status text DEFAULT 'active' CHECK (status IN ('active', 'expired', 'rate_limited')),
  encrypted_key text,
  key_hint text,
  oauth_data jsonb,
  config jsonb DEFAULT '{}' NOT NULL,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  last_used_at timestamptz
);

COMMENT ON TABLE provider_credentials IS '供应商凭证表，统一管理 API Keys 和 OAuth 账号';
COMMENT ON COLUMN provider_credentials.workspace_id IS '所属工作空间 ID';
COMMENT ON COLUMN provider_credentials.provider_id IS '所属供应商 ID';
COMMENT ON COLUMN provider_credentials.credential_type IS '凭证类型：api_key-API密钥，oauth_account-OAuth账号';
COMMENT ON COLUMN provider_credentials.name IS '凭证名称，在供应商内唯一';
COMMENT ON COLUMN provider_credentials.status IS '凭证状态：active-活跃，expired-已过期，rate_limited-限流中';
COMMENT ON COLUMN provider_credentials.encrypted_key IS 'API 密钥（加密存储）';
COMMENT ON COLUMN provider_credentials.key_hint IS 'API 密钥提示信息，用于显示部分密钥';
COMMENT ON COLUMN provider_credentials.oauth_data IS 'OAuth 相关数据，包含 email、tokens、scopes 等';
COMMENT ON COLUMN provider_credentials.config IS '凭证配置，如速率限制、特殊参数等';
COMMENT ON COLUMN provider_credentials.created_by IS '创建者用户 ID';
COMMENT ON COLUMN provider_credentials.last_used_at IS '最后使用时间';

-- 创建凭证使用统计表（空表，后续完善）
CREATE TABLE IF NOT EXISTS credential_usage_stats (
  -- 表结构待完善
);

-- ==================== API 密钥模块 ====================

-- 创建用户 API Keys 表
CREATE TABLE IF NOT EXISTS user_api_keys (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid REFERENCES workspaces(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  key_hash text NOT NULL UNIQUE,
  key_prefix text NOT NULL,
  description text,
  last_used_at timestamptz,
  expires_at timestamptz,
  scopes jsonb DEFAULT '[]' NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  UNIQUE(workspace_id, user_id, key_hash)
);

COMMENT ON TABLE user_api_keys IS '用户 API 密钥表，用于访问 Claude Relay API';
COMMENT ON COLUMN user_api_keys.workspace_id IS '所属工作空间 ID';
COMMENT ON COLUMN user_api_keys.user_id IS '所属用户 ID';
COMMENT ON COLUMN user_api_keys.key_hash IS 'API 密钥哈希值，用于验证';
COMMENT ON COLUMN user_api_keys.key_prefix IS 'API 密钥前缀，用于显示';
COMMENT ON COLUMN user_api_keys.description IS 'API 密钥描述';
COMMENT ON COLUMN user_api_keys.last_used_at IS '最后使用时间';
COMMENT ON COLUMN user_api_keys.expires_at IS '过期时间，NULL 表示永不过期';
COMMENT ON COLUMN user_api_keys.scopes IS '权限范围，JSON 数组格式';

-- 创建 API 密钥使用日志表（空表，后续完善）
CREATE TABLE IF NOT EXISTS api_key_usage_logs (
  -- 表结构待完善
);

-- ==================== RBAC 权限系统 ====================

-- 创建角色表
CREATE TABLE IF NOT EXISTS roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  display_name text NOT NULL,
  description text,
  is_system boolean DEFAULT false,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

COMMENT ON TABLE roles IS '角色表，定义系统中的角色';
COMMENT ON COLUMN roles.name IS '角色名称，系统内部使用，必须唯一';
COMMENT ON COLUMN roles.display_name IS '角色显示名称，用于界面展示';
COMMENT ON COLUMN roles.description IS '角色描述';
COMMENT ON COLUMN roles.is_system IS '是否为系统角色，系统角色不可删除';

-- 创建权限表
CREATE TABLE IF NOT EXISTS permissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  action text NOT NULL,
  subject text NOT NULL,
  conditions jsonb,
  fields jsonb,
  description text,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  UNIQUE(action, subject)
);

COMMENT ON TABLE permissions IS '权限表，定义系统中的权限点';
COMMENT ON COLUMN permissions.action IS '权限动作：create, read, update, delete, approve, reject, manage';
COMMENT ON COLUMN permissions.subject IS '权限对象：Workspace, Membership, Provider, Model, ClaudeAccount, RouteConfig';
COMMENT ON COLUMN permissions.conditions IS 'CASL 条件规则，支持动态权限检查，如 {"created_by": "${user.id}"}';
COMMENT ON COLUMN permissions.fields IS '字段级权限控制，限制可访问的字段列表，如 ["name", "type"]';
COMMENT ON COLUMN permissions.description IS '权限描述';

-- 创建角色权限关联表
CREATE TABLE IF NOT EXISTS role_permissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  role_id uuid NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  permission_id uuid NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now() NOT NULL,
  created_by uuid REFERENCES auth.users(id),
  UNIQUE(role_id, permission_id)
);

COMMENT ON TABLE role_permissions IS '角色权限关联表，定义角色拥有的权限';
COMMENT ON COLUMN role_permissions.role_id IS '角色 ID';
COMMENT ON COLUMN role_permissions.permission_id IS '权限 ID';
COMMENT ON COLUMN role_permissions.created_by IS '授权者用户 ID';

-- ==================== 实用功能表 ====================

-- 创建审计日志表
CREATE TABLE IF NOT EXISTS audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid REFERENCES workspaces(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES auth.users(id),
  action text NOT NULL,
  resource_type text,
  resource_id uuid,
  details jsonb,
  ip_address inet,
  user_agent text,
  created_at timestamptz DEFAULT now() NOT NULL
);

COMMENT ON TABLE audit_logs IS '业务审计日志表（简化版），记录关键业务操作';
COMMENT ON COLUMN audit_logs.workspace_id IS '所属工作空间 ID';
COMMENT ON COLUMN audit_logs.user_id IS '操作用户 ID';
COMMENT ON COLUMN audit_logs.action IS '操作动作，如 create, update, delete, login, logout';
COMMENT ON COLUMN audit_logs.resource_type IS '资源类型，如 provider, credential, api_key';
COMMENT ON COLUMN audit_logs.resource_id IS '资源 ID';
COMMENT ON COLUMN audit_logs.details IS '操作详情，如 {"method": "POST", "status": 200}';
COMMENT ON COLUMN audit_logs.ip_address IS '客户端 IP 地址';
COMMENT ON COLUMN audit_logs.user_agent IS '客户端 User-Agent';

-- ==================== 创建索引 ====================

-- 工作空间索引
CREATE INDEX IF NOT EXISTS idx_workspaces_join_code ON workspaces(join_code);
CREATE INDEX IF NOT EXISTS idx_workspaces_slug ON workspaces(slug);
CREATE INDEX IF NOT EXISTS idx_workspaces_created_by ON workspaces(created_by);

-- 工作空间成员索引
CREATE INDEX IF NOT EXISTS idx_workspace_members_user ON workspace_members(user_id);
CREATE INDEX IF NOT EXISTS idx_workspace_members_workspace ON workspace_members(workspace_id);
CREATE INDEX IF NOT EXISTS idx_workspace_members_status ON workspace_members(status);
CREATE INDEX IF NOT EXISTS idx_workspace_members_role ON workspace_members(role);

-- 供应商索引
CREATE INDEX IF NOT EXISTS idx_providers_workspace ON providers(workspace_id);
CREATE INDEX IF NOT EXISTS idx_providers_type ON providers(type);

-- 凭证索引
CREATE INDEX IF NOT EXISTS idx_provider_credentials_provider ON provider_credentials(provider_id);
CREATE INDEX IF NOT EXISTS idx_provider_credentials_workspace ON provider_credentials(workspace_id);
CREATE INDEX IF NOT EXISTS idx_provider_credentials_status ON provider_credentials(status);
CREATE INDEX IF NOT EXISTS idx_provider_credentials_type ON provider_credentials(credential_type);

-- API 密钥索引
CREATE INDEX IF NOT EXISTS idx_user_api_keys_user ON user_api_keys(user_id);
CREATE INDEX IF NOT EXISTS idx_user_api_keys_workspace ON user_api_keys(workspace_id);
CREATE INDEX IF NOT EXISTS idx_user_api_keys_key_hash ON user_api_keys(key_hash);

-- RBAC 索引
CREATE INDEX IF NOT EXISTS idx_roles_name ON roles(name);
CREATE INDEX IF NOT EXISTS idx_roles_is_system ON roles(is_system);
CREATE INDEX IF NOT EXISTS idx_permissions_action_subject ON permissions(action, subject);
CREATE INDEX IF NOT EXISTS idx_role_permissions_role ON role_permissions(role_id);
CREATE INDEX IF NOT EXISTS idx_role_permissions_permission ON role_permissions(permission_id);

-- 审计日志索引
CREATE INDEX IF NOT EXISTS idx_audit_logs_workspace ON audit_logs(workspace_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created ON audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_resource ON audit_logs(resource_type, resource_id);

-- ==================== OpenRouter 模型数据表 ====================

-- 创建 models 表来存储 OpenRouter 模型数据
CREATE TABLE IF NOT EXISTS models (
  id TEXT PRIMARY KEY,
  canonical_slug TEXT,
  hugging_face_id TEXT,
  name TEXT NOT NULL,
  created BIGINT,
  description TEXT,
  context_length INTEGER,
  architecture JSONB,
  pricing JSONB,
  top_provider JSONB,
  per_request_limits JSONB,
  supported_parameters TEXT[],
  last_synced_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

COMMENT ON TABLE models IS 'OpenRouter 模型数据表，存储可用的 AI 模型信息';
COMMENT ON COLUMN models.id IS '模型唯一标识符';
COMMENT ON COLUMN models.canonical_slug IS '模型规范化 slug';
COMMENT ON COLUMN models.hugging_face_id IS 'Hugging Face 模型 ID';
COMMENT ON COLUMN models.name IS '模型名称';
COMMENT ON COLUMN models.created IS '模型创建时间戳';
COMMENT ON COLUMN models.description IS '模型描述';
COMMENT ON COLUMN models.context_length IS '上下文长度限制';
COMMENT ON COLUMN models.architecture IS '模型架构信息，JSON 格式';
COMMENT ON COLUMN models.pricing IS '模型定价信息，JSON 格式';
COMMENT ON COLUMN models.top_provider IS '最佳供应商信息，JSON 格式';
COMMENT ON COLUMN models.per_request_limits IS '每请求限制，JSON 格式';
COMMENT ON COLUMN models.supported_parameters IS '支持的参数列表';
COMMENT ON COLUMN models.last_synced_at IS '最后同步时间';

-- 创建 models 表索引
CREATE INDEX IF NOT EXISTS idx_models_name ON models(name);
CREATE INDEX IF NOT EXISTS idx_models_canonical_slug ON models(canonical_slug);
CREATE INDEX IF NOT EXISTS idx_models_last_synced ON models(last_synced_at);

