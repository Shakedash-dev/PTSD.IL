# PTSD-IL

A Hebrew-first web application providing information, self-help tools, and support resources for PTSD trauma survivors and their families in Israel. Supports 5 languages (Hebrew, Arabic, Russian, English, French) with full RTL.

## What it does

- **Self-help tools** - guided breathing, grounding (5-4-3-2-1), progressive muscle relaxation
- **PTSD screening** - anonymous self-assessment questionnaire (PCL-based)
- **Treatment pathways** - step-by-step guidance through therapeutic options
- **Rights & bureaucracy** - legal rights, disability support, compensation processes
- **Children's content** - age-appropriate trauma education
- **Community groups** - connecting survivors with local support groups
- **Admin dashboard** - content management interface (requires backend, TBD)

Two user journeys: survivors (first circle) and their loved ones (second circle).

## Stack

- **Frontend** - React 18, React Router 6, Vite 6
- **Styling** - Tailwind CSS, Radix UI, Framer Motion
- **State** - TanStack React Query
- **Forms** - React Hook Form + Zod
- **Other** - Three.js, Recharts, Leaflet, jsPDF, Stripe

## Running locally

```bash
cd src
npm install
npm run dev        # dev server at localhost:5173
npm run build      # production build
npm run lint       # ESLint
npm run typecheck  # type checking
```

## Deployment (GitHub Pages)

Live at: `https://shakedash-dev.github.io/PTSD.IL/`

The base path (`/PTSD.IL/`) is defined in `src/base-path.js` and consumed by both `vite.config.js` (build `base`) and `App.jsx` (Router `basename`). Change it there if the repo is ever renamed.

`main` is the development branch. `gh-pages` is the release branch - never edit it directly.

```bash
cd src
npm run deploy     # builds and pushes dist/ to the gh-pages branch
```

The `gh-pages` branch is managed by the `gh-pages` npm package. GitHub Pages is configured to serve from that branch.

## Project structure

```
/
├── src/                  # React app
│   ├── pages/            # Route components
│   ├── components/       # UI components (Radix wrappers + custom)
│   ├── lib/              # Language, theme contexts + i18n
│   ├── hooks/
│   └── utils/
├── entities/             # Database entity schemas (JSON) — for future backend
└── data_from_meitiv.txt  # Source material (Matityahu Center for Psychotrauma)
```

## TODO

- [ ] Replace all content with validated content (reviewed by professionals/verified sources)
- [ ] Make every piece of content dynamic - move all content to a database so the site parses data from it, enabling updates without code changes
- [ ] Change the background texture - pick the best one along with the best matching color palette
- [ ] Create a full design system/theme from the site that will serve as the foundation for the mobile application development
