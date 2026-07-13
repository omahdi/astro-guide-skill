# astro-guide

An [Agent Skill](https://agentskills.io) for scaffolding distill.pub-style
Astro documentation guides with data-driven D3.js grid diagrams. Single page
by default, or a multi-chapter "docbook" with a left sidebar.

## Install

**Codex** (via gh CLI):
```bash
gh skill install omahdi/astro-guide-skill astro-guide --agent codex --scope user
```

**Claude Code** (via gh CLI):
```bash
gh skill install omahdi/astro-guide-skill astro-guide --agent claude-code --scope user
```

**Amp**:
```bash
amp skill add omahdi/astro-guide-skill/astro-guide
```

**GitHub CLI** (any supported agent — specify `--agent` and `--scope` as needed):
```bash
gh skill install omahdi/astro-guide-skill astro-guide --agent <agent>
```

See `gh skill install --help` for all supported agents and options.

## Layout

```
skills/astro-guide/
├── SKILL.md          # skill entry point + quick start
├── assets/           # Astro scaffold (copy into your project)
├── reference/        # deep-dive docs: content, diagrams, docbook, interactive, orchestration
└── scripts/          # screenshot helper for visual verification
```

## License

MIT — see [LICENSE](LICENSE).
