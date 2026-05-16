# PROGSU Wiki

The open wiki for breaking into tech — built by ProgSU members for GSU students.

## About

ProgSU is Georgia State University's programming club. This wiki is our knowledge base: guides written by members who landed offers in quant, big tech, research, and beyond. Signed, dated, free.

### What's Inside

- **Foundations**: CS theory, math, and first principles
- **Career**: Recruiting, resumes, and offer strategy
- **Technical**: LC, system design, and take-homes
- **Networking**: Cold outreach, LinkedIn, and warm intros
- **Resources**: Tools, courses, and reading lists

## Technology Stack

- **Astro**: Static site generator
- **Three.js**: 3D constellation graph on the homepage
- **D3**: Force simulation for graph layout
- **Tailwind CSS**: Utility-first styling
- **MDX**: Markdown with component support

## Getting Started

### Prerequisites

- Node.js (version 18 or higher)
- npm

### Installation

1. Clone the repository:
```bash
git clone https://github.com/progsu-official/wiki.git
cd wiki
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

4. Open your browser to `http://localhost:4321`

### Development Commands

```bash
npm run dev        # Start development server with hot reload
npm run build      # Build for production
npm run preview    # Preview production build locally
npm run fmt        # Format code with Prettier
```

## Project Structure

```
wiki/
├── src/
│   ├── components/
│   │   ├── ConstellationGraph.astro  # 3D interactive homepage graph
│   │   ├── Navbar.astro              # Site navigation
│   │   └── Footer.astro             # Site footer
│   ├── layouts/
│   │   └── Layout.astro             # Base page layout with cosmic background
│   ├── pages/
│   │   ├── index.astro              # Homepage (constellation hero)
│   │   ├── guides/                  # Guide category pages
│   │   └── courses/                 # Courses page
│   ├── styles/
│   │   └── global.css               # Global styles + Tailwind
│   └── consts.ts                    # Site config and nav links
├── reference/                       # Design reference files
├── public/                          # Static assets
└── astro.config.mjs                 # Astro configuration
```

## Contributing

Contributions from all club members are welcome — whether that's writing a new guide, fixing a typo, or improving the site.

### Adding or Editing Guides

Guides are written in MDX and live in `src/pages/guides/`. To add one:

1. Create a new `.mdx` file in the appropriate category folder
2. Follow the existing frontmatter format
3. Write your guide in Markdown
4. Submit a pull request

### Contribution Workflow

1. Fork the repository on GitHub
2. Clone your fork locally
3. Create a feature branch:
   ```bash
   git checkout -b feature/your-feature-name
   ```
4. Make your changes and test locally with `npm run dev`
5. Commit with a clear message:
   ```bash
   git commit -m "add: networking cold outreach guide"
   ```
6. Push and open a pull request with a description of your changes

## Getting Help

- Join the ProgSU Discord for questions
- Open a GitHub issue for bugs or feature requests
- Reach out to a club officer for write access

---

Built with care by progsu. Everyone is welcome to contribute.
