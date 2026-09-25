# ClotPlayAssessment

A six-reel Megaways-style slot game demo built with **Cocos Creator 3.8.8**.

> **Play online:** [Launch ClotPlayAssessment](https://chinfatt.dev/ClotPlayAssessment/)

## Run locally

Open `assets/scenes/Main.scene` in **Cocos Creator 3.8.8** and run the scene or play it online with link above.

## GAMEPLAY

- Each of the **six reels** independently shows **2 to 7 symbols**. Multiply the visible symbol counts to get the **possible ways**, from **64** to **117,649**. The counter updates as each reel lands.
- A paying combination starts on the **leftmost reel** and spans at least **three consecutive reels**. Matching symbols can appear on any row.
- **Wild** substitutes for any paying symbol and appears only on reels 2–5.
- **Scatter** does not substitute or pay. **Three or more Scatters anywhere** on the reels show a **FREE GAME WON!** notice.
- The bet is fixed at **1.00**. When the reels stop, **WIN** shows the total payout and non-winning symbols are dimmed.

## Paytable

Rates apply to matches across **3, 4, 5, or 6 consecutive reels**. Each symbol's payout is `matching ways × paytable rate × bet`.

| Symbol | 3 reels | 4 reels | 5 reels | 6 reels |
| --- | ---: | ---: | ---: | ---: |
| Dog 1 | 2.25 | 6.00 | 9.00 | 22.50 |
| Dog 2 | 1.50 | 3.00 | 4.50 | 9.00 |
| Dog 3 | 1.05 | 2.25 | 3.00 | 6.00 |
| Dog 4 | 0.60 | 1.50 | 2.25 | 4.50 |
| Collar | 0.45 | 1.20 | 1.50 | 4.50 |
| Bone | 0.45 | 1.20 | 1.50 | 4.50 |
| A | 0.30 | 0.60 | 0.90 | 3.00 |
| K | 0.30 | 0.60 | 0.90 | 3.00 |
| Q | 0.30 | 0.60 | 0.90 | 3.00 |
| J | 0.15 | 0.30 | 0.60 | 1.50 |
| 10 | 0.15 | 0.30 | 0.60 | 1.50 |

## Implementation and optimization

- **Reused symbol nodes:** `ReelController` moves and recycles scene nodes during a spin instead of creating and destroying sprites every frame.
- **Scene resizing:** `ScreenAdapter` keeps the **1280 × 720** design area visible when the browser viewport changes.
- **Draw-call inspection:** `Spector.js` plugin was used to inspect WebGL draw calls and guide rendering optimizations.

## Known limitations

- **Free games:** Three or more Scatters display a notice, but free spins are not implemented.
- **Betting and progress:** The bet is fixed at **1.00**; there is no balance, bet control, or saved progress.
- **Result generation:** Results are generated locally with `Math.random`; there is no server-side result service or certified RNG.
- **Animations:** Win animations and Spine-based symbol animations are not implemented.
- **Screen resizing:** `ScreenAdapter` may not work correctly in the localhost preview; use a web build to test resizing.
