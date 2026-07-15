# The Veritasium Historical Aesthetic — and How to Build It on the Web

A design reference for bringing the "archival reenactment" style of Veritasium's history segments (e.g. *How Imaginary Numbers Were Invented*, *The Longitude Problem*) into a website.

---

## 1. What the aesthetic actually is

When Veritasium cuts from Derek talking to camera into a historical passage, the entire visual language changes at once. That mode-switch is the heart of the technique. The historical world is built from a small, consistent set of materials and motions:

**The materials.** Everything looks like it came out of an archive: parchment and laid paper, iron-gall ink, sepia and umber tones, candlelight falling off into darkness at the edges of frame. Portraits are period engravings or woodcuts — line-hatched, high contrast, never photographic. Diagrams look hand-drawn with a quill, slightly irregular, on the same paper as everything else. Text appears in period letterforms: humanist serifs for "printed" matter, looping script for "handwritten" matter.

**The motion.** This is the most distinctive part, and the easiest to get wrong. The style is *sparse and deliberate*. Nothing moves fluidly or quickly. The vocabulary is essentially four moves:

1. **The slow push** — a Ken Burns zoom or pan across a static plate, drifting maybe 5% over many seconds.
2. **The paper puppet** — an engraved figure, cut out from its background, that slides into frame and idles with a tiny bob or sway, as if someone is holding a paper cutout up to the camera. Limbs or heads occasionally pivot a few degrees from a fixed hinge point.
3. **The self-drawing line** — ink strokes that draw themselves: an equation written by an invisible quill, a diagram constructed stroke by stroke, an underline scratched beneath a word.
4. **The reveal** — a document unrolling, a page turning, a cutout sliding aside to expose the next idea. Often staged left-to-right like a tabletop diorama.

**The atmosphere.** A unifying layer sits over everything: film grain, dust motes, a heavy vignette, slightly flickering warm light. This is what makes separately-sourced images feel like one continuous world — they're all "shot" through the same old lens.

**Why it works.** Three reasons worth preserving in any adaptation. First, it *signals time travel instantly* — the viewer knows without being told that we've left the present. Second, it makes static archival material *feel alive* without faking footage that couldn't exist. Third, the *contrast* with the modern presentation style gives the piece rhythm; returning to the present feels like surfacing.

---

## 2. The principles to carry over (more important than any technique)

- **Restraint is the style.** One thing moves at a time, slowly. A page covered in simultaneous animations reads as a cartoon, not an archive.
- **Material honesty.** Every element must plausibly be paper, ink, or light. No drop shadows that imply floating glass, no neon, no gradients that paper can't have. If a UI element is needed (a button, a caption), dress it as a museum label or a marginal note.
- **Aged, not dirty.** Texture should whisper: a faint fiber pattern, a soft vignette. Heavy grunge overlays look like a Halloween flyer.
- **One world, one lens.** Unify every image — whatever its source — through the same color grade and grain so the whole feature feels printed in a single book.
- **The mode-switch is the feature.** The aesthetic gains its power from contrast with the surrounding site. It should arrive like a cut in the edit: a clearly bounded zone with its own light.

---

## 3. Implementing it on a website

### 3.1 The paper

A convincing parchment ground needs three layers: base color, fiber noise, and lighting. All three can be done without image files.

```css
.parchment {
  /* base + lighting: warm center, darkened edges (the candlelight vignette) */
  background:
    radial-gradient(ellipse at 50% 35%, rgba(255, 244, 215, 0.25), transparent 65%),
    radial-gradient(ellipse at center, transparent 55%, rgba(58, 38, 18, 0.45) 130%),
    #e8d9b5;
  color: #3b2a17; /* iron-gall ink: warm near-black brown, never pure black */
}
```

The fiber texture comes from an inline SVG noise filter, tiled as a background — far lighter than a texture JPEG and resolution-independent:

```html
<svg width="0" height="0">
  <filter id="paper-grain">
    <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" />
    <feColorMatrix type="matrix"
      values="0 0 0 0 0.45  0 0 0 0 0.36  0 0 0 0 0.24  0 0 0 0.06 0" />
  </filter>
</svg>
```

Applied via a pseudo-element so it sits over everything at low opacity:

```css
.parchment::after {
  content: "";
  position: absolute;
  inset: 0;
  filter: url(#paper-grain);
  pointer-events: none;
}
```

Deckled or torn edges, if wanted, come from a `clip-path` polygon with slight irregularity, or an SVG `mask` with a roughened rectangle. Use sparingly — a clean rectangular "plate" with a thin double-rule border often reads as more authentic (book plate) than a torn scrap.

### 3.2 The ink and the type

Three typographic registers cover everything:

- **Printed matter** (narration, captions): a period serif. *IM Fell English* is the canonical choice — digitized from 17th-century type, complete with rough edges and an italic. *EB Garamond* is the cleaner, more readable alternative for longer passages.
- **Handwritten matter** (annotations, signatures, the equation someone "scribbles"): a script face such as *Homemade Apple* (scratchy, quill-like) or *Caveat* (faster, pencil-like). Reserve it for short phrases — script faces exhaust the reader quickly.
- **Engraved labels** (names under portraits, dates): small caps with wide letterspacing in the period serif, mimicking the captions cut into engraving plates.

Details that sell it: drop caps on opening paragraphs (`::first-letter`), enabled ligatures and oldstyle numerals (`font-variant-numeric: oldstyle-nums`), and em-dash-heavy punctuation. Ink should never be `#000` — use a warm dark brown, and let headings sit slightly darker than body text as if pressed harder.

### 3.3 The engravings

Two sourcing routes:

1. **Genuine public-domain plates.** Wikimedia Commons, the Wellcome Collection, the Internet Archive, and the Met's open-access program have engravings of nearly every historical mathematician and scientific instrument. These are the real thing and free to use.
2. **Recreated line art.** For diagrams or figures that don't exist as plates, draw SVG line art using hatching (parallel stroke groups) rather than fills. This has the bonus of being animatable stroke-by-stroke (see 3.4).

Whatever the source, push every image through one shared grade so they unify:

```css
.plate img {
  filter: grayscale(1) sepia(0.55) contrast(1.15) brightness(0.95);
  mix-blend-mode: multiply; /* lets the paper show through the whites */
}
```

`mix-blend-mode: multiply` is the single highest-value trick in this list: it knocks out the white background of any scanned engraving so the figure appears printed *on* your parchment rather than pasted over it. No manual cutout needed for rectangular plates; for true cutout silhouettes, trace once in an editor and export SVG.

### 3.4 The motion vocabulary, translated

**Self-drawing ink** — the signature move — is native to SVG. Set a path's dash pattern to its own length, then animate the offset to zero:

```css
.ink-stroke {
  stroke-dasharray: var(--len);
  stroke-dashoffset: var(--len);
  transition: stroke-dashoffset 1.6s cubic-bezier(0.4, 0, 0.3, 1);
}
.is-inked .ink-stroke { stroke-dashoffset: 0; }
```

Stagger several strokes with `transition-delay` and a diagram constructs itself exactly like a quill drawing it. The same technique applied to text converted to outlines gives write-on handwriting; a cheaper approximation for live text is a `clip-path: inset()` reveal sweeping left to right.

**The paper puppet** is a slow transform loop with an off-center origin, so the figure pivots like a cutout held by one corner:

```css
.cutout {
  transform-origin: 50% 92%; /* held from the bottom */
  animation: puppet-idle 7s ease-in-out infinite alternate;
}
@keyframes puppet-idle {
  from { transform: rotate(-0.6deg) translateY(0); }
  to   { transform: rotate(0.7deg) translateY(-3px); }
}
```

Amplitudes must stay tiny — a degree of rotation, a few pixels of drift. Entrances are a single slide from offstage (`translateX`) with no bounce.

**The slow push** is a long-duration scale on the plate's inner image (`transform: scale(1.06)` over 20–30s, alternating), with `overflow: hidden` on the frame.

**The candlelight flicker** is an overlay whose opacity wavers irregularly — two stacked animations at incommensurate durations (e.g. 7s and 11s) produce convincing non-repeating flicker without JavaScript.

**Staging** should be scroll-driven, like the edit of a video: each panel's animations begin when it enters the viewport, via a small `IntersectionObserver` that adds an `is-inked` / `is-onstage` class. Animations should run once, not loop (except idle drift and flicker). And the entire motion layer must respect `prefers-reduced-motion: reduce` by rendering the final, fully-drawn state immediately — the aesthetic degrades gracefully into "beautiful book plate," which is a fine fallback.

**Dust and grain**, if animated at all, should use `steps()` jitter on the noise layer's background position at low frame rates (8–12 steps/s) — smooth-moving grain looks digital; stepped grain looks filmic.

### 3.5 Structure: the historical aside as a component

The strongest integration pattern mirrors the video editing: the historical world is a *bounded interruption* of the normal page, not a site-wide skin. Concretely, a full-bleed `<aside class="historical-scene">` that:

1. **Cuts hard at its borders.** The transition into parchment should be abrupt — a torn or plate edge, not a gradient fade. The reader should feel the cut.
2. **Carries its own light.** If the host page is dark, the parchment panel reads as a lit document on a desk in a dark room — which is precisely the Veritasium tabletop look, and means the aside works inside *any* section's aesthetic without clashing.
3. **Has internal scenes.** A horizontal sequence of 2–4 "shots" (portrait + caption, document close-up, self-drawing diagram), each triggered on scroll, composes a short silent film.
4. **Returns the reader.** Ending the aside with the host page's normal heading style immediately after is the "cut back to the present."

This works as a recurring device across a whole project: one stylesheet (`historical.css`) defining the tokens (paper, ink, grade, motion classes), one JS module for the scroll triggers, and each aside is then just markup.

### 3.6 Performance and accessibility footnotes

Everything above is CSS/SVG; no video files are required, which keeps the asides light and crisp at any resolution. Lazy-load the engraving images. Keep the noise filter on a `pointer-events: none` overlay so it never intercepts interaction. Provide `alt`/`aria-label`s for the plates ("Engraved portrait of Gerolamo Cardano, 16th century"), honor reduced motion as above, and confirm ink-on-parchment contrast (warm brown on tan can drop below WCAG AA quickly — aim for roughly `#3b2a17` on `#e8d9b5` or darker).

---

## 4. Where it would land in this project

The natural first application is the **"Numbers That Answer Impossible Questions"** section of the Complex Numbers chapter — the same story Veritasium told in its most famous use of this style. A single historical aside could carry it: Cardano and Bombelli as engraved cutouts, the cubic-equation duel as a marginal note, and `x² = −1` writing itself in quill script before the page "cuts back" to the modern void aesthetic of the section. The contrast between candlelit parchment and the section's cold ultraviolet instrument-world would do exactly what the video edit does: make the past feel like the past, and the return to the present feel like the lights coming on.

Other candidates, if the device earns its keep: the invention of radians (Ch. 1 of Trigonometry), the history of compound interest and Bernoulli's discovery of e (Algebra Branch), and Euler himself at the summit chapter.
