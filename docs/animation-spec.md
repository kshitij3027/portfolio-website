# PROMPT: Build a clone of the juo.com hero animation (top viewport only)

Build a single-page hero section that clones the juo.com landing animation. It is a full-viewport, black, self-playing 52-second "movie" that loops forever. A WebGL particle canvas renders everything you see: product photos materialize as dithered dot-clouds, morph into a wireframe "customer portal" UI, and that UI then live-edits itself while two floating terminal windows (an AI "OPERATOR" chat and a "DEV" CLI) type the instructions causing each change. There is no scrolling involved — everything below is out of scope.

---

## 1. Page chrome (static, above the canvas)

- Page background: pure black `#000`.
- One floating nav bar, horizontally centered, ~24px from the top, ~400px wide, `z-index` above the canvas. Black background, 1px border `#383838`. Contents left→right:
  - Round white logo mark (~28px; any circular glyph works).
  - Link `Docs` in white (~17px sans-serif) with a small external-link icon.
  - Button `LEARN MORE`: white background, black text, JetBrains Mono, uppercase, 12–13px, slight letter-spacing, ~36px tall.
- Nothing else is DOM-rendered except the two terminals (§3). Headline, UI, products — all of it is particles on the canvas.

## 2. The particle canvas (the star of the show)

Full-viewport `<canvas>` (WebGL points, 2× DPR backing). It plays a sequence of **scenes**. A scene = a grayscale source image sampled into particles:

- **Sampling**: lay a grid over the image (gap 2–4px for UI scenes, ~7px for the big product shots), keep points whose pixel luminance passes a threshold, tint every particle white with per-particle brightness taken from the pixel. Dot size ~1px (slight random variation, `dotScale 0.4`). The result reads as retro dither / stipple engraving.
- **Idle life** (always running, so frames never look frozen):
  - Per-particle noise wobble: `noiseScale 0.025`, radial amplitude 0.25, lateral 0.35, base jitter 0.12 (values in px at 1× zoom).
  - Camera shimmer: slow sinusoidal drift, x/y amplitude 0.25, rotation ±0.01 rad, zoom ±0.05, speeds ~0.1 — the whole image floats gently.
  - **Heartbeat**: at ~44 BPM a circular shockwave (speed ~450 px/s, ring thickness ~200px, max displacement ~1.2px) ripples outward from the center, briefly displacing particles it passes through. The image "breathes" twice per ~2.7s.
- **Scene transitions** (differential morph, 0.6–1.0s per scene):
  - Particles whose old and new positions are within ~20px (`proximityThreshold`) simply slide/settle — unchanged UI stays put.
  - Removed content fades out (0.6s, ease-in).
  - New content enters as an **explosion**: dots scatter from a focal point (screen center, intensity ~1.2) and converge into the new shapes over ~2s, ease-out. Newly added elements render noticeably **brighter** for a moment, then settle to the normal gray — the "diff" glows.
- **Camera**: each scene defines `zoom` (1.0–2.5) and a center point (fractions of the frame). Camera animates between scenes over ~1s ease-in-out.
- **Mouse parallax**: the whole hero (canvas + terminals) shifts a few px toward the cursor (distance-weighted, smooth).
- **Pause behavior**: pause the loop on `visibilitychange` (tab hidden) and when the hero leaves the viewport (IntersectionObserver). Respect `prefers-reduced-motion` by freezing on the full-portal frame.

## 3. The two terminal windows (DOM, floating over the canvas)

Shared anatomy (a custom element / component):
- A small **title tab** (34px tall, JetBrains Mono 12px, uppercase, padding 3px 15px) sitting on top of a **body box** (~576px wide at 1440px viewport, JetBrains Mono 14px/500, padding ~24px 36px, min height ~1 line).
- **DEV theme**: black background, white text, 1px `#383838` border; tab reads `DEV`.
- **OPERATOR theme**: white background, gray text `#7d7d7d` (tab text black); tab reads `OPERATOR`.
- Three line kinds:
  - `command` — prefixed `$ `, typed character-by-character (~25–50ms/char), bright/bold.
  - `prompt` — prefixed `> `, typed character-by-character, bright/bold (the human asking the agent).
  - `response` — no prefix, appears as a whole line after a beat, regular weight, dimmer.
- A blinking block cursor `▮` sits at the end of the last line.
- Lines accumulate (scrollback stays visible) until an explicit `clear`.
- Show/hide = 0.3s fade + 24px upward slide (`opacity 0; translateY(-24px)`).
- Position = anchor point expressed as fractions of the hero (e.g. `{x:0.47, y:0.5}`); the box hangs below the anchor. Anchors (and a scale var ~1.2, up to ~1.34 in zoomed beats) re-tween 0.3s whenever the camera moves, so terminals glide with the shot.

## 4. Scene assets (17 grayscale frames, ~3416×2400)

Render these as big grayscale images (screenshots of a mock UI you build once, or hand-made in Figma). Sample data is placeholder — swap freely:

1. **1a** – studio shot: one small apothecary bottle, upper-left area.
2. **1b** – + a pump bottle beside it.
3. **1c** – + a squeeze tube.
4. **1d** – + a toothbrush (4 products, loose diagonal arrangement).
5. **2** – full **customer-portal wireframe** (white line-art on black, Inter-like sans): left sidebar (Menu: Subscriptions, Rewards, Delivery schedule, Billing, My profile); header row with avatar, `Credits €14.00`, `Loyalty tier VIP`; page title `Your subscriptions [3]`; central **renewal card**: `Next renewal 12 December, 2025`, `Next payment [blik] €66.20`, `Skip` button, kebab menu; inside it `Your custom bundle` carousel — product thumbnail, `Hydrating Gel Cleanser`, `100ml bottle`, `€19.80 / every 1 month`, side arrows, 3 dots; left promo card `Claim your discount — Add 2 lip balms and enjoy 50% OFF, CODE GLOW50` with copy icon; right column: loyalty panel (`Get only 280 more points…`, `Your points: 420`, `How to redeem your points?`), order summary (`Next order value €62.00`, `Shipping €4.20`, `DISCOUNT CODE` + `Apply`, `Total: €66.20`), `Payment method [blik] 39 •••• •••• •••• 1234`; bottom: `Add to next delivery — More COLLAGEN, 150 ml bottle, €39.60`, `Add product` button. Every block wears dev-tool adornments: a `<>` chip + block name (e.g. `product-list-block`) top-left and a drag-handle dot-grid top-right.
6. **3** – same portal, renewal block emphasized (rest dimmed).
7. **3z** – same image; camera preset zooms 2.0× onto the renewal block (center-left).
8. **4** – renewal block redesigned (calendar/date treatment more prominent).
9. **4z** – same; camera pans right (center x≈0.58).
10. **5** – `Renew now` button added beside `Skip`.
11. **5z** – same at 2.5×.
12. **6** – `Swap` button added on the bundle product row (still 2.5×).
13. **7** – full portal again (camera 1.0×) with all changes.
14. **8** – wide, dimmer portal (1.2×) — the "before dev phase" resting frame.
15. **9** – a `custom-block` window low in the frame (camera 1.5×, center y≈0.65): starter card with framework logo + `TS` badge, `Starter Block — Lit + TypeScript`, and a `count is 0` pill button.
16. **10** – the block becomes an upsell scaffold: `Header content / subheader content` + product card placeholder (X image, `Product name`, `Variant`) at 1.8×.
17. **11** – the block becomes a two-product chooser: `Choose subscriber's gift`, two product tiles side-by-side (2.0×).
18. **12** – chooser with header text finalized (1.5×).
19. **13** – final full portal (1.5×, center y≈0.4): `Renew now`, `Swap`, and the new `Choose subscriber's gift` block all present.
20. **14** – empty frame (particles disperse to nothing).

(Scenes 7 of 20 reuse images with different camera presets — 17 unique images total.)

## 5. MASTER TIMELINE — one 52.0s cycle, second by second

Times from cycle start. Typing runs ~30ms/char; responses pop in whole. Every scene change uses the differential morph from §2.

| t (s) | Canvas (particles + camera) | Terminals |
|---|---|---|
| 0.0 | Black. Product 1 (small bottle) assembles as a dot cloud, upper-left. Camera 1.2×, breathing/shimmer running | — |
| 1.2 | Product 2 (pump bottle) materializes beside it | DEV fades in below center-left — empty body, blinking cursor (on repeat cycles it appears ~2.3s instead) |
| 2.3 | Product 3 (tube) materializes | DEV idle |
| 3.0 | Product 4 (toothbrush) materializes — all four hang in a loose diagonal | 3.2s: DEV types `$ npm create juo` (finishes ~3.9s) |
| 4.2–4.5 | **Big morph**: products explode into particles and re-converge as the full portal wireframe (~2s settle) | `Generating project...` appears |
| 5–7.5 | Portal crystallizes; heartbeat pulses roll through | — |
| 7.7 | — | `Project generated with default template` |
| 9.5 | — | DEV fades out (up + fade) |
| 10.0 | — | OPERATOR (white) fades in bottom-right |
| 10.2–10.9 | — | Types `> Change the upcoming renewal block` |
| 11.5 | Portal re-renders with the renewal block emphasized | — |
| 13.0 | Camera zooms 2.0× into the renewal block (1s ease-in-out); OPERATOR glides/scales up ~1.2 to stay composed | — |
| 13.7 | — | `Ready` |
| 14.5 | — | `> Make the slider brand compliant` |
| 15.5 | — | `Adjusting slider to brand guidelines` |
| 16.0 | Renewal block swaps to its redesigned layout — changed parts glow bright then settle | — |
| 17.0 | — | `Slider adjusted to brand guidelines` |
| 18.2 | Camera pans right across the block | `> Add an option to renew now` |
| 20.5 | — | `Adding an option to renew now` |
| 21.5 | `Renew now` button materializes brightly next to `Skip` | — |
| 22.7 | — | `Added` |
| 23.7 | Camera pushes to 2.5× | `> Add an option to swap product` |
| 26.0 | — | `Adding an option to swap products` |
| 27.3 | `Swap` chip materializes on the bundle product row | — |
| 28.0 | — | `Added` |
| 28.8 | Camera pulls back to 1.0× — whole portal with all changes | — |
| 30.5 | Resting wide shot (1.2×), portal dimmer | OPERATOR fades out; DEV fades in mid-left, cleared |
| 31.7 | — | `$ npx juo generate block` |
| 32.5 | — | `Generating block...` |
| 33.5 | Portal fades back; a `custom-block` window forms lower-center (1.5×): starter card `Lit + TypeScript`, `count is 0` | — |
| 34.2 | — | `Block generated` |
| 35.5 | — | `> Build a basic upsell functionality` |
| 36.5 | — | `Building a basic upsell functionality` |
| 37.8 | Block content morphs into the upsell scaffold (header/subheader + product placeholder), camera 1.8× | — |
| 38.3 | — | `Implementation ready` |
| 38.7 | — | `> Add an option to choose one of two products` |
| 40.0 | — | `Adding an option to choose one of two products` |
| 41.5 | Block morphs into the two-product chooser, camera 2.0× | — |
| 42.2 | — | `Implementation ready` |
| 43.0 | — | `> Adjust the header` |
| 43.5 | — | `Adjusting the header` |
| 44.8 | Chooser header finalizes (`Choose subscriber's gift`), camera 1.5× | — |
| 45.2 | — | `Done` |
| 47.0 | Camera settles on the **final full portal** — renew-now + swap + gift block all present (1.5×, framed slightly high) | DEV fades out — no terminals |
| 49.8 | All particles disperse and fade to black over ~2s (morph target = empty frame) | — |
| 52.0 | **Loop restarts** at t=0 (Scene 1a) | Terminals reset to initial anchors, cleared |

Terminal anchor moves during the cycle (fractions of hero width/height): DEV starts (0.47, 0.50); shifts to (0.42, 0.515) after project generation; returns in dev phase at (0.12, 0.57), later (0.12, 0.65). OPERATOR starts (0.68, 0.75); moves to (0.60, 0.68) → (0.60, 0.45) → (0.60, 0.65) as the camera works through the renewal block.

## 6. Build order

1. Static shell: black page + floating nav.
2. Mock the portal UI in plain HTML once, style it as white-on-black wireframe, screenshot the 17 storyboard states as big grayscale JPGs.
3. Particle engine (Three.js `Points` or raw WebGL): image → grid sampling → render with per-dot brightness; add noise wobble, camera shimmer, heartbeat wave.
4. Scene manager: preload/pre-sample all frames; implement differential morph (nearest-neighbor match within ~20px, fade-out removals, explosion-in additions with temporary brightness boost) + camera tweens.
5. Terminal component with the three line types, char-by-char typing, block cursor, clear, fade/slide show-hide, fractional anchoring + scale var.
6. Orchestrator: one async script that awaits `wait(ms)` / `type(...)` / `setScene(n)` steps exactly per the §5 table, then loops forever. Pause on tab-hide/out-of-view.

The vibe check for "done": at any random moment the frame should look like a living engraving — grainy white dots gently breathing on black — while two little terminals calmly narrate an AI agent rebuilding a subscription portal in front of you.
