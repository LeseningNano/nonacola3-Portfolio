<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## Subagent model policy

- Use `gpt-5.6-sol` with `reasoning_effort: medium` for new features, architecture decisions, complex diagnosis, and tasks that need broader reasoning.
- Use `gpt-5.6-terra` for bounded feature changes, UI adjustments, targeted fixes, and test additions when the implementation plan is already clear.
- Use `gpt-5.6-luna` only for simple, mechanical, low-risk work when it is sufficient.
- Do not automatically escalate to GPT-6 Astra. Use it only after Sol and Terra cannot resolve the task, explain the specific blocker to the user, and receive explicit user authorization for that escalation.
- For every spawned subagent, set both its runtime model and reasoning effort explicitly, then report the actual runtime metadata when the platform makes it available. If it is unavailable, state that it could not be verified rather than inferring it.
