# Jobflow Design Direction

## Three stylistic approaches

### Theme Name: Editorial Signal
Very light, editorial product design with warm paper tones, ink-black type, and a vivid chartreuse signal color. The interface feels like a thoughtful career journal crossed with a precision tool.
Probability: 0.07

### Theme Name: Quiet Orbit
Dark, atmospheric workspace with restrained blue-green accents and soft depth. The mood is focused and calm, helping users make high-stakes career decisions without noise.
Probability: 0.03

### Theme Name: Kinetic Ledger
A bright, structured system using cobalt, cream, and citrus accents with expressive charts and a slightly asymmetrical information architecture. It feels energetic, practical, and distinctly product-led.
Probability: 0.09

## Selected approach: Editorial Signal

### Design Movement
Contemporary editorial brutalism: print-inspired typography, high-contrast surfaces, deliberate asymmetry, and unapologetically useful information density.

### Core Principles
1. Make progress legible at a glance through strong typographic hierarchy and visual scoring.
2. Use generous whitespace around dense data so the product feels calm rather than clinical.
3. Treat every interaction as a small editorial moment: clear, direct, and quietly satisfying.
4. Prefer tactile surfaces, hairline rules, and signal color over generic rounded dashboard cards.

### Color Philosophy
Warm parchment and charcoal create the feeling of a personal working document, while Jobflow Chartreuse (#D9F24A) acts as an ownable signal for momentum, action, and opportunity. Cobalt is reserved for links and selection states, while muted clay and sage encode status without turning the interface into a traffic light.

### Layout Paradigm
A persistent left rail anchors navigation like a magazine spine. The main canvas uses a wide asymmetric composition: a strong score/briefing column beside a looser field of modular evidence, activity, and next actions. Content should feel composed, not tiled.

### Signature Elements
- Lime “signal” highlights behind key numbers and action labels.
- Fine editorial rules and small uppercase eyebrow labels.
- A recurring circular readiness dial and compact bar/line marks that feel like annotations in a career notebook.

### Interaction Philosophy
Interactions should be direct and readable. Buttons use plain-language verbs, selected items gain a crisp ink outline and chartreuse marker, and hover states reveal context rather than decoration. Empty states are honest and guide the next useful action.

### Animation
Use short 160–240ms ease-out transitions for navigation, cards, and controls. Page sections enter with a subtle upward drift and stagger of 40ms. Scores may draw from 0 to their value once per view; never animate dense lists continuously. Respect reduced-motion preferences.

### Typography System
Display: Fraunces, 600–700, for page titles and score numerals. UI/body: DM Sans, 400–600, for navigation, labels, and supporting copy. Eyebrows use DM Sans 700 with 0.14em tracking and uppercase styling. Avoid Inter.

### Brand Essence
Jobflow is the clear-eyed career operating system for ambitious people turning scattered job-search work into visible momentum. Personality: discerning, encouraging, exacting.

### Brand Voice
Headlines are confident and observant; CTAs are active and specific; microcopy is candid without sounding clinical. Example lines: “Your next move is already taking shape.” “Close the gap that keeps showing up.”

### Wordmark & Logo
The mark is a compact open loop made from two offset brackets, suggesting a flow from preparation to opportunity. It should appear as a bold symbol without text in the app chrome, paired with a custom lowercase wordmark in the interface.

### Signature Brand Color
Jobflow Signal Chartreuse — #D9F24A. It is bright enough to feel like a marker on paper and controlled enough to remain premium.

## Style Decisions

- Every route, including direct workspace paths and empty states, uses the Editorial Signal shell: warm parchment, charcoal type, chartreuse action signal, and editorial rules.
- App chrome includes the compact bracket-loop mark and lowercase wordmark, with the left rail functioning as the magazine spine.
- Chartreuse #D9F24A remains reserved for momentum signals: primary actions, key numerals, selected states, and progress annotations.
- Illustrative AI content is labeled explicitly and no fictional user experience, companies, salaries, or applications are presented as real data.
