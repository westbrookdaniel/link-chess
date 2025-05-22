This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

## Testing

The project uses Jest and React Testing Library for testing. The tests cover utility functions, hooks, and some core functionality.

### Test Coverage

Current test coverage:
- **Overall**: ~12% line coverage across custom code (excluding shadcn UI components)
- **Fully covered modules**:
  - `lib/utils.ts`: 100% line, branch, and function coverage
  - `hooks/use-mobile.ts`: 100% line, branch, and function coverage
  - `app/networkStorage.ts`: 100% line, 75% branch coverage
- **Modules needing tests**:
  - `app/Game.tsx`: Core game component 
  - `app/store.tsx`: Zustand state management
  - API routes: `app/api/game/[id]/route.ts`
  - Game pages: `app/game/[slug]/page.tsx`, `app/page.tsx`
  - DB modules: `db/index.ts`, `db/schema.ts`

This project has a solid test foundation that can be expanded. The current tests focus on utility functions and hooks that are easier to test in isolation. Complex components using Zustand state management or React components with many interactions would benefit from more comprehensive testing.

Note: shadcn UI components (`components/ui/*`) are excluded from coverage reporting as they are third-party components.

### Running Tests

To run the tests:

```bash
npm test
# or
yarn test
# or
pnpm test
# or
bun test
```

You can also run tests in watch mode:

```bash
npm run test:watch
# or
yarn test:watch
# or
pnpm test:watch
# or
bun test:watch
```

To generate test coverage reports:

```bash
npm run test:coverage
# or
yarn test:coverage
# or
pnpm test:coverage
# or
bun test:coverage
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
