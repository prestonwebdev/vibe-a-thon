# Melbourne

A lightweight React app built with:
- **React 18** + **TypeScript**
- **Vite** for fast development
- **shadcn/ui** (base UI version) for components
- **motion.dev** for animations
- **Tailwind CSS** for styling

## Getting Started

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## Adding shadcn/ui Components

Use the shadcn CLI to add components:

```bash
npx shadcn@latest add button
npx shadcn@latest add card
# etc.
```

## Project Structure

```
src/
├── components/     # shadcn/ui components
├── lib/           # Utility functions
├── App.tsx        # Main app component
├── main.tsx       # Entry point
└── index.css      # Global styles
```
