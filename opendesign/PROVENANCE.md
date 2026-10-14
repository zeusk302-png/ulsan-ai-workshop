# OpenDesign provenance

- Repository: https://github.com/manalkaff/opendesign
- Skill source commit: `cecd9bb6b59408cb96a3974449b8e6ef9f5b17bb`
- Setup skill: https://raw.githubusercontent.com/manalkaff/opendesign/cecd9bb6b59408cb96a3974449b8e6ef9f5b17bb/skills/setup-opendesign/SKILL.md
- Preview skill: https://raw.githubusercontent.com/manalkaff/opendesign/cecd9bb6b59408cb96a3974449b8e6ef9f5b17bb/skills/run-opendesign/SKILL.md
- Viewer downloaded from the URL required by the setup skill: https://raw.githubusercontent.com/manalkaff/opendesign/main/skills/opendesign/viewer.html
- Viewer SHA-256: `997514c7e099015531f64ab7e6fc267eecd8577f1379cfb7d06a386943d5b5f9`
- Setup date: 2026-10-14 (Asia/Seoul).
- Main design skill: https://github.com/manalkaff/opendesign/blob/cecd9bb6b59408cb96a3974449b8e6ef9f5b17bb/skills/opendesign/SKILL.md
- Frontend design skill: https://github.com/manalkaff/opendesign/blob/cecd9bb6b59408cb96a3974449b8e6ef9f5b17bb/skills/frontend-design/SKILL.md
- Interactive prototype skill: https://github.com/manalkaff/opendesign/blob/cecd9bb6b59408cb96a3974449b8e6ef9f5b17bb/skills/interactive-prototype/SKILL.md

The user confirmed this exact repository after the initial app-plugin ambiguity. The existing 2-day curriculum and attached monochrome course outline serve as the brief and visual reference. This task implements a real static learning application, not a disposable prototype. Durable cross-device storage is deliberately implemented as explicit local JSON export/import, without an account or server.

Setup and independent browser verification were delegated as prescribed by the skills. The host application's completion workflow retains the parent task through verification and deployment. Vite serves the application and OpenDesign viewer on port 8289 because the application uses JSX modules that a plain Python server cannot compile.

The viewer follows upstream `main` at download time; the skill instructions above are pinned to the listed commit. The saved viewer hash identifies the exact downloaded artifact.

## Preview

Serve the project root over HTTP on port **8289** and open http://localhost:8289/opendesign/ . Before starting a server, check the port and reuse an existing server if `/opendesign/index.html` returns HTTP 200. If the port belongs to another application, report the conflict instead of stopping that application.

On Windows, the run skill prefers Python, then Python 3, then Node. With Python available, launch from the project root using `Start-Process python -ArgumentList '-m','http.server','8289' -WorkingDirectory (Get-Location) -WindowStyle Hidden`, then verify the port is listening. No preview server was started during initial setup.
