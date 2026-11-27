# Vaibhav Bhatt — portfolio

Static multi-page site. No build step.

```
index.html  about.html  experience.html  projects.html  contact.html
css/style.css        tokens (colours, fonts) at the top
js/config.js         EVERY link and contact detail lives here
js/layout.js         header, footer, theme, motion
assets/              favicon.svg, docs/Vaibhav_Bhatt_CV.pdf
```

**Edit links:** open `js/config.js`. Empty values hide their link.
**Change colours:** edit the `:root` block in `css/style.css`.
**Host free:** drag the folder to app.netlify.com/drop, or push to GitHub Pages / Vercel.
**Test locally:** `python3 -m http.server` in this folder, open http://localhost:8000

**Motion (js/layout.js + css section 6b):** pipeline HUD, click-to-run cards, fast-scroll batch mode, count-up stats, drawing timeline, pixel crew in the footer. All honour prefers-reduced-motion.

**More motion (css section 6c):** headline decode, skills ticker, data-packet pipeline, card spotlight, magnetic buttons, panel tilt, drifting blobs, sliding nav pill, chip pop-in, back-to-top ring.

**Ambient motion:** a constant particle network behind every page (fewer particles on phones, reacts to touch/mouse, speeds up on scroll, pauses when the tab is hidden).
