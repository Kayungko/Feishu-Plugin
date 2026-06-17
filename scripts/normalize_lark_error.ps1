param(
  [string]$Message = "",
  [string]$JsonPath = "",
  [string]$Operation = "",
  [string]$Target = ""
)

if (-not [string]::IsNullOrWhiteSpace($JsonPath) -and (Test-Path -LiteralPath $JsonPath)) {
  $Message = Get-Content -Raw -LiteralPath $JsonPath
}

$text = [string]$Message
$lower = $text.ToLowerInvariant()

$category = "unknown"
$severity = "medium"
$userMessage = "操作失败，但错误类型未识别。"
$fixes = @(
  "保留原始错误信息。",
  "确认链接、权限、登录状态后重试。"
)

if ($lower -match "confirmation_required") {
  $category = "confirmation-required"
  $severity = "high"
  $userMessage = "这是写操作或高风险操作，需要你明确确认后才能执行。"
  $fixes = @("检查预览内容。", "确认目标、影响范围和是否通知他人。", '明确回复"确认执行"后再继续。')
} elseif ($lower -match "missing-project-config|project api configuration is incomplete|feishu_project") {
  $category = "project-config-missing"
  $severity = "medium"
  $userMessage = "飞书项目 OpenAPI 配置不完整，无法读取或修改项目需求单。"
  $fixes = @("从 templates\\feishu-project.config.example.json 复制配置模板。", "补充 Project pluginId/pluginSecret/authPath 或 pluginAccessToken。", "重新运行 scripts\\get_feishu_project_config.ps1 验证。")
} elseif ($lower -match "permission|forbidden|access denied|no permission|无权限|没有权限|403") {
  $category = "permission-denied"
  $severity = "medium"
  $userMessage = "当前身份没有访问权限。"
  $fixes = @("确认你能在浏览器打开目标链接。", "让资源所有者给当前飞书账号授权。", "确认 CLI 当前身份是否是你本人。")
} elseif ($lower -match "unauthorized|token expired|invalid token|needs_refresh|auth|未登录|登录|401") {
  $category = "auth-required"
  $severity = "medium"
  $userMessage = "飞书登录或 token 状态异常。"
  $fixes = @("运行 lark-cli auth status --verify。", "如仍失败，运行 lark-cli auth login 重新登录。", "确认使用的是 user 身份还是 bot 身份。")
} elseif ($lower -match "missing scope|scope|权限范围|99991663") {
  $category = "scope-missing"
  $severity = "medium"
  $userMessage = "当前授权缺少这个操作需要的 scope。"
  $fixes = @("查看 CLI 错误里的 missing scope。", "按提示用最小 scope 重新登录。", "如果是企业应用能力，确认管理员已授权对应权限。")
} elseif ($lower -match "not found|404|不存在|找不到") {
  $category = "not-found"
  $severity = "low"
  $userMessage = "目标资源不存在，或当前身份无法看到它。"
  $fixes = @("检查链接或 token 是否复制完整。", "确认资源没有被删除或移动。", "确认当前账号有可见权限。")
} elseif ($lower -match "rate limit|too many requests|429|频率") {
  $category = "rate-limited"
  $severity = "low"
  $userMessage = "请求频率过高，被服务端限流。"
  $fixes = @("稍后重试。", "减少批量请求数量。", "必要时分批执行。")
} elseif ($lower -match "network|timeout|etimedout|econnreset|连接|超时") {
  $category = "network"
  $severity = "low"
  $userMessage = "网络或服务连接异常。"
  $fixes = @("稍后重试。", "确认网络和代理状态。", "如果持续失败，运行 lark-cli doctor。")
} elseif ($lower -match "lark-cli-not-found|not recognized|无法将.*lark-cli|不是内部或外部命令") {
  $category = "cli-missing"
  $severity = "high"
  $userMessage = "本机没有可用的 lark-cli。"
  $fixes = @("安装 @larksuite/cli。", "确认 npm 全局 bin 在 PATH 中。", "安装后重新打开终端或 Codex。")
}

[pscustomobject]@{
  ok = $false
  category = $category
  severity = $severity
  operation = $Operation
  target = $Target
  userMessage = $userMessage
  recommendedFixes = $fixes
  raw = $Message
} | ConvertTo-Json -Depth 8
