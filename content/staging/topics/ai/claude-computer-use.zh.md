---
title: Claude Computer Use 深度解析
description: 全面解析 Claude 的计算机使用能力 - 让 AI 能够与桌面应用程序交互
track: ai
section: agents
difficulty: advanced
tags:
  - Claude
  - Anthropic
  - Computer Use
  - AI Agent
  - 自动化
status: imported
origin: old/src/content/docs/ai/claude-computer-use.zh.md
divergence: 0.218
issues: []
legacy:
  category: AI
  subcategory: LLM
  order: 62
  lastUpdated: 2026-01-20
---

Claude Computer Use 是 Anthropic 推出的开创性功能，使 Claude 能够像人类用户一样与桌面环境进行交互。通过结合截图分析与鼠标键盘控制，Claude 可以自主导航应用程序、填写表单、浏览网页，并完成复杂的多步骤工作流程。本指南涵盖从基础概念到生产级实现的所有内容。

## 理解 Computer Use

### 什么是 Computer Use？

Computer Use 是一项 Beta 功能，允许 Claude 查看和操作计算机屏幕。与处理文本和结构化数据的传统 API 不同，Computer Use 使 Claude 能够：

- **查看屏幕**：捕获并分析截图，理解当前显示的内容
- **控制鼠标**：点击、拖拽、滚动和移动光标
- **使用键盘**：输入文本和执行键盘快捷键
- **自动化工作流**：将多个操作串联起来完成复杂任务

这一能力将 Claude 从对话式 AI 转变为能够操作任何图形界面软件的自主代理。

### 为什么 Computer Use 很重要

传统自动化方法需要：
- 为每个应用程序进行自定义 API 集成
- 当 UI 变化时容易失效的脚本化工作流
- 维护自动化脚本所需的技术专业知识

Computer Use 解决了这些问题：
- 可与任何具有可视界面的应用程序配合使用
- 通过视觉理解适应 UI 变化
- 使非技术用户也能自动化复杂任务
- 通过推理而非硬编码逻辑处理边缘情况

### 发布背景

Anthropic 推出 Computer Use 作为 Beta 功能，旨在使 AI 代理能够与桌面环境交互。该功能经历了多个版本的演进：

| 版本 | Beta 标志 | 支持模型 |
|------|-----------|----------|
| `computer_20251124` | `computer-use-2025-11-24` | Claude Opus 4.5 |
| `computer_20250124` | `computer-use-2025-01-24` | Claude Sonnet 4.5、Haiku 4.5、Opus 4.1、Sonnet 4、Opus 4 |

每个版本在其模型系列内引入增强功能，同时保持向后兼容性。

## 核心架构

### Computer Use 工作原理

Computer Use 系统通过代理循环（Agent Loop）在 Claude 和计算环境之间进行协调：

```
┌─────────────────────────────────────────────────────────────────┐
│                        代理循环                                  │
│  ┌─────────┐    ┌─────────┐    ┌──────────────┐    ┌────────┐  │
│  │  用户   │───>│  Claude │───>│    工具      │───>│  VM/   │  │
│  │  提示   │    │   API   │    │   执行器     │    │ 容器   │  │
│  └─────────┘    └────┬────┘    └──────┬───────┘    └────┬───┘  │
│                      │                │                  │      │
│                      │<───────────────┘<─────────────────┘      │
│                      │         (工具结果 + 截图)                 │
└─────────────────────────────────────────────────────────────────┘
```

**步骤 1：工具定义和用户提示**
您的应用程序向 Claude 发送包含 computer use 工具定义和用户任务的请求。

**步骤 2：Claude 分析并决策**
Claude 检查提供的截图并确定要采取的操作。如果需要操作，Claude 返回 `tool_use` 响应。

**步骤 3：工具执行**
您的应用程序提取请求的操作，在计算环境中执行，并捕获结果（通常是新的截图）。

**步骤 4：迭代**
结果被发送回 Claude，Claude 继续分析并请求操作，直到任务完成。

### 计算环境

Computer Use 需要一个沙盒化的计算环境，让 Claude 能够安全地与应用程序交互：

```python
# 典型环境组件
ENVIRONMENT_COMPONENTS = {
    "virtual_display": "Xvfb（X 虚拟帧缓冲区）",
    "desktop_environment": "轻量级窗口管理器 (Mutter) + 面板 (Tint2)",
    "applications": ["Firefox", "LibreOffice", "文件管理器", "终端"],
    "tool_implementations": "鼠标/键盘/截图的 Python 处理程序",
    "agent_loop": "Claude 与环境之间的通信桥梁"
}
```

Claude 从不直接连接到环境。您的应用程序：
1. 接收 Claude 的工具使用请求
2. 将其转换为实际操作
3. 捕获结果（截图、命令输出）
4. 将结果返回给 Claude

## 工具定义和操作

### Computer Use 工具模式

computer use 工具使用特殊的无模式格式定义：

```python
import anthropic

client = anthropic.Anthropic()

# Claude Sonnet 4.5 及其他模型的工具定义
computer_tool = {
    "type": "computer_20250124",
    "name": "computer",
    "display_width_px": 1024,
    "display_height_px": 768,
    "display_number": 1,  # 可选：X11 显示编号
}

# Claude Opus 4.5 带缩放功能的工具定义
computer_tool_opus = {
    "type": "computer_20251124",
    "name": "computer",
    "display_width_px": 1024,
    "display_height_px": 768,
    "display_number": 1,
    "enable_zoom": True,  # 启用缩放操作以进行详细检查
}
```

### 支持的操作

**基础操作（所有版本）**

| 操作 | 描述 | 参数 |
|------|------|------|
| `screenshot` | 捕获当前显示 | 无 |
| `left_click` | 在指定位置点击 | `coordinate: [x, y]` |
| `type` | 输入文本字符串 | `text: string` |
| `key` | 按下键盘组合键 | `text: string`（如 "ctrl+s"） |
| `mouse_move` | 移动光标 | `coordinate: [x, y]` |

**增强操作（computer_20250124）**

| 操作 | 描述 | 参数 |
|------|------|------|
| `scroll` | 带方向的滚动 | `coordinate`、`scroll_direction`、`scroll_amount` |
| `left_click_drag` | 点击并拖拽 | `start_coordinate`、`coordinate` |
| `right_click` | 右键点击 | `coordinate: [x, y]` |
| `middle_click` | 中键点击 | `coordinate: [x, y]` |
| `double_click` | 双击 | `coordinate: [x, y]` |
| `triple_click` | 三击 | `coordinate: [x, y]` |
| `left_mouse_down` | 按住鼠标 | `coordinate: [x, y]` |
| `left_mouse_up` | 释放鼠标 | `coordinate: [x, y]` |
| `hold_key` | 按住键一段时间 | `text: string`、`duration: seconds` |
| `wait` | 暂停执行 | `duration: seconds` |

**Opus 4.5 独有操作（computer_20251124）**

| 操作 | 描述 | 参数 |
|------|------|------|
| `zoom` | 以全分辨率查看区域 | `region: [x1, y1, x2, y2]` |

### 操作示例

```python
# 截取屏幕
screenshot_action = {
    "action": "screenshot"
}

# 在特定位置点击
click_action = {
    "action": "left_click",
    "coordinate": [500, 300]
}

# 输入文本
type_action = {
    "action": "type",
    "text": "Hello, World!"
}

# 按下键盘快捷键
key_action = {
    "action": "key",
    "text": "ctrl+s"
}

# 向下滚动
scroll_action = {
    "action": "scroll",
    "coordinate": [500, 400],
    "scroll_direction": "down",
    "scroll_amount": 3
}

# 从一点拖拽到另一点
drag_action = {
    "action": "left_click_drag",
    "start_coordinate": [100, 100],
    "coordinate": [300, 300]
}

# Shift+点击进行范围选择
modifier_click = {
    "action": "left_click",
    "coordinate": [500, 300],
    "text": "shift"  # 修饰键
}

# 缩放到某个区域（仅 Opus 4.5）
zoom_action = {
    "action": "zoom",
    "region": [100, 200, 400, 350]  # [x1, y1, x2, y2]
}
```

## 完整实现

### 基础 API 请求

```python
import anthropic
import base64

client = anthropic.Anthropic()

def make_computer_use_request(user_prompt: str):
    """发起基础的 computer use 请求。"""
    response = client.beta.messages.create(
        model="claude-sonnet-4-5",
        max_tokens=1024,
        tools=[
            {
                "type": "computer_20250124",
                "name": "computer",
                "display_width_px": 1024,
                "display_height_px": 768,
                "display_number": 1,
            },
            {
                "type": "text_editor_20250728",
                "name": "str_replace_based_edit_tool"
            },
            {
                "type": "bash_20250124",
                "name": "bash"
            }
        ],
        messages=[{"role": "user", "content": user_prompt}],
        betas=["computer-use-2025-01-24"]
    )
    return response

# 使用示例
response = make_computer_use_request("打开 Firefox 并搜索 'Python 教程'")
print(response)
```

### 完整代理循环实现

```python
import anthropic
import base64
import subprocess
import time
from typing import Any
from dataclasses import dataclass

@dataclass
class ComputerEnvironment:
    """管理虚拟显示环境。"""
    width: int = 1024
    height: int = 768
    display_number: int = 1

    def capture_screenshot(self) -> str:
        """捕获截图并返回 base64 编码的图像。"""
        # 使用 scrot 或类似工具捕获 X11 显示
        screenshot_path = "/tmp/screenshot.png"
        subprocess.run([
            "scrot", "-o", screenshot_path,
            "-d", str(self.display_number)
        ], check=True)

        with open(screenshot_path, "rb") as f:
            return base64.standard_b64encode(f.read()).decode("utf-8")

    def click(self, x: int, y: int, button: str = "left"):
        """在坐标处执行鼠标点击。"""
        button_map = {"left": "1", "middle": "2", "right": "3"}
        subprocess.run([
            "xdotool", "mousemove", str(x), str(y),
            "click", button_map.get(button, "1")
        ], check=True)

    def type_text(self, text: str):
        """使用键盘输入文本。"""
        subprocess.run(["xdotool", "type", "--", text], check=True)

    def press_key(self, key: str):
        """按下键或键组合。"""
        subprocess.run(["xdotool", "key", key], check=True)

    def scroll(self, x: int, y: int, direction: str, amount: int):
        """在指定位置滚动。"""
        subprocess.run(["xdotool", "mousemove", str(x), str(y)], check=True)
        button = "4" if direction == "up" else "5"
        for _ in range(amount):
            subprocess.run(["xdotool", "click", button], check=True)

    def mouse_move(self, x: int, y: int):
        """移动鼠标到指定位置。"""
        subprocess.run(["xdotool", "mousemove", str(x), str(y)], check=True)

    def drag(self, start_x: int, start_y: int, end_x: int, end_y: int):
        """从起点拖拽到终点。"""
        subprocess.run([
            "xdotool", "mousemove", str(start_x), str(start_y),
            "mousedown", "1",
            "mousemove", str(end_x), str(end_y),
            "mouseup", "1"
        ], check=True)


class ComputerUseAgent:
    """执行 computer use 任务的代理。"""

    def __init__(self, model: str = "claude-sonnet-4-5"):
        self.client = anthropic.Anthropic()
        self.model = model
        self.env = ComputerEnvironment()
        self.beta_flag = "computer-use-2025-01-24"
        self.tool_version = "computer_20250124"

    def get_tools(self) -> list:
        """返回工具定义。"""
        return [
            {
                "type": self.tool_version,
                "name": "computer",
                "display_width_px": self.env.width,
                "display_height_px": self.env.height,
                "display_number": self.env.display_number,
            },
            {
                "type": "text_editor_20250728",
                "name": "str_replace_based_edit_tool"
            },
            {
                "type": "bash_20250124",
                "name": "bash"
            }
        ]

    def execute_action(self, action: dict) -> dict:
        """执行计算机操作并返回结果。"""
        action_type = action.get("action")

        try:
            if action_type == "screenshot":
                screenshot = self.env.capture_screenshot()
                return {
                    "type": "image",
                    "source": {
                        "type": "base64",
                        "media_type": "image/png",
                        "data": screenshot
                    }
                }

            elif action_type == "left_click":
                x, y = action["coordinate"]
                modifier = action.get("text")
                if modifier:
                    self.env.press_key(f"{modifier}+")
                self.env.click(x, y, "left")

            elif action_type == "right_click":
                x, y = action["coordinate"]
                self.env.click(x, y, "right")

            elif action_type == "middle_click":
                x, y = action["coordinate"]
                self.env.click(x, y, "middle")

            elif action_type == "double_click":
                x, y = action["coordinate"]
                self.env.click(x, y, "left")
                time.sleep(0.1)
                self.env.click(x, y, "left")

            elif action_type == "triple_click":
                x, y = action["coordinate"]
                for _ in range(3):
                    self.env.click(x, y, "left")
                    time.sleep(0.05)

            elif action_type == "type":
                self.env.type_text(action["text"])

            elif action_type == "key":
                self.env.press_key(action["text"])

            elif action_type == "mouse_move":
                x, y = action["coordinate"]
                self.env.mouse_move(x, y)

            elif action_type == "scroll":
                x, y = action["coordinate"]
                direction = action["scroll_direction"]
                amount = action.get("scroll_amount", 3)
                self.env.scroll(x, y, direction, amount)

            elif action_type == "left_click_drag":
                start_x, start_y = action["start_coordinate"]
                end_x, end_y = action["coordinate"]
                self.env.drag(start_x, start_y, end_x, end_y)

            elif action_type == "wait":
                duration = action.get("duration", 1)
                time.sleep(duration)

            else:
                return {"error": f"未知操作: {action_type}"}

            # 操作后返回截图
            time.sleep(0.5)  # 等待 UI 更新
            screenshot = self.env.capture_screenshot()
            return {
                "type": "image",
                "source": {
                    "type": "base64",
                    "media_type": "image/png",
                    "data": screenshot
                }
            }

        except Exception as e:
            return {"error": str(e)}

    def run(self, user_prompt: str, max_iterations: int = 20) -> str:
        """运行代理循环直到任务完成。"""
        messages = [{"role": "user", "content": user_prompt}]

        for iteration in range(max_iterations):
            print(f"迭代 {iteration + 1}/{max_iterations}")

            # 调用 Claude API
            response = self.client.beta.messages.create(
                model=self.model,
                max_tokens=4096,
                tools=self.get_tools(),
                messages=messages,
                betas=[self.beta_flag]
            )

            # 将助手响应添加到历史记录
            messages.append({
                "role": "assistant",
                "content": response.content
            })

            # 检查工具使用
            tool_results = []
            for block in response.content:
                if block.type == "tool_use":
                    if block.name == "computer":
                        result = self.execute_action(block.input)
                    else:
                        # 处理其他工具（bash、text_editor）
                        result = self.execute_other_tool(block.name, block.input)

                    tool_results.append({
                        "type": "tool_result",
                        "tool_use_id": block.id,
                        "content": [result] if isinstance(result, dict) else result
                    })

            # 如果没有使用工具，任务完成
            if not tool_results:
                # 提取最终文本响应
                for block in response.content:
                    if hasattr(block, "text"):
                        return block.text
                return "任务完成"

            # 将工具结果添加到消息
            messages.append({
                "role": "user",
                "content": tool_results
            })

        return "达到最大迭代次数"

    def execute_other_tool(self, name: str, input_data: dict) -> Any:
        """执行 bash 或 text editor 工具。"""
        if name == "bash":
            result = subprocess.run(
                input_data.get("command", ""),
                shell=True,
                capture_output=True,
                text=True
            )
            return result.stdout + result.stderr

        elif name == "str_replace_based_edit_tool":
            # 实现文件编辑逻辑
            pass

        return {"error": f"未知工具: {name}"}


# 使用示例
if __name__ == "__main__":
    agent = ComputerUseAgent()
    result = agent.run("打开 Firefox，访问 github.com，然后截图")
    print(f"结果: {result}")
```

### 支持思考功能的异步实现

```python
import anthropic
import asyncio
from typing import Optional

class AsyncComputerUseAgent:
    """支持思考能力的异步代理。"""

    def __init__(
        self,
        model: str = "claude-sonnet-4-5",
        thinking_budget: Optional[int] = None
    ):
        self.client = anthropic.AsyncAnthropic()
        self.model = model
        self.thinking_budget = thinking_budget
        self.beta_flag = "computer-use-2025-01-24"

    async def run(
        self,
        user_prompt: str,
        max_iterations: int = 20
    ) -> str:
        """运行异步代理循环。"""
        messages = [{"role": "user", "content": user_prompt}]

        # 如果启用则配置思考功能
        thinking_config = None
        if self.thinking_budget:
            thinking_config = {
                "type": "enabled",
                "budget_tokens": self.thinking_budget
            }

        for iteration in range(max_iterations):
            # 构建请求参数
            params = {
                "model": self.model,
                "max_tokens": 4096,
                "tools": self.get_tools(),
                "messages": messages,
                "betas": [self.beta_flag]
            }

            if thinking_config:
                params["thinking"] = thinking_config

            # 调用 Claude API
            response = await self.client.beta.messages.create(**params)

            # 处理思考块（如果存在）
            for block in response.content:
                if block.type == "thinking":
                    print(f"[思考] {block.thinking}")

            # 将响应添加到历史记录
            messages.append({
                "role": "assistant",
                "content": response.content
            })

            # 处理工具调用
            tool_results = []
            for block in response.content:
                if block.type == "tool_use":
                    result = await self.execute_action_async(block.input)
                    tool_results.append({
                        "type": "tool_result",
                        "tool_use_id": block.id,
                        "content": [result]
                    })

            if not tool_results:
                for block in response.content:
                    if hasattr(block, "text"):
                        return block.text
                return "任务完成"

            messages.append({
                "role": "user",
                "content": tool_results
            })

        return "达到最大迭代次数"

    def get_tools(self) -> list:
        """返回工具定义。"""
        return [
            {
                "type": "computer_20250124",
                "name": "computer",
                "display_width_px": 1024,
                "display_height_px": 768,
            }
        ]

    async def execute_action_async(self, action: dict) -> dict:
        """异步执行操作。"""
        # 在执行器中运行阻塞操作
        loop = asyncio.get_event_loop()
        return await loop.run_in_executor(
            None,
            self.execute_action_sync,
            action
        )

    def execute_action_sync(self, action: dict) -> dict:
        """同步操作执行。"""
        # 实现类似于前面的示例
        pass


# 启用思考功能的使用示例
async def main():
    agent = AsyncComputerUseAgent(
        model="claude-sonnet-4-5",
        thinking_budget=2048
    )
    result = await agent.run(
        "导航到维基百科并查找关于 Python 编程的信息"
    )
    print(result)

asyncio.run(main())
```

## 安全最佳实践

### 关键安全考虑

Computer Use 引入了独特的安全风险，需要仔细缓解：

```python
class SecurityConfig:
    """computer use 的安全配置。"""

    # 环境隔离
    USE_CONTAINER = True
    USE_VM = True
    MINIMAL_PRIVILEGES = True

    # 网络限制
    ALLOWED_DOMAINS = [
        "*.wikipedia.org",
        "*.github.com",
        "*.python.org"
    ]
    BLOCK_OUTBOUND = False

    # 数据保护
    NO_SENSITIVE_DATA = True
    NO_CREDENTIALS_IN_PROMPT = False  # 使用安全的凭据注入

    # 人工监督
    REQUIRE_CONFIRMATION_FOR = [
        "financial_transactions",  # 金融交易
        "account_creation",        # 账户创建
        "terms_acceptance",        # 条款接受
        "file_deletion",           # 文件删除
        "system_settings"          # 系统设置
    ]
```

### 实现安全环境

```python
import docker
from typing import List, Optional

class SecureComputerEnvironment:
    """基于 Docker 的安全 computer use 环境。"""

    def __init__(
        self,
        allowed_domains: Optional[List[str]] = None,
        enable_network: bool = True
    ):
        self.client = docker.from_env()
        self.allowed_domains = allowed_domains or []
        self.enable_network = enable_network
        self.container = None

    def start(self):
        """启动安全容器。"""
        # 构建网络配置
        network_mode = "bridge" if self.enable_network else "none"

        # 配置域名过滤的 iptables 规则
        iptables_rules = self._generate_iptables_rules()

        self.container = self.client.containers.run(
            "anthropic/computer-use-demo:latest",
            detach=True,
            remove=True,
            environment={
                "DISPLAY": ":1",
                "ALLOWED_DOMAINS": ",".join(self.allowed_domains)
            },
            network_mode=network_mode,
            cap_drop=["ALL"],  # 删除所有能力
            cap_add=["SYS_PTRACE"],  # 仅添加必要的能力
            security_opt=["no-new-privileges:true"],
            read_only=False,  # 临时文件需要写入权限
            tmpfs={"/tmp": "size=100M"},
            mem_limit="2g",
            cpu_period=100000,
            cpu_quota=50000,  # 50% CPU 限制
        )

        return self.container.id

    def _generate_iptables_rules(self) -> str:
        """生成域名过滤的 iptables 规则。"""
        rules = []
        for domain in self.allowed_domains:
            rules.append(f"-A OUTPUT -d {domain} -j ACCEPT")
        rules.append("-A OUTPUT -j DROP")  # 阻止所有其他出站流量
        return "\n".join(rules)

    def stop(self):
        """停止并移除容器。"""
        if self.container:
            self.container.stop()
            self.container = None

    def execute(self, action: dict) -> dict:
        """在容器中执行操作。"""
        if not self.container:
            raise RuntimeError("容器未启动")

        # 通过容器 exec 执行操作
        exit_code, output = self.container.exec_run(
            f"python /app/execute_action.py '{json.dumps(action)}'"
        )

        return json.loads(output.decode())
```

### 人工确认机制

```python
class ConfirmationGate:
    """对敏感操作要求人工确认。"""

    SENSITIVE_ACTIONS = {
        "financial": ["pay", "transfer", "purchase", "buy", "checkout", "支付", "转账", "购买"],
        "authentication": ["login", "sign in", "password", "credential", "登录", "密码"],
        "destructive": ["delete", "remove", "format", "clear", "删除", "移除", "格式化"],
        "consent": ["agree", "accept terms", "cookie", "privacy", "同意", "接受条款", "隐私"]
    }

    def __init__(self, callback=None):
        self.callback = callback or self._default_confirm

    def check_action(self, action: dict, context: str) -> bool:
        """检查操作是否需要确认。"""
        action_type = action.get("action", "")
        text = action.get("text", "").lower()

        for category, keywords in self.SENSITIVE_ACTIONS.items():
            if any(kw in text or kw in context.lower() for kw in keywords):
                return self.callback(
                    action=action,
                    category=category,
                    reason=f"操作可能涉及{category}操作"
                )

        return True

    def _default_confirm(self, action: dict, category: str, reason: str) -> bool:
        """通过控制台进行默认确认。"""
        print(f"\n{'='*50}")
        print(f"需要确认: {category.upper()}")
        print(f"原因: {reason}")
        print(f"操作: {action}")
        print(f"{'='*50}")

        response = input("允许此操作？(yes/no): ")
        return response.lower() in ("yes", "y", "是")
```

### 提示注入防御

```python
class PromptInjectionDefense:
    """检测和缓解提示注入尝试。"""

    SUSPICIOUS_PATTERNS = [
        r"ignore previous instructions",
        r"disregard.*system prompt",
        r"you are now",
        r"new instructions:",
        r"override.*settings",
        r"<\|.*\|>",  # Token 操纵尝试
        r"```system",
        r"忽略之前的指令",
        r"新的指令",
    ]

    def __init__(self):
        import re
        self.patterns = [re.compile(p, re.IGNORECASE)
                       for p in self.SUSPICIOUS_PATTERNS]

    def check_screenshot(self, screenshot_text: str) -> dict:
        """检查截图文本中的注入尝试。"""
        findings = []

        for pattern in self.patterns:
            matches = pattern.findall(screenshot_text)
            if matches:
                findings.append({
                    "pattern": pattern.pattern,
                    "matches": matches
                })

        if findings:
            return {
                "safe": False,
                "findings": findings,
                "recommendation": "在继续之前请求用户确认"
            }

        return {"safe": True, "findings": []}

    def sanitize_response(self, response: str) -> str:
        """清理可能被注入的内容。"""
        # 从响应中移除可疑模式
        sanitized = response
        for pattern in self.patterns:
            sanitized = pattern.sub("[已删除]", sanitized)
        return sanitized
```

## 常见陷阱和解决方案

### 坐标缩放问题

处理高分辨率显示器时，坐标必须正确缩放：

```python
import math

class CoordinateScaler:
    """处理不同分辨率的坐标缩放。"""

    # API 约束
    MAX_LONG_EDGE = 1568
    MAX_TOTAL_PIXELS = 1_150_000

    def __init__(self, screen_width: int, screen_height: int):
        self.screen_width = screen_width
        self.screen_height = screen_height
        self.scale = self._calculate_scale()

    def _calculate_scale(self) -> float:
        """计算满足 API 约束的缩放因子。"""
        long_edge = max(self.screen_width, self.screen_height)
        total_pixels = self.screen_width * self.screen_height

        long_edge_scale = self.MAX_LONG_EDGE / long_edge
        total_pixels_scale = math.sqrt(self.MAX_TOTAL_PIXELS / total_pixels)

        return min(1.0, long_edge_scale, total_pixels_scale)

    def get_scaled_dimensions(self) -> tuple:
        """获取发送给 API 的截图尺寸。"""
        return (
            int(self.screen_width * self.scale),
            int(self.screen_height * self.scale)
        )

    def scale_coordinates_to_screen(self, x: int, y: int) -> tuple:
        """将 Claude 的坐标转换为实际屏幕坐标。"""
        return (
            int(x / self.scale),
            int(y / self.scale)
        )

    def scale_coordinates_from_screen(self, x: int, y: int) -> tuple:
        """将屏幕坐标转换为 API 坐标。"""
        return (
            int(x * self.scale),
            int(y * self.scale)
        )


# 使用示例
scaler = CoordinateScaler(1920, 1080)
print(f"缩放因子: {scaler.scale}")  # ~0.82
print(f"缩放后尺寸: {scaler.get_scaled_dimensions()}")  # (1574, 886)

# 当 Claude 返回坐标 (500, 300) 时
screen_x, screen_y = scaler.scale_coordinates_to_screen(500, 300)
print(f"实际屏幕位置: ({screen_x}, {screen_y})")  # (609, 366)
```

### 截图时机问题

UI 元素可能在操作后不会立即准备好：

```python
import time
from typing import Callable, Optional

class ActionExecutor:
    """带有适当时机的操作执行器。"""

    DEFAULT_DELAYS = {
        "left_click": 0.3,
        "type": 0.5,
        "key": 0.3,
        "scroll": 0.2,
        "page_load": 2.0,
        "dialog": 0.5,
    }

    def __init__(self, delays: Optional[dict] = None):
        self.delays = {**self.DEFAULT_DELAYS, **(delays or {})}

    def execute_with_delay(
        self,
        action_func: Callable,
        action_type: str,
        wait_for: Optional[Callable[[], bool]] = None
    ):
        """执行操作并等待适当的延迟。"""
        action_func()

        # 如果提供了自定义等待条件则使用
        if wait_for:
            timeout = 10
            start = time.time()
            while not wait_for() and time.time() - start < timeout:
                time.sleep(0.1)
        else:
            # 使用默认延迟
            delay = self.delays.get(action_type, 0.3)
            time.sleep(delay)

    def wait_for_element(
        self,
        screenshot_func: Callable,
        element_detector: Callable,
        timeout: float = 10.0
    ) -> bool:
        """等待元素出现在截图中。"""
        start = time.time()
        while time.time() - start < timeout:
            screenshot = screenshot_func()
            if element_detector(screenshot):
                return True
            time.sleep(0.5)
        return False
```

### 处理不可靠的 UI 元素

某些 UI 元素对 Claude 来说很难交互：

```python
class UIInteractionHelper:
    """处理棘手 UI 元素的辅助方法。"""

    @staticmethod
    def select_dropdown_by_keyboard(
        env,
        dropdown_coords: tuple,
        option_text: str
    ):
        """使用键盘导航选择下拉选项。"""
        # 点击打开下拉菜单
        env.click(*dropdown_coords)
        time.sleep(0.3)

        # 输入以过滤/搜索
        env.type_text(option_text)
        time.sleep(0.2)

        # 按 Enter 选择
        env.press_key("Return")

    @staticmethod
    def scroll_into_view(
        env,
        target_y: int,
        viewport_height: int,
        scroll_x: int = 500
    ):
        """滚动使目标进入视图。"""
        current_scroll = 0
        max_scrolls = 20

        for _ in range(max_scrolls):
            if current_scroll <= target_y <= current_scroll + viewport_height:
                return True

            if target_y > current_scroll + viewport_height:
                env.scroll(scroll_x, viewport_height // 2, "down", 3)
                current_scroll += 100  # 大约滚动量
            else:
                env.scroll(scroll_x, viewport_height // 2, "up", 3)
                current_scroll -= 100

            time.sleep(0.3)

        return False

    @staticmethod
    def reliable_text_selection(env, start: tuple, end: tuple):
        """使用三击或 shift-点击进行可靠的文本选择。"""
        # 选项 1：三击选择整行
        env.click(*start, "left")
        time.sleep(0.05)
        env.click(*start, "left")
        time.sleep(0.05)
        env.click(*start, "left")

        # 选项 2：点击然后 shift-点击选择范围
        # env.click(*start, "left")
        # time.sleep(0.1)
        # env.press_key("shift")
        # env.click(*end, "left")
```

## 性能优化

### 截图优化

```python
from PIL import Image
import io
import base64

class ScreenshotOptimizer:
    """优化截图以加快 API 调用。"""

    def __init__(
        self,
        max_width: int = 1280,
        max_height: int = 800,
        quality: int = 85,
        format: str = "JPEG"
    ):
        self.max_width = max_width
        self.max_height = max_height
        self.quality = quality
        self.format = format

    def optimize(self, screenshot_bytes: bytes) -> str:
        """优化截图并返回 base64。"""
        img = Image.open(io.BytesIO(screenshot_bytes))

        # 如果需要则调整大小
        if img.width > self.max_width or img.height > self.max_height:
            img.thumbnail((self.max_width, self.max_height), Image.LANCZOS)

        # 如有必要转换为 RGB（用于 JPEG）
        if self.format == "JPEG" and img.mode in ("RGBA", "P"):
            img = img.convert("RGB")

        # 压缩
        buffer = io.BytesIO()
        img.save(buffer, format=self.format, quality=self.quality, optimize=True)

        return base64.standard_b64encode(buffer.getvalue()).decode("utf-8")

    def get_media_type(self) -> str:
        """返回格式的媒体类型。"""
        return f"image/{self.format.lower()}"
```

### 缓存和批处理

```python
from functools import lru_cache
import hashlib

class ActionCache:
    """缓存重复操作及其结果。"""

    def __init__(self, max_size: int = 100):
        self.cache = {}
        self.max_size = max_size

    def _make_key(self, action: dict, screenshot_hash: str) -> str:
        """从操作和截图创建缓存键。"""
        action_str = json.dumps(action, sort_keys=True)
        return hashlib.sha256(
            f"{action_str}:{screenshot_hash}".encode()
        ).hexdigest()

    def get(self, action: dict, screenshot: bytes) -> Optional[dict]:
        """如果可用则获取缓存结果。"""
        screenshot_hash = hashlib.sha256(screenshot).hexdigest()
        key = self._make_key(action, screenshot_hash)
        return self.cache.get(key)

    def set(self, action: dict, screenshot: bytes, result: dict):
        """缓存操作结果。"""
        if len(self.cache) >= self.max_size:
            # 移除最旧的条目
            oldest_key = next(iter(self.cache))
            del self.cache[oldest_key]

        screenshot_hash = hashlib.sha256(screenshot).hexdigest()
        key = self._make_key(action, screenshot_hash)
        self.cache[key] = result
```

### 速率限制和成本控制

```python
import time
from collections import deque
from threading import Lock
from dataclasses import dataclass
from datetime import datetime

@dataclass
class UsageMetrics:
    """跟踪使用指标。"""
    api_calls: int = 0
    input_tokens: int = 0
    output_tokens: int = 0
    screenshots: int = 0
    total_cost: float = 0.0

class CostController:
    """控制成本和速率限制。"""

    # 定价（每百万 tokens）
    PRICING = {
        "claude-sonnet-4-5": {"input": 3.0, "output": 15.0},
        "claude-opus-4-5": {"input": 5.0, "output": 25.0},
    }

    SCREENSHOT_TOKENS = 1334  # 每张截图大约的 tokens

    def __init__(
        self,
        model: str,
        max_cost_per_session: float = 10.0,
        max_iterations: int = 50,
        requests_per_minute: int = 30
    ):
        self.model = model
        self.max_cost = max_cost_per_session
        self.max_iterations = max_iterations
        self.rpm_limit = requests_per_minute

        self.metrics = UsageMetrics()
        self.request_times = deque()
        self.lock = Lock()

    def check_budget(self) -> bool:
        """检查是否在预算内。"""
        return self.metrics.total_cost < self.max_cost

    def check_rate_limit(self) -> float:
        """检查速率限制并在需要时返回等待时间。"""
        with self.lock:
            now = time.time()

            # 移除超过 60 秒的请求
            while self.request_times and now - self.request_times[0] > 60:
                self.request_times.popleft()

            if len(self.request_times) >= self.rpm_limit:
                wait_time = 60 - (now - self.request_times[0])
                return max(0, wait_time)

            return 0

    def record_request(self, input_tokens: int, output_tokens: int):
        """记录 API 请求并更新指标。"""
        with self.lock:
            self.request_times.append(time.time())
            self.metrics.api_calls += 1
            self.metrics.input_tokens += input_tokens
            self.metrics.output_tokens += output_tokens

            # 计算成本
            pricing = self.PRICING.get(self.model, self.PRICING["claude-sonnet-4-5"])
            cost = (
                (input_tokens / 1_000_000) * pricing["input"] +
                (output_tokens / 1_000_000) * pricing["output"]
            )
            self.metrics.total_cost += cost

    def get_summary(self) -> dict:
        """获取使用摘要。"""
        return {
            "api_calls": self.metrics.api_calls,
            "total_tokens": self.metrics.input_tokens + self.metrics.output_tokens,
            "total_cost": f"${self.metrics.total_cost:.4f}",
            "screenshots": self.metrics.screenshots
        }
```

## 实战场景

### 自动化测试

```python
class WebUITester:
    """使用 computer use 进行自动化 UI 测试。"""

    def __init__(self, agent: ComputerUseAgent):
        self.agent = agent
        self.test_results = []

    async def run_test_suite(self, tests: list) -> dict:
        """运行 UI 测试套件。"""
        results = {
            "passed": 0,
            "failed": 0,
            "errors": [],
            "details": []
        }

        for test in tests:
            try:
                result = await self.run_single_test(test)
                if result["passed"]:
                    results["passed"] += 1
                else:
                    results["failed"] += 1
                results["details"].append(result)
            except Exception as e:
                results["failed"] += 1
                results["errors"].append({
                    "test": test["name"],
                    "error": str(e)
                })

        return results

    async def run_single_test(self, test: dict) -> dict:
        """运行单个测试用例。"""
        prompt = f"""
        执行以下 UI 测试:

        测试: {test['name']}
        步骤:
        {chr(10).join(f"  {i+1}. {step}" for i, step in enumerate(test['steps']))}

        预期结果: {test['expected']}

        完成步骤后，验证预期结果并报告:
        - 如果观察到预期结果则报告 PASS
        - 如果未观察到预期结果则报告 FAIL
        - 包含截图和观察到的内容描述
        """

        result = await self.agent.run(prompt)

        return {
            "name": test["name"],
            "passed": "PASS" in result.upper(),
            "output": result
        }


# 测试套件示例
test_suite = [
    {
        "name": "登录流程",
        "steps": [
            "导航到 https://example.com/login",
            "在用户名字段中输入 'testuser'",
            "在密码字段中输入 'password123'",
            "点击登录按钮"
        ],
        "expected": "显示仪表板页面并带有欢迎消息"
    },
    {
        "name": "搜索功能",
        "steps": [
            "点击搜索图标",
            "在搜索框中输入 '测试查询'",
            "按 Enter"
        ],
        "expected": "搜索结果页面显示相关结果"
    }
]
```

### 数据录入自动化

```python
class DataEntryAutomation:
    """跨应用程序自动化数据录入。"""

    def __init__(self, agent: ComputerUseAgent):
        self.agent = agent

    async def fill_form_from_csv(
        self,
        csv_path: str,
        form_url: str,
        field_mapping: dict
    ):
        """从 CSV 数据填写网页表单。"""
        import csv

        with open(csv_path, 'r') as f:
            reader = csv.DictReader(f)
            rows = list(reader)

        results = []
        for i, row in enumerate(rows):
            # 构建自然语言指令
            field_instructions = []
            for csv_field, form_field in field_mapping.items():
                value = row.get(csv_field, "")
                if value:
                    field_instructions.append(
                        f"在 {form_field} 字段中输入 '{value}'"
                    )

            prompt = f"""
            数据录入任务 ({i+1}/{len(rows)}):

            1. 导航到 {form_url}
            2. 填写表单:
               {chr(10).join(f"   - {instr}" for instr in field_instructions)}
            3. 点击提交按钮
            4. 验证提交成功
            5. 截取确认页面的截图
            """

            result = await self.agent.run(prompt)
            results.append({
                "row": i + 1,
                "data": row,
                "result": result
            })

        return results
```

### 跨应用工作流

```python
class CrossAppWorkflow:
    """协调跨多个应用程序的工作流。"""

    def __init__(self, agent: ComputerUseAgent):
        self.agent = agent

    async def generate_report_workflow(self):
        """
        示例：从数据库生成报告，
        在电子表格中创建图表，在文档中编译。
        """
        prompt = """
        完成这个多应用程序工作流:

        1. 数据库查询:
           - 打开终端
           - 运行: psql -h localhost -U analyst -d sales
           - 执行: SELECT * FROM monthly_sales WHERE year = 2024;
           - 复制结果

        2. 电子表格分析:
           - 打开 LibreOffice Calc
           - 将数据粘贴到单元格 A1
           - 创建按月显示销售额的柱状图
           - 将图表保存为 'sales_chart.png'

        3. 文档创建:
           - 打开 LibreOffice Writer
           - 创建标题为"2024 年第四季度销售报告"的新文档
           - 插入销售图表
           - 在图表下方添加摘要段落
           - 保存为 'Q4_Report.pdf'

        4. 验证:
           - 打开文件管理器
           - 导航到文档文件夹
           - 确认 Q4_Report.pdf 存在
           - 截取最终截图
        """

        return await self.agent.run(prompt)
```

## 面试要点

### 概念问题

**问题 1：什么是 Claude Computer Use，它与 Selenium 等传统自动化工具有何不同？**

Computer Use 使 Claude 能够以视觉方式与桌面环境交互，类似于人类操作。与 Selenium 不同，Selenium 需要：
- 特定的选择器（CSS、XPath）
- 每个交互的代码
- 当 UI 变化时容易失效

Computer Use：
- 可与任何可视界面配合使用
- 通过视觉理解适应 UI 变化
- 可以处理意外对话框和边缘情况
- 通过自然语言指令操作

**问题 2：解释 Computer Use 中的代理循环架构。**

代理循环是一个周期，其中：
1. 用户提供任务和工具
2. Claude 分析当前状态（截图）
3. Claude 请求工具操作
4. 应用程序在环境中执行操作
5. 应用程序将结果（新截图）返回给 Claude
6. Claude 决定下一个操作或完成

这一过程持续进行，直到 Claude 确定任务完成或达到最大迭代次数。

**问题 3：实现 Computer Use 时有哪些关键安全考虑？**

- **隔离**：使用具有最小权限的容器/虚拟机
- **网络**：限制到允许的域名列表
- **数据**：永远不要直接暴露敏感凭据
- **人工监督**：对敏感操作要求确认
- **提示注入**：实现对截图中恶意指令的检测
- **日志记录**：维护所有操作的审计跟踪

### 技术问题

**问题 4：如何处理 4K 显示器的坐标缩放？**

```python
def scale_coordinates(api_coords, screen_width, screen_height):
    MAX_LONG_EDGE = 1568
    MAX_PIXELS = 1_150_000

    scale = min(
        1.0,
        MAX_LONG_EDGE / max(screen_width, screen_height),
        math.sqrt(MAX_PIXELS / (screen_width * screen_height))
    )

    return (
        int(api_coords[0] / scale),
        int(api_coords[1] / scale)
    )
```

**问题 5：如何处理 UI 更新的时机问题？**

- 在操作后实现可配置的延迟
- 使用轮询等待预期元素
- 延迟后截图以验证状态
- 对已知的慢操作使用显式 `wait` 操作
- 为临时故障实现重试逻辑

**问题 6：`computer_20250124` 和 `computer_20251124` 工具有什么区别？**

- `computer_20250124`：用于 Claude Sonnet 4.5、Haiku 4.5、Opus 4.1、Sonnet 4
  - 基础操作加上增强的滚动、拖拽、修饰键
- `computer_20251124`：Claude Opus 4.5 独有
  - 所有先前操作加上用于详细区域检查的 `zoom`
  - 需要在工具定义中设置 `enable_zoom: true`

### 系统设计问题

**问题 7：为生产环境设计一个容错的 computer use 系统。**

关键组件：
1. **断路器**：连续失败后停止重试
2. **检查点**：保存状态以恢复失败的任务
3. **幂等性**：确保操作可以安全重试
4. **监控**：跟踪成功率、延迟、成本
5. **优雅降级**：退回到人工干预
6. **队列管理**：通过背压处理速率限制

**问题 8：如何实现并行的 computer use 会话？**

```python
async def parallel_sessions(tasks, max_concurrent=5):
    semaphore = asyncio.Semaphore(max_concurrent)

    async def run_with_limit(task):
        async with semaphore:
            env = SecureComputerEnvironment()
            env.start()
            try:
                agent = ComputerUseAgent(env)
                return await agent.run(task)
            finally:
                env.stop()

    return await asyncio.gather(*[run_with_limit(t) for t in tasks])
```

## 延伸阅读

### 官方资源

- [Computer Use 文档](https://platform.claude.com/docs/en/docs/agents-and-tools/computer-use)
- [参考实现](https://github.com/anthropics/anthropic-quickstarts/tree/main/computer-use-demo)
- [Anthropic Cookbook](https://github.com/anthropics/anthropic-cookbook)
- [工具使用概览](https://platform.claude.com/docs/en/agents-and-tools/tool-use/overview)

### 相关主题

- [Claude API 指南](/docs/ai/claude-api) - API 集成基础
- [AI 代理](/docs/ai/ai-agents) - 代理架构模式
- [提示工程](/docs/ai/prompt-engineering) - 为 Computer Use 优化提示

### 社区资源

- [Anthropic Discord](https://discord.gg/anthropic) - 社区讨论
- [Computer Use 反馈表单](https://forms.gle/H6UFuXaaLywri9hz6) - 报告问题和建议

## 总结

Claude Computer Use 代表了自动化能力的范式转变。关键要点：

| 方面 | 关键点 |
|------|--------|
| **核心能力** | 与任何桌面应用程序的视觉交互 |
| **架构** | 截图-操作-结果循环的代理循环 |
| **安全性** | 容器化、域名过滤、人工监督 |
| **性能** | 坐标缩放、截图优化、缓存 |
| **使用场景** | 测试、数据录入、跨应用工作流 |

### 生产检查清单

- [ ] 使用具有最小权限的容器化/虚拟机环境
- [ ] 为高分辨率显示器实现坐标缩放
- [ ] 在 UI 操作后添加适当的延迟
- [ ] 设置网络访问的域名允许列表
- [ ] 为敏感操作实现人工确认
- [ ] 配置成本控制和迭代限制
- [ ] 设置日志记录和监控
- [ ] 处理提示注入检测
- [ ] 测试故障恢复和重试
- [ ] 实现适当的错误处理和报告

Computer Use 为 AI 驱动的自动化开辟了新的可能性，同时需要仔细关注安全性和可靠性。通过遵循本指南中的模式和实践，您可以构建安全利用 Claude 视觉理解能力的强大 computer use 应用程序。
