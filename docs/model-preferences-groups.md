# 模型偏好分组设计

## 概述
模型偏好分组允许用户根据不同的使用场景创建模型组合，快速切换不同的模型使用策略。

## 核心概念

### 1. 预设分组
系统提供几种常见的预设分组：

- **快速响应组** (quick_response)
  - 优先选择响应速度快的模型
  - 适用于：简单查询、快速问答、实时对话
  - 推荐模型：Claude Haiku, GPT-3.5 Turbo, Gemini Flash

- **深度分析组** (deep_analysis)  
  - 优先选择推理能力强的模型
  - 适用于：复杂问题分析、研究任务、决策支持
  - 推荐模型：Claude Opus, GPT-4, Gemini Ultra

- **代码生成组** (code_generation)
  - 优先选择代码能力强的模型
  - 适用于：编程任务、代码审查、技术文档
  - 推荐模型：Claude Sonnet, GPT-4 Turbo, Codex

- **创意写作组** (creative_writing)
  - 优先选择创造力强的模型
  - 适用于：文案创作、故事编写、内容生成
  - 推荐模型：Claude Creative, GPT-4, Gemini Pro

- **成本优化组** (cost_optimized)
  - 优先选择性价比高的模型
  - 适用于：批量处理、非关键任务
  - 推荐模型：Claude Haiku, GPT-3.5 Turbo

### 2. 自定义分组
用户可以创建自己的分组：

```typescript
interface ModelPreferenceGroup {
  id: string
  name: string              // 用户定义的组名
  description?: string      // 组描述
  model_ids: string[]      // 按优先级排序的模型ID列表
  is_preset?: boolean      // 是否为预设组
  created_at?: string
  updated_at?: string
}
```

### 3. 分组管理功能

#### 创建分组
- 输入组名和描述
- 选择并排序模型
- 保存到用户/工作空间偏好

#### 切换分组
- 快速切换按钮或下拉菜单
- 立即应用新的模型优先级
- 记住上次使用的分组

#### 编辑分组
- 修改组名和描述
- 调整模型列表和顺序
- 删除不需要的分组

### 4. UI 设计建议

#### 分组选择器
```tsx
<Select value={currentGroup} onValueChange={setCurrentGroup}>
  <SelectTrigger>
    <SelectValue placeholder="选择模型组" />
  </SelectTrigger>
  <SelectContent>
    <SelectGroup>
      <SelectLabel>预设分组</SelectLabel>
      <SelectItem value="quick_response">快速响应</SelectItem>
      <SelectItem value="deep_analysis">深度分析</SelectItem>
      <SelectItem value="code_generation">代码生成</SelectItem>
    </SelectGroup>
    <SelectSeparator />
    <SelectGroup>
      <SelectLabel>自定义分组</SelectLabel>
      <SelectItem value="custom_1">我的工作组</SelectItem>
      <SelectItem value="custom_2">周末项目组</SelectItem>
    </SelectGroup>
  </SelectContent>
</Select>
```

#### 分组管理界面
- 卡片式布局展示所有分组
- 每个卡片显示：
  - 组名和描述
  - 包含的模型列表
  - 编辑/删除按钮
  - 设为默认按钮

### 5. 数据存储结构

在 preferences 中存储：
```json
{
  "model_priority": ["model_id_1", "model_id_2"],  // 当前激活的优先级
  "active_group_id": "quick_response",              // 当前激活的分组
  "model_groups": [
    {
      "id": "custom_1",
      "name": "我的工作组",
      "description": "日常工作使用",
      "model_ids": ["model_id_3", "model_id_1"],
      "created_at": "2024-01-01T00:00:00Z"
    }
  ]
}
```

### 6. 实现优先级

#### 第一阶段：基础功能
1. 保持现有的单一优先级列表
2. 添加预设分组的快速应用功能
3. 不存储自定义分组

#### 第二阶段：完整功能
1. 支持创建和保存自定义分组
2. 添加分组管理界面
3. 支持分组的导入/导出

#### 第三阶段：高级功能
1. 基于使用场景自动推荐分组
2. 分组使用统计和分析
3. 团队分组共享功能

## 用户故事

1. **作为开发者**，我想要在编写代码时使用代码生成组，在写文档时切换到创意写作组。

2. **作为项目经理**，我想要为团队设置默认的模型分组，确保团队使用合适的模型。

3. **作为预算管理者**，我想要在非关键任务时使用成本优化组，控制API使用成本。

4. **作为研究员**，我想要创建专门的研究分组，包含最强大的分析模型。

## 技术实现要点

1. **分组切换**应该是即时的，不需要保存操作
2. **预设分组**应该根据实际可用的模型动态调整
3. **分组数据**应该支持版本控制和回滚
4. **权限控制**：个人分组 vs 工作空间分组的管理权限