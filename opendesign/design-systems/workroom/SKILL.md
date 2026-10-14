# Workroom design system

Purpose: a quiet Korean-language workshop desk where a learner moves from instructions to source material to a saved result.

Reference: the user-supplied monochrome course outline and the confirmed 2-day practical curriculum. No official university identity is implied.

Tone: calm, practical, editorial. A charcoal navigation rail anchors a warm paper workspace. Muted olive and a single lime accent indicate progress and actions. No decorative imagery or model-generated content is needed for this learning task.

Typography: Noto Sans KR for Korean text, IBM Plex Mono for exercise indices and English labels; readable fallbacks when web fonts are unavailable.

Structure: persistent curriculum navigation, overview, six exercise screens, workbook, preparation guide. Exercises share three stages: instruction, materials, work. Maximum-width content and responsive single-column mobile layouts.

Behavior: every visible control has a real destination or action. Local persistence is explicit. Example answers are disclosed on demand after practice. Completion requires a result and three verification checks.

Implementation: src/style.css is the canonical stylesheet; src/main.jsx contains application components. The token file records the shared palette. See opendesign/PROVENANCE.md for the upstream OpenDesign skills.
