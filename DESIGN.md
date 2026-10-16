---
version: alpha
colors:
  ink: "#192b38"
  muted: "#566a77"
  primary: "#15556b"
  paper: "#f6f9fb"
  surface: "#ffffff"
  line: "#dce5eb"
  ice: "#e9f4fa"
  coral: "#ae3f2d"
  success: "#22604d"
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
  section: "34px"
components:
  button:
    rounded: "7px"
    backgroundColor: "{colors.primary}"
    textColor: "{colors.surface}"
---
# Rowglass design

## Overview
Product register. A query-review desk for developers: quiet blue-gray workspace, compact code, clear evidence tables and a coral reduction strip. The memorable element is the reduced database witness, not an illustration or a decorative metric. The interface must distinguish model-generated proposals, hand-authored references and executed results. English global developer audience; no Japan-specific market or locale contract.

## Colors
The runtime source is the :root semantic variables in src/style.css (ownership model B). DESIGN.md mirrors those values. --ink/--muted supply hierarchy, --primary is the shared action/link/focus role, --ice marks context and review, --coral marks mismatches and the reducer, and --success marks finite test agreement. Status always includes text.

## Typography
Sora for page titles, IBM Plex Sans for application copy and IBM Plex Mono for SQL and tables. Fonts are self-hosted and embedded by the build. Code density is deliberate; explanations stay outside the editor. No external font requests.

## Layout
Fixed-width case sidebar, fluid main workbench, query and model panels, then test list and outputs. At narrow widths the sidebar becomes a horizontal case picker and panels stack. The document owns vertical scrolling; code and table panels own bounded horizontal/row overflow.

## Elevation & Depth
Flat evidence panels with a one-pixel border. Only the selected case has subtle elevation.

## Shapes
Twelve-pixel panels, seven-pixel controls, five-pixel status badges. No ornamental pill collection.

## Components
Button and Badge are shared primitives in src/App.jsx. DataTable and Output own all result tables. Case selection is a list of native buttons, not an authored select. No date picker, modal, destructive delete or authentication UI exists. Native details is used for fixture disclosure. CSS variables map directly to these shared primitives.

## Do's and Don'ts
Use current counts calculated by SQLite. Label reference repairs. Disable model controls while not configured and explain why. Never turn a replay, mock or reference query into live model evidence. Honor reduced motion and visible keyboard focus. Never hide scrollbars.
