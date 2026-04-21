# Nuxt Minimal Starter

Look at the [Nuxt documentation](https://nuxt.com/docs/getting-started/introduction) to learn more.

## Setup

Make sure to install dependencies:

```bash
# npm
npm install

# pnpm
pnpm install

# yarn
yarn install

# bun
bun install
```

## Development Server

Start the development server on `http://localhost:3000`:

```bash
# npm
npm run dev

# pnpm
pnpm dev

# yarn
yarn dev

# bun
bun run dev
```

## Production

Build the application for production:

```bash
# npm
npm run build

# pnpm
pnpm build

# yarn
yarn build

# bun
bun run build
```

Locally preview production build:

```bash
# npm
npm run preview

# pnpm
pnpm preview

# yarn
yarn preview

# bun
bun run preview
```

Check out the [deployment documentation](https://nuxt.com/docs/getting-started/deployment) for more information.

## Home Timeline Setup

This project includes a first implementation of Mastodon Home Timeline at `/home`.

### Environment Variables

1. Copy `.env.example` to `.env`.
2. Fill in the values:

```bash
NUXT_MASTODON_API_BASE=https://your-mastodon-instance
NUXT_MASTODON_TOKEN=your-access-token
```

### Run

```bash
pnpm install
pnpm dev
```

Open `http://localhost:3000/home`.
