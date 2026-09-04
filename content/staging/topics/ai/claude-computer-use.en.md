---
title: Claude Computer Use Deep Dive
description: A comprehensive guide to Claude's computer use capability - enabling AI to interact with desktop applications
track: ai
section: agents
difficulty: advanced
tags:
  - Claude
  - Anthropic
  - Computer Use
  - AI Agent
  - Automation
status: imported
origin: old/src/content/docs/ai/claude-computer-use.en.md
divergence: 0.218
issues: []
legacy:
  category: AI
  subcategory: LLM
  order: 62
  lastUpdated: 2026-01-20
---

Claude Computer Use is Anthropic's groundbreaking capability that enables Claude to interact with desktop environments just like a human user. By combining screenshot analysis with mouse and keyboard control, Claude can autonomously navigate applications, fill forms, browse the web, and complete complex multi-step workflows. This guide covers everything from fundamental concepts to production-ready implementations.

## Understanding Computer Use

### What is Computer Use?

Computer Use is a beta feature that allows Claude to see and interact with computer screens. Unlike traditional APIs that work with text and structured data, Computer Use enables Claude to:

- **See the screen**: Capture and analyze screenshots to understand what's displayed
- **Control the mouse**: Click, drag, scroll, and move the cursor
- **Use the keyboard**: Type text and execute keyboard shortcuts
- **Automate workflows**: Chain actions together to complete complex tasks

This capability transforms Claude from a conversational AI into an autonomous agent capable of operating any software with a graphical interface.

### Why Computer Use Matters

Traditional automation approaches require:
- Custom API integrations for each application
- Scripted workflows that break when UIs change
- Technical expertise to maintain automation scripts

Computer Use solves these problems by:
- Working with any application that has a visual interface
- Adapting to UI changes through visual understanding
- Enabling non-technical users to automate complex tasks
- Handling edge cases through reasoning rather than hardcoded logic

### Release Background

Anthropic introduced Computer Use as a beta feature to enable AI agents to interact with desktop environments. The feature has evolved through several versions:

| Version | Beta Flag | Models |
|---------|-----------|--------|
| `computer_20251124` | `computer-use-2025-11-24` | Claude Opus 4.5 |
| `computer_20250124` | `computer-use-2025-01-24` | Claude Sonnet 4.5, Haiku 4.5, Opus 4.1, Sonnet 4, Opus 4 |

Each version introduces enhanced capabilities while maintaining backward compatibility within its model family.

## Core Architecture

### How Computer Use Works

The Computer Use system operates through an agent loop that coordinates between Claude and a computing environment:

```
┌─────────────────────────────────────────────────────────────────┐
│                        Agent Loop                               │
│  ┌─────────┐    ┌─────────┐    ┌──────────────┐    ┌────────┐  │
│  │  User   │───>│  Claude │───>│    Tool      │───>│  VM/   │  │
│  │ Prompt  │    │   API   │    │  Executor    │    │Container│  │
│  └─────────┘    └────┬────┘    └──────┬───────┘    └────┬───┘  │
│                      │                │                  │      │
│                      │<───────────────┘<─────────────────┘      │
│                      │         (Tool Results + Screenshots)     │
└─────────────────────────────────────────────────────────────────┘
```

**Step 1: Tool Definition and User Prompt**
Your application sends Claude a request with the computer use tool definition and a user task.

**Step 2: Claude Analyzes and Decides**
Claude examines any provided screenshots and determines what action to take. If action is needed, Claude returns a `tool_use` response.

**Step 3: Tool Execution**
Your application extracts the requested action, executes it in the computing environment, and captures the result (usually a new screenshot).

**Step 4: Iteration**
Results are sent back to Claude, which continues analyzing and requesting actions until the task is complete.

### The Computing Environment

Computer Use requires a sandboxed environment where Claude can safely interact with applications:

```python
# Typical environment components
ENVIRONMENT_COMPONENTS = {
    "virtual_display": "Xvfb (X Virtual Framebuffer)",
    "desktop_environment": "Lightweight WM (Mutter) + Panel (Tint2)",
    "applications": ["Firefox", "LibreOffice", "File Manager", "Terminal"],
    "tool_implementations": "Python handlers for mouse/keyboard/screenshot",
    "agent_loop": "Communication bridge between Claude and environment"
}
```

Claude never directly connects to the environment. Your application:
1. Receives Claude's tool use requests
2. Translates them into actual actions
3. Captures results (screenshots, command outputs)
4. Returns results to Claude

## Tool Definition and Actions

### Computer Use Tool Schema

The computer use tool is defined using a special schema-less format:

```python
import anthropic

client = anthropic.Anthropic()

# Tool definition for Claude Sonnet 4.5 and other models
computer_tool = {
    "type": "computer_20250124",
    "name": "computer",
    "display_width_px": 1024,
    "display_height_px": 768,
    "display_number": 1,  # Optional: X11 display number
}

# Tool definition for Claude Opus 4.5 with zoom capability
computer_tool_opus = {
    "type": "computer_20251124",
    "name": "computer",
    "display_width_px": 1024,
    "display_height_px": 768,
    "display_number": 1,
    "enable_zoom": True,  # Enable zoom action for detailed inspection
}
```

### Supported Actions

**Basic Actions (All Versions)**

| Action | Description | Parameters |
|--------|-------------|------------|
| `screenshot` | Capture current display | None |
| `left_click` | Click at position | `coordinate: [x, y]` |
| `type` | Type text string | `text: string` |
| `key` | Press key combination | `text: string` (e.g., "ctrl+s") |
| `mouse_move` | Move cursor | `coordinate: [x, y]` |

**Enhanced Actions (computer_20250124)**

| Action | Description | Parameters |
|--------|-------------|------------|
| `scroll` | Scroll with direction | `coordinate`, `scroll_direction`, `scroll_amount` |
| `left_click_drag` | Click and drag | `start_coordinate`, `coordinate` |
| `right_click` | Right mouse button | `coordinate: [x, y]` |
| `middle_click` | Middle mouse button | `coordinate: [x, y]` |
| `double_click` | Double click | `coordinate: [x, y]` |
| `triple_click` | Triple click | `coordinate: [x, y]` |
| `left_mouse_down` | Press and hold | `coordinate: [x, y]` |
| `left_mouse_up` | Release button | `coordinate: [x, y]` |
| `hold_key` | Hold key for duration | `text: string`, `duration: seconds` |
| `wait` | Pause execution | `duration: seconds` |

**Opus 4.5 Exclusive Actions (computer_20251124)**

| Action | Description | Parameters |
|--------|-------------|------------|
| `zoom` | View region at full resolution | `region: [x1, y1, x2, y2]` |

### Action Examples

```python
# Take a screenshot
screenshot_action = {
    "action": "screenshot"
}

# Click at a specific position
click_action = {
    "action": "left_click",
    "coordinate": [500, 300]
}

# Type text
type_action = {
    "action": "type",
    "text": "Hello, World!"
}

# Press keyboard shortcut
key_action = {
    "action": "key",
    "text": "ctrl+s"
}

# Scroll down
scroll_action = {
    "action": "scroll",
    "coordinate": [500, 400],
    "scroll_direction": "down",
    "scroll_amount": 3
}

# Drag from one point to another
drag_action = {
    "action": "left_click_drag",
    "start_coordinate": [100, 100],
    "coordinate": [300, 300]
}

# Shift+click for range selection
modifier_click = {
    "action": "left_click",
    "coordinate": [500, 300],
    "text": "shift"  # Modifier key
}

# Zoom into a region (Opus 4.5 only)
zoom_action = {
    "action": "zoom",
    "region": [100, 200, 400, 350]  # [x1, y1, x2, y2]
}
```

## Complete Implementation

### Basic API Request

```python
import anthropic
import base64

client = anthropic.Anthropic()

def make_computer_use_request(user_prompt: str):
    """Make a basic computer use request."""
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

# Example usage
response = make_computer_use_request("Open Firefox and search for 'Python tutorials'")
print(response)
```

### Full Agent Loop Implementation

```python
import anthropic
import base64
import subprocess
import time
from typing import Any
from dataclasses import dataclass

@dataclass
class ComputerEnvironment:
    """Manages the virtual display environment."""
    width: int = 1024
    height: int = 768
    display_number: int = 1

    def capture_screenshot(self) -> str:
        """Capture screenshot and return base64 encoded image."""
        # Using scrot or similar tool to capture X11 display
        screenshot_path = "/tmp/screenshot.png"
        subprocess.run([
            "scrot", "-o", screenshot_path,
            "-d", str(self.display_number)
        ], check=True)

        with open(screenshot_path, "rb") as f:
            return base64.standard_b64encode(f.read()).decode("utf-8")

    def click(self, x: int, y: int, button: str = "left"):
        """Perform mouse click at coordinates."""
        button_map = {"left": "1", "middle": "2", "right": "3"}
        subprocess.run([
            "xdotool", "mousemove", str(x), str(y),
            "click", button_map.get(button, "1")
        ], check=True)

    def type_text(self, text: str):
        """Type text using keyboard."""
        subprocess.run(["xdotool", "type", "--", text], check=True)

    def press_key(self, key: str):
        """Press a key or key combination."""
        subprocess.run(["xdotool", "key", key], check=True)

    def scroll(self, x: int, y: int, direction: str, amount: int):
        """Scroll at position."""
        subprocess.run(["xdotool", "mousemove", str(x), str(y)], check=True)
        button = "4" if direction == "up" else "5"
        for _ in range(amount):
            subprocess.run(["xdotool", "click", button], check=True)

    def mouse_move(self, x: int, y: int):
        """Move mouse to position."""
        subprocess.run(["xdotool", "mousemove", str(x), str(y)], check=True)

    def drag(self, start_x: int, start_y: int, end_x: int, end_y: int):
        """Drag from start to end position."""
        subprocess.run([
            "xdotool", "mousemove", str(start_x), str(start_y),
            "mousedown", "1",
            "mousemove", str(end_x), str(end_y),
            "mouseup", "1"
        ], check=True)


class ComputerUseAgent:
    """Agent that executes computer use tasks."""

    def __init__(self, model: str = "claude-sonnet-4-5"):
        self.client = anthropic.Anthropic()
        self.model = model
        self.env = ComputerEnvironment()
        self.beta_flag = "computer-use-2025-01-24"
        self.tool_version = "computer_20250124"

    def get_tools(self) -> list:
        """Return tool definitions."""
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
        """Execute a computer action and return result."""
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
                return {"error": f"Unknown action: {action_type}"}

            # Return screenshot after action
            time.sleep(0.5)  # Allow UI to update
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
        """Run the agent loop until task completion."""
        messages = [{"role": "user", "content": user_prompt}]

        for iteration in range(max_iterations):
            print(f"Iteration {iteration + 1}/{max_iterations}")

            # Call Claude API
            response = self.client.beta.messages.create(
                model=self.model,
                max_tokens=4096,
                tools=self.get_tools(),
                messages=messages,
                betas=[self.beta_flag]
            )

            # Add assistant response to history
            messages.append({
                "role": "assistant",
                "content": response.content
            })

            # Check for tool use
            tool_results = []
            for block in response.content:
                if block.type == "tool_use":
                    if block.name == "computer":
                        result = self.execute_action(block.input)
                    else:
                        # Handle other tools (bash, text_editor)
                        result = self.execute_other_tool(block.name, block.input)

                    tool_results.append({
                        "type": "tool_result",
                        "tool_use_id": block.id,
                        "content": [result] if isinstance(result, dict) else result
                    })

            # If no tools were used, task is complete
            if not tool_results:
                # Extract final text response
                for block in response.content:
                    if hasattr(block, "text"):
                        return block.text
                return "Task completed"

            # Add tool results to messages
            messages.append({
                "role": "user",
                "content": tool_results
            })

        return "Max iterations reached"

    def execute_other_tool(self, name: str, input_data: dict) -> Any:
        """Execute bash or text editor tools."""
        if name == "bash":
            result = subprocess.run(
                input_data.get("command", ""),
                shell=True,
                capture_output=True,
                text=True
            )
            return result.stdout + result.stderr

        elif name == "str_replace_based_edit_tool":
            # Implement file editing logic
            pass

        return {"error": f"Unknown tool: {name}"}


# Usage example
if __name__ == "__main__":
    agent = ComputerUseAgent()
    result = agent.run("Open Firefox, go to github.com, and take a screenshot")
    print(f"Result: {result}")
```

### Async Implementation with Thinking

```python
import anthropic
import asyncio
from typing import Optional

class AsyncComputerUseAgent:
    """Async agent with thinking capability support."""

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
        """Run the async agent loop."""
        messages = [{"role": "user", "content": user_prompt}]

        # Configure thinking if enabled
        thinking_config = None
        if self.thinking_budget:
            thinking_config = {
                "type": "enabled",
                "budget_tokens": self.thinking_budget
            }

        for iteration in range(max_iterations):
            # Build request parameters
            params = {
                "model": self.model,
                "max_tokens": 4096,
                "tools": self.get_tools(),
                "messages": messages,
                "betas": [self.beta_flag]
            }

            if thinking_config:
                params["thinking"] = thinking_config

            # Call Claude API
            response = await self.client.beta.messages.create(**params)

            # Process thinking blocks if present
            for block in response.content:
                if block.type == "thinking":
                    print(f"[Thinking] {block.thinking}")

            # Add response to history
            messages.append({
                "role": "assistant",
                "content": response.content
            })

            # Process tool calls
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
                return "Task completed"

            messages.append({
                "role": "user",
                "content": tool_results
            })

        return "Max iterations reached"

    def get_tools(self) -> list:
        """Return tool definitions."""
        return [
            {
                "type": "computer_20250124",
                "name": "computer",
                "display_width_px": 1024,
                "display_height_px": 768,
            }
        ]

    async def execute_action_async(self, action: dict) -> dict:
        """Execute action asynchronously."""
        # Run blocking operations in executor
        loop = asyncio.get_event_loop()
        return await loop.run_in_executor(
            None,
            self.execute_action_sync,
            action
        )

    def execute_action_sync(self, action: dict) -> dict:
        """Synchronous action execution."""
        # Implementation similar to previous example
        pass


# Usage with thinking enabled
async def main():
    agent = AsyncComputerUseAgent(
        model="claude-sonnet-4-5",
        thinking_budget=2048
    )
    result = await agent.run(
        "Navigate to Wikipedia and find information about Python programming"
    )
    print(result)

asyncio.run(main())
```

## Security Best Practices

### Critical Security Considerations

Computer Use introduces unique security risks that require careful mitigation:

```python
class SecurityConfig:
    """Security configuration for computer use."""

    # Environment isolation
    USE_CONTAINER = True
    USE_VM = True
    MINIMAL_PRIVILEGES = True

    # Network restrictions
    ALLOWED_DOMAINS = [
        "*.wikipedia.org",
        "*.github.com",
        "*.python.org"
    ]
    BLOCK_OUTBOUND = False

    # Data protection
    NO_SENSITIVE_DATA = True
    NO_CREDENTIALS_IN_PROMPT = False  # Use secure credential injection

    # Human oversight
    REQUIRE_CONFIRMATION_FOR = [
        "financial_transactions",
        "account_creation",
        "terms_acceptance",
        "file_deletion",
        "system_settings"
    ]
```

### Implementing a Secure Environment

```python
import docker
from typing import List, Optional

class SecureComputerEnvironment:
    """Docker-based secure environment for computer use."""

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
        """Start the secure container."""
        # Build network configuration
        network_mode = "bridge" if self.enable_network else "none"

        # Configure iptables rules for domain filtering
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
            cap_drop=["ALL"],  # Drop all capabilities
            cap_add=["SYS_PTRACE"],  # Only add necessary ones
            security_opt=["no-new-privileges:true"],
            read_only=False,  # Need write for temp files
            tmpfs={"/tmp": "size=100M"},
            mem_limit="2g",
            cpu_period=100000,
            cpu_quota=50000,  # 50% CPU limit
        )

        return self.container.id

    def _generate_iptables_rules(self) -> str:
        """Generate iptables rules for domain filtering."""
        rules = []
        for domain in self.allowed_domains:
            rules.append(f"-A OUTPUT -d {domain} -j ACCEPT")
        rules.append("-A OUTPUT -j DROP")  # Block all other outbound
        return "\n".join(rules)

    def stop(self):
        """Stop and remove the container."""
        if self.container:
            self.container.stop()
            self.container = None

    def execute(self, action: dict) -> dict:
        """Execute action in the container."""
        if not self.container:
            raise RuntimeError("Container not started")

        # Execute action via container exec
        exit_code, output = self.container.exec_run(
            f"python /app/execute_action.py '{json.dumps(action)}'"
        )

        return json.loads(output.decode())
```

### Human-in-the-Loop Confirmation

```python
class ConfirmationGate:
    """Require human confirmation for sensitive actions."""

    SENSITIVE_ACTIONS = {
        "financial": ["pay", "transfer", "purchase", "buy", "checkout"],
        "authentication": ["login", "sign in", "password", "credential"],
        "destructive": ["delete", "remove", "format", "clear"],
        "consent": ["agree", "accept terms", "cookie", "privacy"]
    }

    def __init__(self, callback=None):
        self.callback = callback or self._default_confirm

    def check_action(self, action: dict, context: str) -> bool:
        """Check if action requires confirmation."""
        action_type = action.get("action", "")
        text = action.get("text", "").lower()

        for category, keywords in self.SENSITIVE_ACTIONS.items():
            if any(kw in text or kw in context.lower() for kw in keywords):
                return self.callback(
                    action=action,
                    category=category,
                    reason=f"Action may involve {category} operation"
                )

        return True

    def _default_confirm(self, action: dict, category: str, reason: str) -> bool:
        """Default confirmation via console."""
        print(f"\n{'='*50}")
        print(f"CONFIRMATION REQUIRED: {category.upper()}")
        print(f"Reason: {reason}")
        print(f"Action: {action}")
        print(f"{'='*50}")

        response = input("Allow this action? (yes/no): ")
        return response.lower() in ("yes", "y")
```

### Prompt Injection Defense

```python
class PromptInjectionDefense:
    """Detect and mitigate prompt injection attempts."""

    SUSPICIOUS_PATTERNS = [
        r"ignore previous instructions",
        r"disregard.*system prompt",
        r"you are now",
        r"new instructions:",
        r"override.*settings",
        r"<\|.*\|>",  # Token manipulation attempts
        r"```system",
    ]

    def __init__(self):
        import re
        self.patterns = [re.compile(p, re.IGNORECASE)
                       for p in self.SUSPICIOUS_PATTERNS]

    def check_screenshot(self, screenshot_text: str) -> dict:
        """Check screenshot text for injection attempts."""
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
                "recommendation": "Request user confirmation before proceeding"
            }

        return {"safe": True, "findings": []}

    def sanitize_response(self, response: str) -> str:
        """Sanitize potentially injected content."""
        # Remove suspicious patterns from response
        sanitized = response
        for pattern in self.patterns:
            sanitized = pattern.sub("[REDACTED]", sanitized)
        return sanitized
```

## Common Pitfalls and Solutions

### Coordinate Scaling Issues

When working with high-resolution displays, coordinates must be properly scaled:

```python
import math

class CoordinateScaler:
    """Handle coordinate scaling for different resolutions."""

    # API constraints
    MAX_LONG_EDGE = 1568
    MAX_TOTAL_PIXELS = 1_150_000

    def __init__(self, screen_width: int, screen_height: int):
        self.screen_width = screen_width
        self.screen_height = screen_height
        self.scale = self._calculate_scale()

    def _calculate_scale(self) -> float:
        """Calculate scale factor to meet API constraints."""
        long_edge = max(self.screen_width, self.screen_height)
        total_pixels = self.screen_width * self.screen_height

        long_edge_scale = self.MAX_LONG_EDGE / long_edge
        total_pixels_scale = math.sqrt(self.MAX_TOTAL_PIXELS / total_pixels)

        return min(1.0, long_edge_scale, total_pixels_scale)

    def get_scaled_dimensions(self) -> tuple:
        """Get dimensions for screenshots sent to API."""
        return (
            int(self.screen_width * self.scale),
            int(self.screen_height * self.scale)
        )

    def scale_coordinates_to_screen(self, x: int, y: int) -> tuple:
        """Convert Claude's coordinates to actual screen coordinates."""
        return (
            int(x / self.scale),
            int(y / self.scale)
        )

    def scale_coordinates_from_screen(self, x: int, y: int) -> tuple:
        """Convert screen coordinates to API coordinates."""
        return (
            int(x * self.scale),
            int(y * self.scale)
        )


# Usage example
scaler = CoordinateScaler(1920, 1080)
print(f"Scale factor: {scaler.scale}")  # ~0.82
print(f"Scaled dimensions: {scaler.get_scaled_dimensions()}")  # (1574, 886)

# When Claude returns coordinates (500, 300)
screen_x, screen_y = scaler.scale_coordinates_to_screen(500, 300)
print(f"Actual screen position: ({screen_x}, {screen_y})")  # (609, 366)
```

### Screenshot Timing Issues

UI elements may not be ready immediately after actions:

```python
import time
from typing import Callable, Optional

class ActionExecutor:
    """Execute actions with proper timing."""

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
        """Execute action and wait for appropriate delay."""
        action_func()

        # Use custom wait condition if provided
        if wait_for:
            timeout = 10
            start = time.time()
            while not wait_for() and time.time() - start < timeout:
                time.sleep(0.1)
        else:
            # Use default delay
            delay = self.delays.get(action_type, 0.3)
            time.sleep(delay)

    def wait_for_element(
        self,
        screenshot_func: Callable,
        element_detector: Callable,
        timeout: float = 10.0
    ) -> bool:
        """Wait for an element to appear in screenshot."""
        start = time.time()
        while time.time() - start < timeout:
            screenshot = screenshot_func()
            if element_detector(screenshot):
                return True
            time.sleep(0.5)
        return False
```

### Handling Unreliable UI Elements

Some UI elements are difficult for Claude to interact with:

```python
class UIInteractionHelper:
    """Helper methods for tricky UI elements."""

    @staticmethod
    def select_dropdown_by_keyboard(
        env,
        dropdown_coords: tuple,
        option_text: str
    ):
        """Select dropdown option using keyboard navigation."""
        # Click to open dropdown
        env.click(*dropdown_coords)
        time.sleep(0.3)

        # Type to filter/search
        env.type_text(option_text)
        time.sleep(0.2)

        # Press Enter to select
        env.press_key("Return")

    @staticmethod
    def scroll_into_view(
        env,
        target_y: int,
        viewport_height: int,
        scroll_x: int = 500
    ):
        """Scroll to bring target into view."""
        current_scroll = 0
        max_scrolls = 20

        for _ in range(max_scrolls):
            if current_scroll <= target_y <= current_scroll + viewport_height:
                return True

            if target_y > current_scroll + viewport_height:
                env.scroll(scroll_x, viewport_height // 2, "down", 3)
                current_scroll += 100  # Approximate scroll amount
            else:
                env.scroll(scroll_x, viewport_height // 2, "up", 3)
                current_scroll -= 100

            time.sleep(0.3)

        return False

    @staticmethod
    def reliable_text_selection(env, start: tuple, end: tuple):
        """Reliable text selection using triple-click or shift-click."""
        # Option 1: Triple-click for line selection
        env.click(*start, "left")
        time.sleep(0.05)
        env.click(*start, "left")
        time.sleep(0.05)
        env.click(*start, "left")

        # Option 2: Click then shift-click for range
        # env.click(*start, "left")
        # time.sleep(0.1)
        # env.press_key("shift")
        # env.click(*end, "left")
```

## Performance Optimization

### Screenshot Optimization

```python
from PIL import Image
import io
import base64

class ScreenshotOptimizer:
    """Optimize screenshots for faster API calls."""

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
        """Optimize screenshot and return base64."""
        img = Image.open(io.BytesIO(screenshot_bytes))

        # Resize if needed
        if img.width > self.max_width or img.height > self.max_height:
            img.thumbnail((self.max_width, self.max_height), Image.LANCZOS)

        # Convert to RGB if necessary (for JPEG)
        if self.format == "JPEG" and img.mode in ("RGBA", "P"):
            img = img.convert("RGB")

        # Compress
        buffer = io.BytesIO()
        img.save(buffer, format=self.format, quality=self.quality, optimize=True)

        return base64.standard_b64encode(buffer.getvalue()).decode("utf-8")

    def get_media_type(self) -> str:
        """Return the media type for the format."""
        return f"image/{self.format.lower()}"
```

### Caching and Batching

```python
from functools import lru_cache
import hashlib

class ActionCache:
    """Cache repeated actions and their results."""

    def __init__(self, max_size: int = 100):
        self.cache = {}
        self.max_size = max_size

    def _make_key(self, action: dict, screenshot_hash: str) -> str:
        """Create cache key from action and screenshot."""
        action_str = json.dumps(action, sort_keys=True)
        return hashlib.sha256(
            f"{action_str}:{screenshot_hash}".encode()
        ).hexdigest()

    def get(self, action: dict, screenshot: bytes) -> Optional[dict]:
        """Get cached result if available."""
        screenshot_hash = hashlib.sha256(screenshot).hexdigest()
        key = self._make_key(action, screenshot_hash)
        return self.cache.get(key)

    def set(self, action: dict, screenshot: bytes, result: dict):
        """Cache action result."""
        if len(self.cache) >= self.max_size:
            # Remove oldest entry
            oldest_key = next(iter(self.cache))
            del self.cache[oldest_key]

        screenshot_hash = hashlib.sha256(screenshot).hexdigest()
        key = self._make_key(action, screenshot_hash)
        self.cache[key] = result
```

### Rate Limiting and Cost Control

```python
import time
from collections import deque
from threading import Lock
from dataclasses import dataclass
from datetime import datetime

@dataclass
class UsageMetrics:
    """Track usage metrics."""
    api_calls: int = 0
    input_tokens: int = 0
    output_tokens: int = 0
    screenshots: int = 0
    total_cost: float = 0.0

class CostController:
    """Control costs and rate limits."""

    # Pricing (per 1M tokens)
    PRICING = {
        "claude-sonnet-4-5": {"input": 3.0, "output": 15.0},
        "claude-opus-4-5": {"input": 5.0, "output": 25.0},
    }

    SCREENSHOT_TOKENS = 1334  # Approximate tokens per screenshot

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
        """Check if within budget."""
        return self.metrics.total_cost < self.max_cost

    def check_rate_limit(self) -> float:
        """Check rate limit and return wait time if needed."""
        with self.lock:
            now = time.time()

            # Remove requests older than 60 seconds
            while self.request_times and now - self.request_times[0] > 60:
                self.request_times.popleft()

            if len(self.request_times) >= self.rpm_limit:
                wait_time = 60 - (now - self.request_times[0])
                return max(0, wait_time)

            return 0

    def record_request(self, input_tokens: int, output_tokens: int):
        """Record API request and update metrics."""
        with self.lock:
            self.request_times.append(time.time())
            self.metrics.api_calls += 1
            self.metrics.input_tokens += input_tokens
            self.metrics.output_tokens += output_tokens

            # Calculate cost
            pricing = self.PRICING.get(self.model, self.PRICING["claude-sonnet-4-5"])
            cost = (
                (input_tokens / 1_000_000) * pricing["input"] +
                (output_tokens / 1_000_000) * pricing["output"]
            )
            self.metrics.total_cost += cost

    def get_summary(self) -> dict:
        """Get usage summary."""
        return {
            "api_calls": self.metrics.api_calls,
            "total_tokens": self.metrics.input_tokens + self.metrics.output_tokens,
            "total_cost": f"${self.metrics.total_cost:.4f}",
            "screenshots": self.metrics.screenshots
        }
```

## Real-World Use Cases

### Automated Testing

```python
class WebUITester:
    """Automated UI testing using computer use."""

    def __init__(self, agent: ComputerUseAgent):
        self.agent = agent
        self.test_results = []

    async def run_test_suite(self, tests: list) -> dict:
        """Run a suite of UI tests."""
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
        """Run a single test case."""
        prompt = f"""
        Perform the following UI test:

        Test: {test['name']}
        Steps:
        {chr(10).join(f"  {i+1}. {step}" for i, step in enumerate(test['steps']))}

        Expected Result: {test['expected']}

        After completing the steps, verify the expected result and report:
        - PASS if the expected result is observed
        - FAIL if the expected result is not observed
        - Include a screenshot and description of what you observed
        """

        result = await self.agent.run(prompt)

        return {
            "name": test["name"],
            "passed": "PASS" in result.upper(),
            "output": result
        }


# Example test suite
test_suite = [
    {
        "name": "Login Flow",
        "steps": [
            "Navigate to https://example.com/login",
            "Enter 'testuser' in the username field",
            "Enter 'password123' in the password field",
            "Click the Login button"
        ],
        "expected": "Dashboard page is displayed with welcome message"
    },
    {
        "name": "Search Functionality",
        "steps": [
            "Click the search icon",
            "Type 'test query' in the search box",
            "Press Enter"
        ],
        "expected": "Search results page shows relevant results"
    }
]
```

### Data Entry Automation

```python
class DataEntryAutomation:
    """Automate data entry across applications."""

    def __init__(self, agent: ComputerUseAgent):
        self.agent = agent

    async def fill_form_from_csv(
        self,
        csv_path: str,
        form_url: str,
        field_mapping: dict
    ):
        """Fill web forms from CSV data."""
        import csv

        with open(csv_path, 'r') as f:
            reader = csv.DictReader(f)
            rows = list(reader)

        results = []
        for i, row in enumerate(rows):
            # Build natural language instructions
            field_instructions = []
            for csv_field, form_field in field_mapping.items():
                value = row.get(csv_field, "")
                if value:
                    field_instructions.append(
                        f"Enter '{value}' into the {form_field} field"
                    )

            prompt = f"""
            Data Entry Task ({i+1}/{len(rows)}):

            1. Navigate to {form_url}
            2. Fill in the form:
               {chr(10).join(f"   - {instr}" for instr in field_instructions)}
            3. Click the Submit button
            4. Verify submission was successful
            5. Take a screenshot of the confirmation
            """

            result = await self.agent.run(prompt)
            results.append({
                "row": i + 1,
                "data": row,
                "result": result
            })

        return results
```

### Cross-Application Workflow

```python
class CrossAppWorkflow:
    """Orchestrate workflows across multiple applications."""

    def __init__(self, agent: ComputerUseAgent):
        self.agent = agent

    async def generate_report_workflow(self):
        """
        Example: Generate report from database,
        create charts in spreadsheet, compile in document.
        """
        prompt = """
        Complete this multi-application workflow:

        1. DATABASE QUERY:
           - Open the terminal
           - Run: psql -h localhost -U analyst -d sales
           - Execute: SELECT * FROM monthly_sales WHERE year = 2024;
           - Copy the results

        2. SPREADSHEET ANALYSIS:
           - Open LibreOffice Calc
           - Paste the data into cell A1
           - Create a bar chart showing sales by month
           - Save the chart as 'sales_chart.png'

        3. DOCUMENT CREATION:
           - Open LibreOffice Writer
           - Create a new document titled "Q4 2024 Sales Report"
           - Insert the sales chart
           - Add a summary paragraph below the chart
           - Save as 'Q4_Report.pdf'

        4. VERIFICATION:
           - Open the file manager
           - Navigate to the Documents folder
           - Confirm Q4_Report.pdf exists
           - Take a final screenshot
        """

        return await self.agent.run(prompt)
```

## Interview Questions

### Conceptual Questions

**Q1: What is Claude Computer Use and how does it differ from traditional automation tools like Selenium?**

Computer Use enables Claude to interact with desktop environments visually, similar to how a human would. Unlike Selenium which requires:
- Specific selectors (CSS, XPath)
- Code for each interaction
- Breaking when UI changes

Computer Use:
- Works with any visual interface
- Adapts to UI changes through visual understanding
- Can handle unexpected dialogs and edge cases
- Operates through natural language instructions

**Q2: Explain the agent loop architecture in Computer Use.**

The agent loop is a cycle where:
1. User provides task and tools
2. Claude analyzes current state (screenshot)
3. Claude requests a tool action
4. Application executes action in environment
5. Application returns result (new screenshot) to Claude
6. Claude decides next action or completion

This continues until Claude determines the task is complete or max iterations reached.

**Q3: What are the key security considerations when implementing Computer Use?**

- **Isolation**: Use containers/VMs with minimal privileges
- **Network**: Restrict to allowlisted domains
- **Data**: Never expose sensitive credentials directly
- **Human oversight**: Require confirmation for sensitive actions
- **Prompt injection**: Implement detection for malicious instructions in screenshots
- **Logging**: Maintain audit trail of all actions

### Technical Questions

**Q4: How would you handle coordinate scaling for a 4K display?**

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

**Q5: How do you handle timing issues with UI updates?**

- Implement configurable delays after actions
- Use polling to wait for expected elements
- Take screenshots after delays to verify state
- Use explicit `wait` action for known slow operations
- Implement retry logic for transient failures

**Q6: What's the difference between `computer_20250124` and `computer_20251124` tools?**

- `computer_20250124`: Used with Claude Sonnet 4.5, Haiku 4.5, Opus 4.1, Sonnet 4
  - Basic actions plus enhanced scroll, drag, modifier keys
- `computer_20251124`: Claude Opus 4.5 exclusive
  - All previous actions plus `zoom` for detailed region inspection
  - Requires `enable_zoom: true` in tool definition

### System Design Questions

**Q7: Design a fault-tolerant computer use system for production.**

Key components:
1. **Circuit breaker**: Stop retries after consecutive failures
2. **Checkpointing**: Save state to resume failed tasks
3. **Idempotency**: Ensure actions can be safely retried
4. **Monitoring**: Track success rates, latency, costs
5. **Graceful degradation**: Fall back to manual intervention
6. **Queue management**: Handle rate limits with backpressure

**Q8: How would you implement parallel computer use sessions?**

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

## Further Reading

### Official Resources

- [Computer Use Documentation](https://platform.claude.com/docs/en/docs/agents-and-tools/computer-use)
- [Reference Implementation](https://github.com/anthropics/anthropic-quickstarts/tree/main/computer-use-demo)
- [Anthropic Cookbook](https://github.com/anthropics/anthropic-cookbook)
- [Tool Use Overview](https://platform.claude.com/docs/en/agents-and-tools/tool-use/overview)

### Related Topics

- [Claude API Guide](/docs/ai/claude-api) - Foundation for API integration
- [AI Agents](/docs/ai/ai-agents) - Agent architecture patterns
- [Prompt Engineering](/docs/ai/prompt-engineering) - Optimizing prompts for Computer Use

### Community Resources

- [Anthropic Discord](https://discord.gg/anthropic) - Community discussions
- [Computer Use Feedback Form](https://forms.gle/H6UFuXaaLywri9hz6) - Report issues and suggestions

## Summary

Claude Computer Use represents a paradigm shift in automation capabilities. Key takeaways:

| Aspect | Key Points |
|--------|------------|
| **Core Capability** | Visual interaction with any desktop application |
| **Architecture** | Agent loop with screenshot-action-result cycle |
| **Security** | Containerization, domain filtering, human oversight |
| **Performance** | Coordinate scaling, screenshot optimization, caching |
| **Use Cases** | Testing, data entry, cross-app workflows |

### Production Checklist

- [ ] Use containerized/VM environment with minimal privileges
- [ ] Implement coordinate scaling for high-resolution displays
- [ ] Add appropriate delays after UI actions
- [ ] Set up domain allowlisting for network access
- [ ] Implement human confirmation for sensitive actions
- [ ] Configure cost controls and iteration limits
- [ ] Set up logging and monitoring
- [ ] Handle prompt injection detection
- [ ] Test failure recovery and retries
- [ ] Implement proper error handling and reporting

Computer Use opens new possibilities for AI-driven automation while requiring careful attention to security and reliability. By following the patterns and practices in this guide, you can build robust computer use applications that safely leverage Claude's visual understanding capabilities.
