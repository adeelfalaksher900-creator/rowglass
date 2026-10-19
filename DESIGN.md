---
version: "0.4"
colors:
  ink: "#20243b"
  muted: "#636b81"
  primary: "#4358d8"
  paper: "#f4f5f9"
  surface: "#ffffff"
  line: "#dfe3ed"
  ice: "#edf0ff"
  coral: "#a7432d"
  success: "#19684e"
  shell: "#171d35"
  editor: "#131c30"
  editorText: "#e0e7f5"
typography:
  body:
    fontFamily: "IBM Plex Sans, sans-serif"
  display:
    fontFamily: "Sora, sans-serif"
  code:
    fontFamily: "IBM Plex Mono, monospace"
rounded:
  panel: "12px"
  control: "7px"
spacing:
  panel: "18px"
  section: "26px"
components:
  button:
    rounded: "7px"
    backgroundColor: "{colors.primary}"
    textColor: "{colors.surface}"
  workbench:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
  sidebar:
    backgroundColor: "{colors.shell}"
  queryEditor:
    backgroundColor: "{colors.editor}"
    textColor: "{colors.editorText}"
  secondaryText:
    textColor: "{colors.muted}"
  selectedFixture:
    backgroundColor: "{colors.ice}"
  mismatchBadge:
    textColor: "{colors.coral}"
  successBadge:
    textColor: "{colors.success}"
---
# Rowglass design

## Overview
Product register. An indigo SQL review desk: a midnight navigation shell, syntax-colored SQL editor and light evidence canvas. The user explicitly requested this system-level redesign on 19 October after rejecting the pale v0.3 design. The subject-specific signature is the executed disagreement and reduced database witness. No marketing hero, invented live-agent activity, decorative metrics or warehouse connection.

Better Design's real developer-editor references informed pane hierarchy and contrast; no third-party screen was copied. This change trades the prior airy, uniformly light layout for stronger pane separation and earlier visibility of the working query. The engineering audience bears a little more first-view information density; task clarity and readable code take precedence. English is the supported UI locale.

## Colors
Runtime ownership model B: `:root` in `src/style.css` is canonical; this file mirrors the accepted roles. Direct mappings: colors.ink → --ink; muted → --muted; primary → --primary; paper → --paper; surface → --surface; line → --line; ice → --ice; coral → --coral; success → --success; shell → --shell; editor → --editor; editorText → --editor-text.

Cobalt supplies actions and selected evidence. Copper denotes disagreement, jade denotes finite agreement, amber denotes unavailable/unverified provider status. Text accompanies every state. Dark-shell text uses --shell-text/--shell-muted; SQL uses --editor-text/--editor-muted with separate syntax roles. Surface changes must also change foreground roles. The mixed light/dark composition is one deliberate theme, not a light/dark preference switch.

## Typography
Self-hosted Sora 500 for page titles, IBM Plex Sans 400/500/600 for application copy and IBM Plex Mono 400 for SQL, table identities and technical values. No external font request. Page titles are 27px on desktop, 25px on phones. Body is 14px, query text 13px/24px on desktop and 12px/24px on phones. Important long SQL remains horizontally reachable, never ellipsized. Labels stay secondary; measured disagreements and the actual code lead.

## Layout
68px desktop header; 240px case/schema sidebar; fluid main canvas. The page title, computed disagreement summary and working query come first. Query and agent form the initial split pane. The behavior contract, baseline explanation and reference SQL are accessible native disclosures inside the query panel. Draft controls follow the editor. A fixture list, selected expected/proposed results and reduced witness remain together below.

At 960px the agent and query stack. At 680px the sidebar becomes a horizontally scrollable case picker, navigation wraps and all review panels stack. The document owns content scrolling. Desktop case navigation has its own bounded scroller; code/tables own explicit internal overflow. No page-level overflow clipping or hidden scrollbar.

## Elevation & Depth
One subtle lift on the dark editor. Evidence uses flat bordered surfaces; mismatch tables and the reduction panel get semantic warm backgrounds. No gradients, glass blur or ornamental charts. Strong background separation does the hierarchy work.

## Shapes
12px panels, 7px controls, 5px badges. Rounded status markers are small and semantic. Use a filled selected case and fixture row, not a colored-edge-only active state. The wordmark uses an exact Lucide database icon, with its license bundled.

## Components
Button, Badge, DataTable and Output in `src/App.jsx` retain shared ownership. `src/SqlEditor.jsx` owns the native SQL textarea, synchronized presentation layer and line gutter. `src/sql-tokens.mjs` is presentation-only: it preserves every source character and never authorizes SQL. The overlay is aria-hidden; forced-colors mode restores native visible textarea text. `src/Icons.jsx` contains exact Lucide shapes retrieved through Supericons, without remote image requests.

Native details owns contract, baseline, draft, fixture, diff and copyable artifact disclosures. The four-topic SQLite selector remains native, accepting platform-owned popup geometry. Import uses a JSON textarea and explicit synthetic-data checkbox. Buttons have 44px minimum height; fixture buttons are at least 50px. Tables have no selection or sort behavior. No account, billing, date picker or modal is implemented.

## Do's and Don'ts
Calculate visible counts from executed results. Keep model proposals, hand-authored references, offline controls and provider observations distinct. Keep model actions disabled when access is disabled, even if a key exists. Never display an unchecked reference with a stale passing result. Never claim model accuracy from the frozen checker controls. Honor focus-visible, reduced motion and forced-colors fallbacks. Run the static premium audit and fresh browser state checks; a source-only audit is not accessibility certification.

## v0.3 reconciliation

| Previous rule | Deliberate v0.4 change | Reason |
|---|---|---|
| Quiet petrol/ice palette | Indigo shell, cobalt actions, dark syntax editor | Explicit user redesign request |
| Three large review-stage blocks | Computed disagreement summary near the query | Earlier access to the real task |
| Full contract above editor | Accessible query-panel disclosure | Preserve important context without pushing code below the fold |
| Plain 10–11px query text | Native textarea with larger syntax presentation | Readable source and stronger editor identity |
| Same weight across all panes | Dark query, neutral evidence, warm witness | Visually separate input, measured outputs and regression handoff |

Verification evidence belongs in `docs/VALIDATION.md` and `docs/qa/`. The previous screenshots remain historical evidence, not verification of this release.
