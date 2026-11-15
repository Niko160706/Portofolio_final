# THE HUMAN PROTOCOL: Editorial Portfolio

A vertically scrolling engineering portfolio for **Niko Rajani Syahputra Pane**, Informatics student at Telkom University Surabaya and candidate for a Semester 6 Data Engineering internship.

The visual direction is **modern editorial first, old-web fragments second**. There is no desktop shell, wallpaper, taskbar, Start menu, or application window framing. The site is a near-white, black-on-white editorial page with generous whitespace, strong Inter 700 headlines, and a small number of bordered utility fragments.

`DESIGN.md` v3 is the visual contract. The SRS remains authoritative for facts, routes, accessibility, content honesty, and the four scripted anomalies. The installed `antislop` core skill is the quality filter.

---

## 1. Page structure

1. **Hero**: typographic statement ("Interfaces that answer back."), name and role in the eyebrow, introduction, three CTAs, and the scripted MORO companion anchored at the right.
2. **Selected Work**: four varied project showcases, not repeated windows.
   - Deep Research: editorial feature with a dark research-run preview and a labelled owner-reported 84% recall metric.
   - Visualize: live 2D matrix demo in a bordered preview, with the original Three.js context stated honestly.
   - UMKM / Bilqish: screenshot-led case with a labelled UI study and project facts.
   - Starlink Reseller: screenshot-led catalog case with a labelled schematic comparison; no client-identifying pricing.
3. **Research / Lab**: project index table plus a small lab-utilities fragment. Hidden files and diagnostics live here.
4. **How I Work**: three numbered principles in a large editorial list.
5. **About**: bio, timeline, skills with evidence, awards and certifications, plus a compact `profile.dat` utility box.
6. **Contact**: black contact band with email copy, LinkedIn, GitHub, and CV. No contact form.

---

## 2. Visual system

- Background `#FAFAF7`, surface `#FFFFFF`.
- Primary text `#111111`, secondary `#5A5A5A`.
- Strong border `#1E1E1E`, soft border `#D9D9D0`.
- Primary/success accent `#507C5D` (MORO green); anomaly `#8B1E2D`.
- Retro fragments use light gray surfaces, 1px black borders, inset bevels, dotted separators, Silkscreen labels, VT323 short dialog text, and IBM Plex Mono metadata.
- No bitmap fonts in body copy or the hero. Silkscreen is limited to micro labels. VT323 is reserved for short retro dialog and anomaly-note text.
- MORO is a scripted canvas companion, not an OS window or a live AI.

### Typography

| Role | Face | Use |
|---|---|---|
| Display | **Inter 700** | hero, section titles, project titles, major headlines |
| Body | **Inter 400/600** | descriptive copy, case studies, UI copy, summaries |
| Technical | **IBM Plex Mono** | metadata, logs, labels, tables |
| Bitmap accent | **Silkscreen** | small retro labels only |
| Retro dialog / anomaly accent | **VT323** | short retro dialog text and anomaly-note body only |

All fonts are self-hosted in `public/fonts/` under the SIL Open Font License 1.1. See `public/fonts/LICENSES.md`. No Google Fonts request is made at runtime.

---

## 3. Anomaly layer

The anomaly system is preserved but moved out of OS windows. It appears as a small fixed **system note** with a gray utility header in the lower-right corner, with no backdrop and no OS window titlebar.

| ID | Trigger | Reaction |
|---|---|---|
| `AN-01` | MORO dialogue → `Inspect unusual signal` | intercepted message note; portfolio content is unchanged |
| `AN-02` | Research Console → `/inspect` (or the trace inspect control) | `REASSURANCE_PROTOCOL: ACTIVE` line and scripted note |
| `AN-03` | Lab → `Show hidden files` → `observer.log` → `Inspect` | fictional artifact row and scripted note |
| `AN-04` | Lab utilities → `Run diagnostics` after AN-01 or AN-02 | conflicting diagnostic log inside the system note |

The footer `Effects: On/Off` control and the Preferences dialog disable or reset all scripted effects. Anomaly text lives in `src/data/narrative.ts`; it is fictional, deterministic, and local only.

---

## 4. Structure

```text
public/
├── assets/companions/moro/       # manifest, WebP atlas, PNG fallback
├── fonts/                        # self-hosted WOFF2 + LICENSES.md
└── resume.pdf

src/
├── components/
│   ├── v3/
│   │   ├── SiteHeader.tsx
│   │   ├── Hero.tsx
│   │   ├── MoroCompanion.tsx
│   │   ├── SelectedWork.tsx
│   │   ├── ResearchConsole.tsx
│   │   ├── VectorDemo.tsx
│   │   ├── LabSection.tsx
│   │   ├── MethodsSection.tsx
│   │   ├── AboutSection.tsx
│   │   ├── ContactSection.tsx
│   │   ├── SiteFooter.tsx
│   │   ├── UtilityDialog.tsx
│   │   └── SettingsPanel.tsx
│   ├── editorial/
│   │   └── EditorialApp.tsx
│   ├── narrative/
│   │   └── AnomalyMessage.tsx
│   ├── DocumentHeader.astro
│   └── DocumentFooter.astro
├── data/                         # profile, projects, scripted narrative
├── layouts/
│   ├── BaseLayout.astro
│   ├── DocumentLayout.astro
│   └── CaseStudyLayout.astro
├── lib/
│   ├── moroSpritePlayer.ts       # canvas sprite player
│   ├── narrativeMachine.ts
│   ├── storage.ts
│   └── windowState.ts
├── pages/
└── styles/
    ├── fonts.css
    ├── tokens.css
    ├── global.css
    ├── editorial.css             # document/content compatibility
    ├── document.css
    ├── anomaly.css               # embedded system-note layer
    ├── refinement.css            # current editorial composition
    ├── moro-companion.css        # companion positioning and dialogue
    └── v3.css                    # V3 editorial system
```

The old V2 OS components and styles have been removed from the active build. Historical Selenium scripts are archived in `tests/legacy-v2/`. Superseded Playwright scripts for earlier V3/refinement UI are archived in `tests/legacy-superseded/`. The current companion regression is `tests/moro-placement.cjs`.

---

## 5. Getting started

Prerequisites: Node.js >= 22.19, npm >= 10.

```bash
npm install
npm run dev      # http://localhost:4321
npm run build
npm run preview
npm test         # Vitest unit and static acceptance tests
```

`npm run dev` uses `scripts/dev.mjs` to force Astro into foreground mode. This avoids Astro 7's agent auto-background timeout on WSL/Windows mounts. First start can take roughly 10-15 seconds on this filesystem.

Alter visual QA builds:

```bash
npx astro build --mode alter-debug
# serve dist, then open:
# /?alterDebug=1          story-engine inspector
# /?alterFracture=G3      fracture proof-of-concept
```

The debug inspector and fracture lab are not available in the default production build.

A V3 Selenium smoke test is included:

```bash
python tests/v3_e2e.py
```

It uses `PORTFOLIO_BASE` if set, otherwise `http://localhost:4321`. In this WSL session the Selenium/Chrome interop was unstable; final browser QA was run with Playwright against the built site.

Current MORO browser regressions:

```bash
NODE_PATH=/path/to/playwright/node_modules \
PORTFOLIO_BASE=http://localhost:4321 \
node tests/moro-placement.cjs

NODE_PATH=/path/to/playwright/node_modules \
PORTFOLIO_BASE=http://localhost:4321 \
node tests/moro-preset-feedback.cjs
```

- `moro-placement.cjs` checks hero/floating/Visualize positioning, rapid scroll, resize, and mobile viewport behavior.
- `moro-preset-feedback.cjs` checks that Identity, Rotate 45°, Shear X, and Reflect Y produce the correct MORO message, determinant, and no page errors.

Playwright is not a package dependency; point `NODE_PATH` at an existing Playwright install.

### Switching between Windows and WSL/Linux

Astro, Rolldown, and Rollup use platform-specific optional native bindings. Do not reuse the same `node_modules` between Windows and WSL/Linux.

If `npm run dev` reports `Cannot find native binding` after switching platforms:

```bash
# Run this in the same OS that will run the dev server.
npm ci

# If npm's optional-dependency bug still blocks it:
rm -rf node_modules package-lock.json
npm install
```

On Windows PowerShell, use:

```powershell
Remove-Item -Recurse -Force node_modules
Remove-Item package-lock.json   # only if npm ci still fails
npm install
npm run dev
```

The source tree does not need to change; this is an environment/binding issue.

---

## 6. MORO companion

MORO is a small scripted canvas companion. It is not a live model, chatbot, or OS window.

- Animation: `public/assets/companions/moro/manifest.json` maps 9 states and 57 frames to `spritesheet.webp`; `fallback.png` is the labelled static fallback.
- Placement: `MoroCompanion` uses three modes: `hero` anchored at `#moro-hero-anchor`, `visualize` anchored at `#moro-visualize-anchor`, and `floating` at the viewport edge.
- Safety: a mode is only selected when the full sprite fits inside the viewport below the sticky header. Targets are clamped, and resize / `visualViewport` changes recompute the floating position.
- Interaction: click or tap to open the dialogue; double/triple tap reactions; drag or arrow keys to move; long press for a review pose; movement toggle; disable/enable; reduced-motion support.
- Persistence: `moro-disabled` and `moro-motion-disabled` are local storage preferences. No telemetry or network requests.
- Limitation: the `failed` animation is exposed by the player but not triggered because the current illustrative research console has no real failure event. No failure is fabricated.

## 7. Content honesty

- The 84% recall figure is owner-reported from a 50-query local benchmark and is labelled as such in the Deep Research preview and case study. It was not independently re-run here.
- UMKM visuals are a labelled UI schematic, not a client screenshot.
- The Starlink table is a schematic comparison; client-identifying pricing and credentials are omitted.
- There are no invented clients, testimonials, screenshots, or live AI services.
- The Visualize demo is an honest 2D rebuild of an original Three.js prototype.

Known limits:

- No hosted live demos; repositories and constraints are linked instead.
- No backend, contact form, analytics, or live model.
- Anomaly state and MORO preferences are local storage only.
- The MORO `failed` animation is not wired; the current illustrative preview has no real failure event.
- Superseded Playwright scripts are archived in `tests/legacy-superseded/` because their selectors no longer match the active UI.
- Earlier unused components (`AssistantWidget`, `MoroCharacter`, `ProductPreview`, `MatrixDemo`) remain in source history but are not imported by the active build.
- The auxiliary antislop skills `antislop-ui`, `antislop-copywriting`, and `antislop-human` are not installed; only the core v3.2.28 skill is applied. This is stated rather than claimed.

The detailed anti-slop delivery report is in `DELIVERY_GATE.md`.
