# Link Chess

A web application that lets you create, share, and play chess games with anyone through unique URLs.

## Features

- **Shareable Links**: Create a chess game and share the URL with friends or opponents
- **Password Protection**: Optionally secure your games with password protection
- **Multi-player Support**: Join as white, black, or spectator
- **Real-time Synchronization**: Game state updates for all viewers in real-time
- **Move History**: Undo moves and track game progress
- **Open Access**: No account required to create or join games

## Tech Stack

- **Framework**: [Next.js](https://nextjs.org/)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **State Management**: [Zustand](https://github.com/pmndrs/zustand)
- **Chess Logic**: [chess.js](https://github.com/jhlywa/chess.js)
- **UI Components**:
  - [react-chessboard](https://github.com/Clariity/react-chessboard)
  - [shadcn/ui](https://ui.shadcn.com/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **Database**: PostgreSQL with [Drizzle ORM](https://orm.drizzle.team/)
- **Security**: [bcrypt](https://github.com/kelektiv/node.bcrypt.js) for password hashing

## Getting Started

### Prerequisites

- Node.js (v18+)
- pnpm
- PostgreSQL database (using docker-compose)

### Installation

1. Clone the repository

   ```bash
   git clone https://github.com/yourusername/link-chess.git
   cd link-chess
   ```

2. Install dependencies

   ```bash
   pnpm install
   ```

3. Set up environment variables
   Create a `.env.local` file in the root directory with the following variables:

   ```
   DATABASE_URL=postgresql://username:password@localhost:5432/linkchess
   ```

4. Set up database using Docker

The project includes a `docker-compose.yml` file for easy setup:

```bash
docker-compose up -d
```

5. Start the development server

   ```bash
   pnpm dev
   ```

6. Open [http://localhost:3000](http://localhost:3000) in your browser

## How It Works

1. Create a new chess game from the homepage (with optional password)
2. Share the generated link with your opponent or friends
3. Players can join as white, black, or spectators
4. Game state synchronizes automatically between all connected clients
5. Play chess in real-time without needing accounts or logins

## Testing

Run the test suite with:

```bash
pnpm test
```

