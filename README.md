# Svacraft — Marketing Site

A single-page, story-driven site for **Svacraft**, the offline real-life RPG fitness tracker. Built with plain HTML, CSS, and JavaScript — no build step, no dependencies.

**Craft Yourself.**

## Run it

Open `index.html` directly, or serve the folder with any static server:

```bash
# from this folder
python -m http.server 8080
# then visit http://localhost:8080
```

## What's inside

| File | Purpose |
| --- | --- |
| `index.html` | All page content and the narrative structure |
| `privacy.html` | Standalone privacy policy page |
| `styles.css` | Palette, reset, header, hero, story chapters |
| `components.css` | Panels, hunter cards, trial console, feature bento |
| `sections.css` | App screens gallery, ranks, stats, titles, belts, challenges, privacy, modal |
| `legal.css` | Privacy policy page layout, contact card, print styles |
| `responsive.css` | Breakpoints from 320px upward and reduced-motion rules |
| `script.js` | Boot sequence, navigation, trial demo, screenshot gallery, explorers, radar, countdown, modal |
| `assets/` | The app's logo |
| `assets/screenshots/` | Eleven captures from the real app, downscaled to 630×1400 for the web |

## Notes

- The palette is taken from the app's `src/constants/game.ts`: midnight navy surfaces, cyan `#00D4FF`, violet/lavender accents, with gold, green, and red reserved for state.
- The hero lockup and the site's slogan are **Craft Yourself**.
- The boot sequence plays once per tab (`sessionStorage`).
- The interactive trial is a faithful miniature of the app loop: three quests, EXP, stat gains, level-ups, a 10% full-clear bonus, and the **Arise** title at level 5. It resets completely. Starting stats are all 10, matching the app.
- The app screens section is an interactive gallery of every real screen: registration, System Status, daily quests, plans, exercises, the Dojo, and challenges. Use the arrows, thumbnails, keyboard, or swipe.
- `privacy.html` is the standalone policy page, linked from the homepage privacy section and the footer. Replace the `[Your Developer Name]` and `[Your Support Email]` placeholders in section 10 before publishing.
- The challenge countdown persists across visits in `localStorage`.
- The install dialog is explicit that Svacraft is not on an app store yet and provides the real Expo / EAS commands.
- Fonts load from Google Fonts with local system fallbacks, so the site still works offline.
