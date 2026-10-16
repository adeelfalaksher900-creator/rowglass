# Final demo production plan

Status: deferred until the user reviews the enhanced project. No video, voice or 15-image gallery is being produced in this phase. Actual Nebius inference is also required before recording the model scene. Do not substitute mocked adapter output or a hand-authored repair for that scene.

Target: 160–175 seconds, English, 1920×1080, public YouTube, clear conversational student-style narration. Use Hyperframes HTML/GSAP compositions for intro, labels, transitions and closing. Use actual workbench footage for the demonstration. Carry Rowglass's DESIGN.md graphite, ice-blue and coral palette with Sora / IBM Plex typography into the composition. No paid voice plan or voice cloning.

| Time | Evidence to show | Narration purpose |
|---|---|---|
| 0–14 s | Original query and empty current output for a customer without orders | Explain silent SQL errors and the intended output. |
| 14–37 s | Run original query: 3/9; inspect the one-row valid counterexample | Show why one happy example misses the bug. |
| 37–76 s | Actual Ask Nemotron request; live response model/ID/usage; generated SQL | Establish NVIDIA inference on Nebius Token Factory. Required before recording this section. Never expose the key or billing/account screens. |
| 76–111 s | Execute proposed repair; show genuine pass/fail outcome and feedback revision if needed; review/apply | Demonstrate execution, independent references and human review. Keep the real result if the model fails; do not fabricate a pass. |
| 111–139 s | Import inventory case and run its CLI check; inspect generated SQL patch | Demonstrate reuse beyond curated demos and preserve the query file. |
| 139–159 s | Actual Evaluation results and sealed review export | Explain positive/negative controls: 99 seeded/curated reference checks and 9 deliberate wrong repairs. These are local synthetic controls, not model accuracy. |
| 159–173 s | Public repository, MIT license, public working demo and scope | State the audience, inspected evidence and finite-test limitations. |

Record a clean runtime export after each real model request. The final script must use measured response IDs/latency/usage only where the provider supplies them, and match the recorded UI. Keep pauses natural; no background music is needed. Captions must follow actual audio timing.

Voice route: evaluate a free, licensed built-in TTS voice after checking provider availability/credits. ElevenLabs is preferred if a free generation allowance exists; local Kokoro via the Hyperframes TTS workflow is a fallback. Neither has been generated or billed for Rowglass yet.

Before rendering, read Hyperframes typography, house-style, transitions and TTS/caption references. Build static hero frames before animation. Register paused deterministic timelines; use scene entrances and transitions. Run lint, validate/contrast, inspect and animation-map checks. Inspect rendered beginning, model result, captions and ending. Verify duration below 180 seconds and that the final YouTube visibility is public.
