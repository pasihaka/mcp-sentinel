# 🛡️ MCP Sentinel

**Autonomous Protocol Health, Schema-Drift & Security Sentinel for Remote Model Context Protocol (MCP) Servers.**

[![MCP Status](https://img.shields.io/badge/mcp-operational-4c1)](https://github.com/pasihaka/mcp-sentinel)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue)](https://www.typescriptlang.org/)

Traditional uptime monitors stop at `HTTP 200 OK`. **MCP Sentinel** connects over Server-Sent Events (SSE) and HTTP POST, conducts real **JSON-RPC 2.0** protocol handshakes, validates tool schemas against JSON Schema draft-07/2020-12, tracks breaking schema drift, scans for leaked API credentials, and renders dynamic vector status badges.

---

## ⚡ Key Features

* **Real JSON-RPC 2.0 Handshake:** Subscribes to SSE streams, negotiates protocol version `2024-11-05`, calls `initialize` $\rightarrow$ `tools/list` $\rightarrow$ `resources/list`.
* **Ajv Schema Validation:** Detects malformed tool input schemas, syntax errors, and missing property declarations.
* **Breaking Schema Drift Detection:** Computes canonical SHA-256 hashes across tool definitions. Detects removed tools, deleted parameters, mutated parameter types, and newly added required fields.
* **Secret & Credential Scanner:** Audits tool descriptions and parameters for exposed OpenAI/Anthropic API keys, AWS credentials, and hardcoded database connection strings with automated redaction.
* **Dynamic GitHub README Badges:** Embeddable, edge-cached SVG status and schema verification badges.
* **Multi-Channel Alerting:** Instant notifications via Slack Block Kit and Discord Webhook embeds.

---

## 💳 Pricing Plans

MCP Sentinel is a cloud-hosted B2B developer SaaS utility.

| Tier | Price | Features |
| :--- | :--- | :--- |
| **Free Community** | **$0 / month** | 1 remote server, 30-minute check intervals, dynamic GitHub badge, email alerts. |
| **Developer Pro** | **$19 / month** | Up to 5 remote servers, 1-minute synthetic checks, breaking schema drift alerts, Slack & Discord webhooks, 30-day logs. |
| **Team** | **$49 / month** | Up to 20 remote servers, continuous secret & token leak scanning, multi-region synthetic checks, PagerDuty integration. |

---

## 🚀 Quick Start & Architecture

Built to run entirely on Cloudflare Workers and Cloudflare D1 serverless edge.

### Install Dependencies & Run Tests
```bash
npm install
npm test
npm run typecheck
```

### Run Public Audit via CLI
```bash
node dist/scripts/github-audit.js <REMOTE_MCP_SERVER_URL>
```

---

## 📜 Support & Policies
* **Customer Support:** support@mcpsentinel.dev
* **Refund Policy:** 14-day full refund guarantee on all subscription tiers.
* **Cancellation:** Self-serve cancellation at any time via the Stripe Customer Billing Portal.
