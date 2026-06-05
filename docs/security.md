---
title: Security policy
---

# Security policy

## Supported versions

| Version | Supported |
|---------|-----------|
| 0.1.x   | yes       |

## Reporting a vulnerability

Please **do not** open a public GitHub issue for security vulnerabilities. Public issues can expose users to risk before a fix is available.

This project is maintained by a **single developer**. Use one of the private channels below.

### Preferred: GitHub Private Vulnerability Reporting

Report through GitHub’s private vulnerability form:

1. Open [github.com/arcpx-eng/arc-dag](https://github.com/arcpx-eng/arc-dag)
2. Open the **Security** tab
3. Click **Report a vulnerability**

Submissions are visible only to the maintainer. Use this channel to discuss and resolve the issue before any public disclosure.

Direct link: [Report a vulnerability](https://github.com/arcpx-eng/arc-dag/security/advisories/new)

Requires [private vulnerability reporting](https://docs.github.com/en/code-security/security-advisories/guidance-on-reporting-and-writing-information-about-vulnerabilities/privately-reporting-a-security-vulnerability) to be enabled on the repository.

### Alternative: private email

If you cannot use GitHub’s form, email the repository owner privately. Do not CC public mailing lists or post details on social media.

### What to include

- Description of the issue
- Steps to reproduce
- Affected version(s)
- Impact assessment (if known)
- Any suggested fix or mitigation (optional)

I will acknowledge receipt and work on a fix or coordinated disclosure as appropriate.

## User responsibilities

- **API keys:** Pass LLM credentials via `GraphEngine({ llm: { apiKey, … } })` from environment variables or secret managers — never commit them into pipeline JSON or checked-in `globalSettings` files. See [LLM configuration](./llm-config).
- **Pipeline JSON:** Treat exported graphs as configuration that may contain prompts and URLs; review before sharing.
- **nodeExecutor:** You control all network calls; audit handlers that fetch external URLs or execute code.

## Scope

This library schedules DAG execution locally in your process. It does not authenticate users, sandbox `nodeExecutor` code, or validate remote URLs. Those concerns belong in your application layer.
