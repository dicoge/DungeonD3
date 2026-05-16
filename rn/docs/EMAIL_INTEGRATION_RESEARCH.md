# Gemini CLI 整合郵件管理 — 可行性研究報告

> **研究日期：** 2026-05-15  
> **研究範圍：** Gemini CLI (OpenRouter Edition) + 郵件管理整合方案  
> **環境：** Hermes Agent + Gemini CLI @ OpenRouter

---

## 目錄

1. [研究背景](#1-研究背景)
2. [方案一：Gemini CLI + MCP Server + Gmail API](#2-方案一gemini-cli--mcp-server--gmail-api)
3. [方案二：Gemini CLI + Himalaya (IMAP/SMTP CLI)](#3-方案二gemini-cli--himalaya-imapsmtp-cli)
4. [方案三：Gemini CLI + 第三方郵件服務 (AgentMail / Zapier / Make)](#4-方案三gemini-cli--第三方郵件服務-agentmail--zapier--make)
5. [方案四：Gemini CLI + Hermes Gateway 內建郵件平台](#5-方案四gemini-cli--hermes-gateway-內建郵件平台)
6. [方案比較總表](#6-方案比較總表)
7. [推薦方案](#7-推薦方案)
8. [實作步驟 (推薦方案)](#8-實作步驟-推薦方案)
9. [注意事項](#9-注意事項)
10. [附錄：技術參考](#10-附錄技術參考)

---

## 1. 研究背景

### 1.1 現有環境

| 項目 | 狀態 |
|------|------|
| **Gemini CLI** | 已安裝 (`/home/dicoge/.hermes/node/bin/gemini`) — OpenRouter Edition |
| **Hermes Agent** | 已安裝，包含郵件技能 (himalaya) 與 Gateway Email 平台 |
| **Himalaya CLI** | 尚未安裝 |
| **MCP 伺服器** | 尚未配置 |
| **Gemini Extensions** | 尚未安裝 |
| **Gmail API 套件** | 尚未安裝 |
| **AgentMail** | 可選用（需要 API Key） |

### 1.2 Gemini CLI 的可擴展機制

Gemini CLI (OpenRouter Edition) 提供兩種擴展機制：

1. **MCP 伺服器** (`gemini mcp add`)：支援 Model Context Protocol，可註冊外部工具伺服器，讓 AI agent 直接呼叫工具
2. **Extensions** (`gemini extensions install`)：安裝自訂擴展套件，提供額外功能

這兩種機制是整合郵件管理的核心接入點。

---

## 2. 方案一：Gemini CLI + MCP Server + Gmail API

### 2.1 架構說明

```
Gemini CLI → MCP Server (Gmail Bridge) → Google Gmail API → Gmail
                    │
            OAuth 2.0 金鑰管理
```

建立一個 MCP 伺服器，封裝 Gmail API 的操作（讀取、搜尋、分類、回覆、標記），Gemini CLI 透過 MCP 協定呼叫這些工具。

### 2.2 所需權限

- **Google Cloud Platform 專案**：啟用 Gmail API
- **OAuth 2.0 憑證**：需要設定 OAuth consent screen，取得 Client ID / Client Secret
- **授權範圍**：
  - `https://www.googleapis.com/auth/gmail.readonly`（讀取郵件）
  - `https://www.googleapis.com/auth/gmail.modify`（讀取 + 標記/刪除）
  - `https://www.googleapis.com/auth/gmail.send`（發送郵件）
  - `https://www.googleapis.com/auth/gmail.labels`（管理標籤）

### 2.3 實作方式

**Step 1：建立 Gmail MCP 伺服器**

使用 Python + `google-api-python-client` 套件建立 MCP 伺服器：

```python
# gmail_mcp_server.py
from mcp.server import Server
from google.oauth2.credentials import Credentials
from googleapiclient.discovery import build

server = Server("gmail-bridge")

@server.tool()
async def list_unread_emails(max_results: int = 10):
    """列出未讀郵件"""
    service = build("gmail", "v1", credentials=creds)
    results = service.users().messages().list(
        userId="me", q="is:unread", maxResults=max_results
    ).execute()
    return results

@server.tool()
async def read_email(message_id: str):
    """讀取特定郵件內容"""
    ...

@server.tool()
async def summarize_inbox():
    """產生收件匣摘要"""
    ...

@server.tool()
async def send_reply(message_id: str, body: str):
    """回覆郵件"""
    ...

@server.tool()
async def add_label(message_id: str, label: str):
    """加入標籤進行分類"""
    ...

server.run()
```

**Step 2：註冊 MCP 伺服器到 Gemini CLI**

```bash
gemini mcp add gmail-bridge "python" "/path/to/gmail_mcp_server.py"
```

**Step 3：使用範例**

```bash
# 直接提示 Gemini CLI 執行郵件操作
gemini "檢查我的 Gmail 未讀郵件，幫我摘要重點"

# Gemini CLI 會自動呼叫 MCP 工具完成操作
```

### 2.4 可行指令範例

| 操作 | 對應的 MCP 工具 |
|------|----------------|
| 檢查未讀郵件 | `list_unread_emails(max_results=20)` |
| 摘要重要郵件 | `read_email(id)` + LLM 摘要 |
| 分類郵件（加入標籤） | `add_label(id, "Important")` |
| 自動回覆 | `send_reply(id, "感謝您的來信...")` |
| 標記為已讀 | `mark_as_read(id)` |
| 搜尋郵件 | `search_emails(query="from:boss subject:report")` |

### 2.5 優缺點

**優點：**
- ✅ 功能完整：支援 Gmail 所有操作（標籤、篩選、自訂分類）
- ✅ 支援 OAuth 2.0 refresh token，可長期使用
- ✅ 可同時管理多個 Gmail 帳戶
- ✅ Gemini CLI MCP 整合最直接

**缺點：**
- ❌ 需要自行開發 MCP 伺服器
- ❌ OAuth 2.0 設定流程較複雜
- ❌ Google API 有 rate limit（每日配額）
- ❌ 僅支援 Gmail，不支援其他郵件服務
- ❌ 需要處理 token 儲存與 refresh 機制

---

## 3. 方案二：Gemini CLI + Himalaya (IMAP/SMTP CLI)

### 3.1 架構說明

```
Gemini CLI → 終端機指令 → Himalaya CLI → IMAP/SMTP → 郵件伺服器 (Gmail/Outlook/自建)
```

Himalaya 是一個 Rust 寫的命令列郵件客戶端，支援 IMAP 讀取、SMTP 發送、多帳戶管理。Gemini CLI 可以透過執行 shell 指令來操作 Himalaya。

### 3.2 整合方式

有三種整合方式：

#### 方式 A：直接透過終端機執行 Himalaya 指令

```bash
# Gemini CLI 可以執行這些指令
himalaya envelope list --folder INBOX --page 1 --page-size 10 --output json
himalaya message read 42
himalaya template send < composed_email.txt
```

**限制：** Gemini CLI 需要依賴其工具執行系統指令的能力（需要 yolo 模式或工具授權）。

#### 方式 B：建立 Himalaya MCP 伺服器（推薦）

建立一個 MCP 伺服器包裝 Himalaya CLI：

```python
# himalaya_mcp_server.py
import subprocess, json
from mcp.server import Server

server = Server("himalaya")

@server.tool()
async def list_emails(folder: str = "INBOX", page: int = 1, page_size: int = 20):
    result = subprocess.run(
        ["himalaya", "envelope", "list", "--folder", folder,
         "--page", str(page), "--page-size", str(page_size), "--output", "json"],
        capture_output=True, text=True
    )
    return json.loads(result.stdout)

@server.tool()
async def read_message(id: int):
    """讀取郵件內容"""
    result = subprocess.run(
        ["himalaya", "message", "read", str(id)],
        capture_output=True, text=True
    )
    return result.stdout

@server.tool()
async def send_email(to: str, subject: str, body: str):
    """發送郵件"""
    mml = f"From: you@example.com\nTo: {to}\nSubject: {subject}\n\n{body}"
    result = subprocess.run(
        ["himalaya", "template", "send"],
        input=mml, capture_output=True, text=True
    )
    return result.stdout

server.run()
```

然後註冊到 Gemini CLI：

```bash
gemini mcp add himalaya "python" "/path/to/himalaya_mcp_server.py"
```

#### 方式 C：Gemini CLI Extension

開發一個 Gemini CLI 擴展來封裝郵件操作指令。

### 3.3 Himalaya 配置範例（Gmail）

```toml
# ~/.config/himalaya/config.toml
[accounts.gmail]
email = "your@gmail.com"
display-name = "Your Name"
default = true

backend.type = "imap"
backend.host = "imap.gmail.com"
backend.port = 993
backend.encryption.type = "tls"
backend.login = "your@gmail.com"
backend.auth.type = "password"
backend.auth.cmd = "pass show google/app-password"

message.send.backend.type = "smtp"
message.send.backend.host = "smtp.gmail.com"
message.send.backend.port = 587
message.send.backend.encryption.type = "start-tls"
message.send.backend.login = "your@gmail.com"
message.send.backend.auth.type = "password"
message.send.backend.auth.cmd = "pass show google/app-password"
```

**Gmail 需要：** 啟用 2FA + 產生應用程式密碼（App Password）。

### 3.4 優缺點

**優點：**
- ✅ 支援任何 IMAP/SMTP 郵件服務（Gmail、Outlook、Yahoo、自建）
- ✅ Himalaya 是成熟工具，功能完整（列表、讀取、搜尋、回覆、轉發、附件）
- ✅ 輸出支援 JSON 格式，易於程式解析
- ✅ 不依賴 Google API，沒有 OAuth 複雜度（使用 App Password 即可）
- ✅ MCP 包裝後可與 Gemini CLI 無縫整合

**缺點：**
- ❌ 需要安裝 Himalaya CLI（目前系統尚未安裝）
- ❌ 需要管理密碼/App Password 儲存
- ❌ IMAP 效率不如 Gmail API（沒有 server-side 分類邏輯）
- ❌ Gmail 的 App Password 偶爾需要重新產生
- ❌ 不支援 Gmail 特有的標籤（Labels）功能

---

## 4. 方案三：Gemini CLI + 第三方郵件服務 (AgentMail / Zapier / Make)

### 4.1 方案 3A：AgentMail（MCP 原生支援）

AgentMail 是專為 AI Agent 設計的郵件服務，已提供 MCP 伺服器。

#### 架構

```
Gemini CLI → MCP → AgentMail MCP Server → AgentMail API → 郵件收發
```

#### 配置方式

```yaml
# ~/.hermes/config.yaml
mcp_servers:
  agentmail:
    command: "npx"
    args: ["-y", "agentmail-mcp"]
    env:
      AGENTMAIL_API_KEY: "am_***"
```

然後在 Gemini CLI 註冊相同 MCP 伺服器：

```bash
gemini mcp add agentmail "npx" "-y" "agentmail-mcp"
```

#### 可用工具

| 工具 | 功能 |
|------|------|
| `create_inbox` | 建立新信箱（獲得真實 email 地址） |
| `list_inboxes` | 列出所有信箱 |
| `list_threads` | 列出郵件對話 |
| `get_thread` | 讀取對話內容 |
| `send_message` | 發送郵件 |
| `reply_to_message` | 回覆郵件 |
| `forward_message` | 轉發郵件 |

#### 優缺點

**優點：**
- ✅ 零設定：不需要 IMAP/SMTP 配置
- ✅ 原生 MCP 支援，直接與 Gemini CLI 整合
- ✅ 每個 Agent 有獨立 email 地址
- ✅ 不需要管理密碼或 OAuth

**缺點：**
- ❌ ❌ ❌ **只能使用 @agentmail.to 郵箱**，無法讀取使用者的個人 Gmail
- ❌ 免費方案限制：3 個信箱、每月 3,000 封
- ❌ 需要 Node.js 18+
- ❌ 依賴第三方服務可用性

### 4.2 方案 3B：Zapier / Make (Webhook)

#### 架構

```
Gmail → Zapier/Make Webhook → 觸發 → Gemini CLI (API)
Gemini CLI → HTTP 請求 → Zapier/Make → Gmail (發送)
```

#### 實作方式

```python
# 透過 MCP 工具的 HTTP 能力呼叫 Zapier webhook
@server.tool()
async def send_via_zapier(to: str, subject: str, body: str):
    requests.post("https://hooks.zapier.com/hooks/catch/...", json={
        "to": to, "subject": subject, "body": body
    })
```

#### 優缺點

**優點：**
- ✅ 不需要處理 OAuth
- ✅ Zapier/Make 有豐富的郵件模板和邏輯
- ✅ 可串接 5000+ 其他服務

**缺點：**
- ❌ ❌ ❌ 非即時（有延遲）
- ❌ 需要 Zapier/Make 付費方案
- ❌ 雙向溝通複雜（接收郵件需要 polling 或 webhook endpoint）
- ❌ 額外的相依性與費用

---

## 5. 方案四：Gemini CLI + Hermes Gateway 內建郵件平台

### 5.1 架構說明

Hermes Gateway 內建 Email 平台（使用 Python 標準函式庫 `imaplib` + `smtplib`），可以直接收發郵件。

```
使用者發送郵件 → IMAP → Hermes Gateway Email Platform → 處理後回覆 → SMTP
                                                        │
                                              Gemini CLI 可透過 API 觸發
```

### 5.2 整合方式

#### 方式 A：Gemini CLI 透過 Hermes Gateway API 觸發郵件操作

Hermes Gateway 提供 API 端點，Gemini CLI 可以透過 HTTP 請求呼叫：

```bash
# 觸發 Hermes 檢查郵件
curl -X POST http://localhost:8080/api/email/check

# 或者讓 Gemini CLI 透過 shell 工具執行
gemini "執行 hermes gateway 的郵件檢查"
```

#### 方式 B：共用 Himalaya MCP 伺服器

由於 Hermes 和 Gemini CLI 在同一個系統上，可以共用同一個 Himalaya MCP 伺服器：

```bash
# Hermes 已內建 Himalaya skill，直接使用
# Gemini CLI 透過 MCP 存取同一個 Himalaya 實例
gemini mcp add himalaya "python" "/shared/mcp/himalaya_server.py"
```

### 5.3 優缺點

**優點：**
- ✅ 直接利用 Hermes Gateway 已有的郵件基礎設施
- ✅ 不需要重複開發 IMAP/SMTP 邏輯
- ✅ Python 標準函式庫，無需額外套件
- ✅ Hermes Gateway 已處理附件、HTML 轉純文字、自動回覆等

**缺點：**
- ❌ Gemini CLI 無法直接存取 Hermes Gateway 內部函式
- ❌ 需要透過 HTTP API 或共用工具來橋接
- ❌ Hermes Gateway 的郵件平台設計給 Gateway 使用，不是獨立的 API

---

## 6. 方案比較總表

| 評估維度 | 方案一：Gmail API MCP | 方案二：Himalaya MCP | 方案三A：AgentMail | 方案三B：Zapier/Make | 方案四：Hermes Gateway |
|----------|:-----:|:-----:|:-----:|:-----:|:-----:|
| **讀取使用者個人郵件** | ✅ | ✅ | ❌ | ✅ | ✅ |
| **支援多郵件服務** | ❌ 僅 Gmail | ✅ IMAP通用 | ❌ 僅 AgentMail | ✅ | ✅ |
| **開發複雜度** | 🔴 高 | 🟡 中 | 🟢 低 | 🟢 低 | 🟡 中 |
| **OAuth 管理** | 🔴 需要 | 🟡 App Password | 🟢 無 | 🟢 無 | 🟡 App Password |
| **功能完整性** | 🟢 最高 | 🟢 高 | 🟡 中等 | 🟡 中等 | 🟢 高 |
| **Gemini CLI 整合度** | 🟢 MCP 原生 | 🟢 MCP 原生 | 🟢 MCP 原生 | 🟡 Webhook | 🟡 間接 |
| **即時性** | 🟢 即時 | 🟢 即時 | 🟢 即時 | 🔴 有延遲 | 🟢 即時 |
| **可靠性** | 🟢 高 | 🟢 高 | 🟡 中等 | 🟡 中等 | 🟢 高 |
| **費用** | 🟢 免費 (配額內) | 🟢 免費 | 🟡 免費有上限 | 🔴 需付費 | 🟢 免費 |
| **安全性** | 🟢 OAuth 2.0 | 🟡 App Password | 🟢 API Key | 🟡 第三方 | 🟡 App Password |
| **維運成本** | 🟡 中 | 🟢 低 | 🟢 最低 | 🔴 高 | 🟢 低 |

---

## 7. 推薦方案

### 🥇 第一推薦：方案二（Himalaya MCP）

**理由：**
1. **通用性最強** — 支援任何 IMAP/SMTP 郵件服務（Gmail、Outlook、Yahoo、自建郵件伺服器）
2. **整合成本低** — Himalaya 是成熟 CLI 工具，包裝成 MCP 伺服器約 50-100 行程式碼
3. **配置簡單** — 使用 App Password 而非 OAuth 2.0，設定流程簡單
4. **功能完整** — 支援讀取、搜尋、回覆、轉發、附件、多帳戶
5. **安全可靠** — 密碼可透過 `pass` 或系統 keyring 管理

### 🥈 第二推薦：方案一（Gmail API MCP）

**適合情境：** 如果只需要管理 Gmail，且需要進階功能（標籤、篩選規則、自訂分類邏輯）

### 🥉 第三推薦：方案三A（AgentMail）

**適合情境：** 如果需求是讓 AI Agent 擁有**自己的** email 信箱（而非讀取使用者的個人郵件），AgentMail 是最快的方案。

---

## 8. 實作步驟（推薦方案：Himalaya MCP）

### Step 1：安裝 Himalaya CLI

```bash
# 使用預編譯二進位檔（推薦）
curl -sSL https://raw.githubusercontent.com/pimalaya/himalaya/master/install.sh | PREFIX=~/.local sh

# 確認安裝成功
himalaya --version
```

### Step 2：配置 Himalaya

```bash
# 建立配置目錄
mkdir -p ~/.config/himalaya

# 手動建立設定檔（以 Gmail 為例）
cat > ~/.config/himalaya/config.toml << 'EOF'
[accounts.gmail]
email = "your@gmail.com"
display-name = "Your Name"
default = true

backend.type = "imap"
backend.host = "imap.gmail.com"
backend.port = 993
backend.encryption.type = "tls"
backend.login = "your@gmail.com"
backend.auth.type = "password"
backend.auth.cmd = "pass show google/app-password"

message.send.backend.type = "smtp"
message.send.backend.host = "smtp.gmail.com"
message.send.backend.port = 587
message.send.backend.encryption.type = "start-tls"
message.send.backend.login = "your@gmail.com"
message.send.backend.auth.type = "password"
message.send.backend.auth.cmd = "pass show google/app-password"
EOF

# 或使用互動式設定精靈（需要 PTY）
himalaya account configure
```

### Step 3：建立 Himalaya MCP 伺服器

```python
#!/usr/bin/env python3
"""
himalaya_mcp_server.py — Himalaya Email MCP Server for Gemini CLI

Usage:
    python himalaya_mcp_server.py
    gemini mcp add himalaya "python" "/path/to/himalaya_mcp_server.py"
"""

import subprocess
import json
import os
from typing import Optional

# 嘗試匯入 MCP SDK
try:
    from mcp.server import Server
except ImportError:
    # 如果 MCP SDK 不可用，使用 simpledic 方式
    import sys
    print("MCP SDK not found. Install with: pip install mcp", file=sys.stderr)
    sys.exit(1)


HIMALAYA_CMD = os.environ.get("HIMALAYA_CMD", "himalaya")
SERVER_NAME = os.environ.get("HIMALAYA_MCP_NAME", "himalaya")

server = Server(SERVER_NAME)


def _run_himalaya(*args, input_text: Optional[str] = None) -> str:
    """執行 Himalaya 指令並回傳輸出"""
    cmd = [HIMALAYA_CMD] + list(args)
    result = subprocess.run(
        cmd,
        input=input_text,
        capture_output=True,
        text=True,
        timeout=30,
    )
    if result.returncode != 0:
        raise RuntimeError(f"Himalaya error: {result.stderr.strip()}")
    return result.stdout.strip()


@server.tool()
async def list_folders() -> str:
    """列出所有郵件資料夾"""
    return _run_himalaya("folder", "list")


@server.tool()
async def list_emails(
    folder: str = "INBOX",
    page: int = 1,
    page_size: int = 20,
    search: Optional[str] = None,
) -> str:
    """
    列出郵件列表
    
    Args:
        folder: 郵件資料夾名稱 (預設: INBOX)
        page: 頁碼
        page_size: 每頁筆數
        search: 搜尋關鍵字 (例如: "from:john subject:meeting")
    """
    args = ["envelope", "list",
            "--folder", folder,
            "--page", str(page),
            "--page-size", str(page_size),
            "--output", "json"]
    
    if search:
        args.extend(search.split())
    
    raw = _run_himalaya(*args)
    return raw


@server.tool()
async def read_email(message_id: int) -> str:
    """
    讀取郵件完整內容
    
    Args:
        message_id: 郵件 ID (從 list_emails 取得)
    """
    return _run_himalaya("message", "read", str(message_id))


@server.tool()
async def search_emails(query: str, folder: str = "INBOX") -> str:
    """
    搜尋郵件
    
    Args:
        query: 搜尋條件 (e.g. "from user@example.com subject project")
        folder: 搜尋的資料夾
    """
    args = ["envelope", "list", "--folder", folder, "--output", "json"]
    args.extend(query.split())
    return _run_himalaya(*args)


@server.tool()
async def send_email(to: str, subject: str, body: str) -> str:
    """
    發送郵件
    
    Args:
        to: 收件人 email
        subject: 主旨
        body: 郵件內容
    """
    mml = f"To: {to}\nSubject: {subject}\n\n{body}"
    return _run_himalaya("template", "send", input_text=mml)


@server.tool()
async def reply_to_email(message_id: int, body: str) -> str:
    """
    回覆郵件
    
    Args:
        message_id: 要回覆的郵件 ID
        body: 回覆內容
    """
    # 取得回覆模板
    template = _run_himalaya("template", "reply", str(message_id))
    # 插入回覆內容（在分隔線後）
    lines = template.split("\n")
    inserted = False
    for i, line in enumerate(lines):
        if line.strip() == "" and not inserted:
            lines.insert(i + 1, body)
            inserted = break
    modified = "\n".join(lines)
    return _run_himalaya("template", "send", input_text=modified)


@server.tool()
async def move_message(message_id: int, target_folder: str) -> str:
    """
    移動郵件到其他資料夾
    
    Args:
        message_id: 郵件 ID
        target_folder: 目標資料夾名稱
    """
    return _run_himalaya("message", "move", str(message_id), target_folder)


@server.tool()
async def delete_message(message_id: int) -> str:
    """
    刪除郵件
    
    Args:
        message_id: 郵件 ID
    """
    return _run_himalaya("message", "delete", str(message_id))


@server.tool()
async def mark_as_read(message_id: int) -> str:
    """
    標記郵件為已讀
    
    Args:
        message_id: 郵件 ID
    """
    return _run_himalaya("flag", "add", str(message_id), "--flag", "seen")


@server.tool()
async def get_attachment(message_id: int, download_dir: str = "~/Downloads") -> str:
    """
    下載郵件附件
    
    Args:
        message_id: 郵件 ID
        download_dir: 下載目錄
    """
    return _run_himalaya("attachment", "download", str(message_id),
                         "--dir", download_dir)


@server.tool()
async def summarize_inbox(max_emails: int = 10) -> str:
    """
    獲取收件匣摘要（取得郵件列表讓 AI 分析）
    """
    emails = list_emails("INBOX", 1, max_emails)
    return f"Recent emails:\n{emails}"


def main():
    print(f"Starting Himalaya MCP server: {SERVER_NAME}", file=sys.stderr)
    print(f"Using Himalaya at: {HIMALAYA_CMD}", file=sys.stderr)
    server.run()


if __name__ == "__main__":
    main()
```

### Step 4：註冊 MCP 伺服器到 Gemini CLI

```bash
# 直接註冊
gemini mcp add himalaya "python" "/path/to/himalaya_mcp_server.py"

# 或透過環境變數自訂
HIMALAYA_CMD=himalaya HIMALAYA_MCP_NAME=himalaya-gmail \
  gemini mcp add himalaya-gmail "python" "/path/to/himalaya_mcp_server.py"

# 確認註冊成功
gemini mcp list
```

### Step 5：測試整合

```bash
# 測試 Gemini CLI 透過 MCP 操作郵件
gemini "幫我檢查 Gmail 收件匣，列出最近 5 封未讀郵件"

# 進階測試：AI 自動分類
gemini "檢查我的未讀郵件，將重要的歸類到 Important 資料夾"

# 自動回覆測試
gemini "檢查是否有來自 boss@company.com 的郵件，如果有的話幫我回覆 '收到，我會處理'"
```

---

## 9. 注意事項

### 9.1 安全性

| 項目 | 建議 |
|------|------|
| **密碼儲存** | 不要直接在 config.toml 使用 `auth.raw`，使用 `pass` 或系統 keyring |
| **App Password** | Gmail 需要啟用 2FA 並產生 App Password（非主密碼） |
| **config.toml 權限** | `chmod 600 ~/.config/himalaya/config.toml` |
| **MCP 伺服器權限** | MCP 伺服器不要以 root 執行 |
| **郵件內容** | 注意郵件可能包含敏感資訊，Agent 的回覆也應謹慎 |

### 9.2 Token / 金鑰管理

- **Gmail App Password**：不會過期，但若 Google 帳戶密碼變更或 2FA 重設則需重新產生
- **OAuth 2.0 (方案一)**：access token 有效 1 小時，需要 refresh token 機制
- **AgentMail API Key**：可在控制台管理，有撤銷機制

### 9.3 Rate Limit

| 服務 | 限制 |
|------|------|
| **Gmail API** | 每日 15 億個 quota units（讀取約 5 units/請求，發送約 100 units/請求） |
| **Gmail IMAP** | 每分鐘約 10-15 個連線，過多會被暫時封鎖 |
| **AgentMail** | 免費方案每月 3,000 封 |
| **Himalaya (直接 IMAP)** | 遵循郵件伺服器的 IMAP 限制 |

### 9.4 實作注意事項

1. **MCP 伺服器 port 管理**：確保 MCP 伺服器的 port 不與其他服務衝突
2. **錯誤處理**：IMAP 連線可能因網路不穩而中斷，需要 retry 機制
3. **郵件 ID 範圍**：Himalaya 的郵件 ID 是基於當前資料夾的相對 ID，切換資料夾後需重新查詢
4. **併發問題**：Gemini CLI 和 Hermes 同時操作郵件可能產生衝突，建議使用同一個設定檔
5. **日誌監控**：建議啟用 Himalaya 的除錯日誌 `RUST_LOG=debug himalaya ...`
6. **多帳戶支援**：Himalaya 支援多帳戶，透過 `--account` 參數切換

### 9.5 潛在風險

- ⚠️ **IMAP 連線穩定性**：長時間 idle 可能斷線，需要實作 reconnect
- ⚠️ **郵件格式相容性**：某些 HTML 郵件或特殊編碼可能需要額外處理
- ⚠️ **Gemini CLI 工具呼叫權限**：需要確保 Gemini CLI 有權限執行子程序
- ⚠️ **資源消耗**：大量郵件處理可能消耗較多記憶體

---

## 10. 附錄：技術參考

### 10.1 相關工具連結

| 工具 | 連結 |
|------|------|
| Gemini CLI (OpenRouter Edition) | https://github.com/chameleon-nexus/gemini-cli |
| Himalaya (CLI Email Client) | https://github.com/pimalaya/himalaya |
| Hermes Agent | https://github.com/nousresearch/hermes-agent |
| AgentMail MCP | https://github.com/agentmail-to/agentmail-mcp |
| Google Gmail API | https://developers.google.com/gmail/api |
| MCP SDK (Python) | https://github.com/modelcontextprotocol/python-sdk |

### 10.2 快速安裝指令

```bash
# Himalaya 安裝
curl -sSL https://raw.githubusercontent.com/pimalaya/himalaya/master/install.sh | PREFIX=~/.local sh

# Gmail API Python 套件（方案一用）
pip install google-api-python-client google-auth-oauthlib

# MCP Python SDK（MCP 伺服器用）
pip install mcp

# AgentMail MCP（方案三A用）
npx -y agentmail-mcp --help

# pass 密碼管理器（建議）
sudo apt install pass
pass init "your-gpg-key-id"
pass insert google/app-password
```

### 10.3 Gemini CLI MCP 管理指令

```bash
# 列出所有 MCP 伺服器
gemini mcp list

# 新增 MCP 伺服器
gemini mcp add <name> <command> [args...]

# 移除 MCP 伺服器
gemini mcp remove <name>
```

### 10.4 Himalaya 常用指令速查

```bash
# 列出郵件
himalaya envelope list --folder INBOX --output json

# 讀取郵件
himalaya message read 42

# 發送郵件（非互動模式）
cat << EOF | himalaya template send
To: recipient@example.com
Subject: Hello

Email body here.
EOF

# 搜尋郵件
himalaya envelope list from user@example.com subject meeting

# 移動郵件
himalaya message move 42 "Archive"

# 標記已讀
himalaya flag add 42 --flag seen

# 下載附件
himalaya attachment download 42 --dir ~/Downloads
```

---

> **報告完畢** — 本報告研究了五種 Gemini CLI 整合郵件管理的方案，其中 **Himalaya MCP** 被推薦為首選方案，因其通用性最高、整合成本最低、功能最完整。如需進一步討論或實作協助，請告知。
