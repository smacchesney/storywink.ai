Below is a practical, expert‑level rubric you can use to audit—or design toward—outstanding mobile‑web UX. Each category describes what an A (best‑in‑class) through F (critical flaws) experience looks like. Feel free to adapt language or weighting to match your team’s priorities.

1. Navigation & Information Architecture
A Flows are intuitive in one try; primary tasks never take more than 3 taps; persistent, context‑aware navigation aids; zero dead ends.
B Most flows clear, but 1–2 secondary tasks require an extra tap or page scan; breadcrumbs/labels consistent.
C Key tasks discoverable but take 5+ taps; menus occasionally nested illogically; users hit “back” often.
D Important pages buried two+ levels deep; terminology inconsistent; modal loops possible.
E Critical tasks hidden behind jargon or unlabelled icons; users must rely on search.
F Users cannot predict where actions live; frequent hard reloads, 404s, or circular loops.
2. Interaction & Feedback
A Every tap, swipe, or drag gives <100 ms visual feedback; micro‑animations signal completion; undo available.
B Most interactions respond instantly; loading states appear if wait > 500 ms.
C Some controls feel “dead” for up to a second; skeleton screens missing.
D Feedback arrives late or inconsistently; users unsure a tap registered.
E Critical actions (e.g., checkout) lack confirmation; progress spinners freeze.
F Taps randomly ignored; accidental double‑submissions common; broken gestures.
3. Visual Hierarchy & Aesthetics
A Type scale, color, and spacing drive effortless scanning; WCAG contrast met; brand personality clear yet unobtrusive.
B Minor inconsistencies (e.g., two body text sizes); visuals mostly reinforce hierarchy.
C Crowded above‑the‑fold; at least one color used for both primary and secondary actions.
D Visual clutter forces pinch‑zoom; icons unlabeled; banner blindness issues.
E Unbalanced layouts, inconsistent fonts; flashing ads hinder task completion.
F Unreadable text, overlapping elements, or content pushed off‑screen.
4. Performance & Responsiveness
A Largest Contentful Paint < 2 s on 3G; interface remains interactive during async tasks; gracefully degrades offline.
B Sub‑3 s loads on 4G; lazy‑loading for non‑critical assets.
C 4–5 s first paint; jank visible during scroll; heavy initial JS.
D 6 s+ loads; blocking scripts; orientation change stutters.
E Time‑outs or blank screens on mid‑tier devices; frequent forced refresh.
F Site crashes browsers or drains battery rapidly.
5. Accessibility & Inclusivity
A Full WCAG 2.2 AA (or better) compliance; keyboard navigation, screen‑reader labeling, color‑blind safe palettes; motion‑reduction options.
B Most interactive elements labeled; alt‑text on key images; logical focus order.
C Some form controls unlabeled; heading structure flat; text scaling breaks layout.
D Contrast fails on secondary actions; custom controls not ARIA‑mapped.
E Essential content in images without alt; fixed font sizes <12 px.
F Site unusable without vision, hearing, or precise motor control.
6. Content Clarity & Microcopy
A Language is concise, reading level ≤ 8th grade; error states human and actionable; zero lorem ipsum.
B Minor jargon in advanced settings; inline validation messages helpful.
C Long paragraphs on mobile; system errors (“Error 400”) leak through.
D Placeholders substitute real copy; form labels ambiguous.
E Critical CTAs vague (“Submit”); tone inconsistent.
F Misleading or missing copy causes task failure.
7. Personalization & Context Awareness
A Experience adapts to location, previous behavior, and device capabilities; permissions requested just‑in‑time.
B Simple remembers (e.g., last filter choice); respectful prompts for push or geo.
C Personalization limited to “Hello, {Name}”; redundant permission asks.
D Assumes GPS/data always available; doesn’t cache user prefs.
E Irrelevant push notifications; ignores time zone/currency.
F Breaks when denied permissions; exposes personal data incorrectly.
8. Trust, Privacy & Security
A Clear privacy policy in‑flow; biometric/SSO offered; sensitive data masked; zero dark patterns.
B HTTPS everywhere; granular data‑sharing toggles.
C Policy present but buried; unsubscribe link small; mild friction.
D Pre‑checked data‑sharing boxes; mixed‑content warnings.
E Ads mimic system alerts; confusing cookie banners.
F Transmits personal info unencrypted; deceptive opt‑outs; permissions abuse.