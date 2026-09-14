<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## Subagent model policy

- Never use GPT-6 Astra for subagents in this repository.
- The maximum allowed subagent configuration is `gpt-5.6-sol` with `reasoning_effort: medium`.
- Use a lower-tier model when it is sufficient, but never exceed this ceiling.
