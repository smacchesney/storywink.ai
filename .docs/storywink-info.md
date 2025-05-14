Okay, I will now deeply analyze the Storywink.ai codebase and provide a detailed explanation.

## 1. High-Level Architecture

### 1.1. Folder/Module Layout

```
/
├── .docs/                     # Documentation and notes
├── prisma/                    # Database schema and migrations
│   ├── migrations/
│   └── schema.prisma
├── scripts/                   # CLI tool for task management (meta-development)
├── src/
│   ├── app/                   # Next.js App Router: Pages and API routes
│   │   ├── (auth)/            # Authentication pages (sign-in, sign-up) - Not explicitly present but implied by Clerk setup
│   │   ├── api/               # Backend API endpoints
│   │   │   ├── book/
│   │   │   ├── generate/
│   │   │   └── webhooks/
│   │   ├── book/              # Public book preview pages
│   │   ├── create/            # Book creation and editing flow
│   │   ├── gallery/           # Public gallery of storybooks
│   │   ├── library/           # User's personal library of books
│   │   ├── layout.tsx         # Root layout
│   │   ├── page.tsx           # Landing page
│   │   └── globals.css        # Global styles
│   ├── components/            # React components
│   │   ├── book/              # Components for book viewing
│   │   ├── create/            # Components for book creation/editing
│   │   ├── landing-page/      # Components specific to the landing page
│   │   └── ui/                # UI primitive components (likely shadcn/ui)
│   ├── context/               # React Context providers (e.g., BookCreationContext)
│   ├── generated/             # Auto-generated files (e.g., Prisma client)
│   │   └── prisma/
│   ├── hooks/                 # Custom React hooks
│   ├── lib/                   # Shared libraries, utilities, and services
│   │   ├── ai/                # AI related utilities (e.g., style library)
│   │   ├── db/                # Database utilities (e.g., ensureUser)
│   │   ├── openai/            # OpenAI client and prompts
│   │   ├── pdf/               # PDF generation utilities
│   │   └── queue/             # BullMQ queue setup
│   ├── queues/                # BullMQ worker definitions
│   │   └── workers/
│   ├── styles/                # Additional styles (potentially redundant with app/globals.css)
│   ├── types/                 # Custom TypeScript type definitions
│   └── middleware.ts          # Next.js middleware (Clerk auth)
├── workers/                   # Dockerfiles for deploying workers
├── .gitignore
├── components.json            # shadcn/ui configuration
├── docker-compose.yml         # Docker setup for local development (Postgres, Redis)
├── eslint.config.mjs          # ESLint configuration
├── next.config.mjs            # Next.js configuration
├── package.json
├── postcss.config.mjs         # PostCSS configuration
├── README.md                  # Project README
└── tsconfig.json              # Main TypeScript configuration
└── tsconfig.worker.json       # TypeScript configuration for workers
```

### 1.2. Major Subsystems

*   **UI (Frontend):** Next.js App Router (`src/app`), React components (`src/components`), global styles (`src/app/globals.css`). Includes landing page, authentication flow, book creation/editing interface, book preview, and user library.
*   **API Layer:** Next.js API Routes (`src/app/api`) handling CRUD operations for books and pages, image uploads, AI generation triggers, and webhooks.
*   **Authentication:** Clerk (`@clerk/nextjs`) for user sign-up, sign-in, session management, and user data synchronization via webhooks (`src/app/api/webhooks/clerk`). Local user data is mirrored in the `User` table.
*   **Database & ORM:** PostgreSQL database with Prisma ORM (`prisma/schema.prisma`, `src/lib/db.ts`, `src/generated/prisma/client`).
*   **Image Handling:** Cloudinary for image storage and delivery (`src/lib/cloudinary.ts`, `src/lib/imageUpload.ts`).
*   **AI Generation:**
    *   **Text Generation:** OpenAI GPT-4o (`src/lib/openai/index.ts`, `src/lib/openai/prompts.ts`).
    *   **Illustration Generation:** OpenAI DALL-E/Images API (`src/lib/ai/styleLibrary.ts` for style references).
*   **Background Task Processing:** BullMQ with Redis (`src/lib/queue/index.ts`, `src/queues/workers/`) for handling long-running AI generation tasks (story text, illustrations, book finalization).
*   **PDF Generation:** Puppeteer (`src/lib/pdf/generateBookPdf.ts`) for exporting books.
*   **State Management:** React Context (`src/context/BookCreationContext.tsx`) for some aspects of the book creation flow, and local component state (`useState`, `useEffect`).
*   **Logging:** Pino-based logger (`src/lib/logger.ts`, `logger.server.ts`, `logger.client.ts`).
*   **Build & Configuration:** Next.js build system, TypeScript, ESLint, Prettier, Docker for workers.
*   **Meta-Development Tools:** A CLI script (`scripts/dev.js`) for managing development tasks, documented in `scripts/README.md`. This is separate from the application runtime.

## 2. Per-File Breakdown

### `.docs/`

*   **Path & Type**: `.docs/auth-notes.md` – Markdown Document
    *   **Responsibility**: Details the authentication system using Clerk, webhook synchronization with the local DB, and how user data is accessed.
    *   **Key Exports/Classes/Functions**: N/A (Documentation)
    *   **Dependencies & Imports**: N/A
    *   **Internal Flow**: Describes Clerk setup, user auth flow, route protection, DB sync via `ensureUser` and webhooks.
    *   **Nuances & Patterns**: Highlights `clerkId` as the link between Clerk users and local `User` records. Explains `ensureUser` for on-demand sync.

*   **Path & Type**: `.docs/cleanup.md` – Markdown Document
    *   **Responsibility**: Identifies potential areas for code cleanup, redundancies, and refactoring in the codebase.
    *   **Key Exports/Classes/Functions**: N/A (Documentation)
    *   **Dependencies & Imports**: N/A
    *   **Internal Flow**: Lists specific files and patterns (e.g., Prisma types vs. custom types, duplicate CSS, `BookCreationContext` role) and suggests actions.
    *   **Nuances & Patterns**: Points out potential for simplifying state management and consolidating configurations.

*   **Path & Type**: `.docs/storywink-info.md` – Markdown Document
    *   **Responsibility**: Provides a high-level overview of the Storywink.ai application, its features, Prisma schema, core application flow, and key information for an LLM to understand the codebase.
    *   **Key Exports/Classes/Functions**: N/A (Documentation)
    *   **Dependencies & Imports**: N/A
    *   **Internal Flow**: Summarizes user auth, book creation workflow (upload, edit, AI generation, review, export), user library, and key technologies.
    *   **Nuances & Patterns**: Emphasizes the book lifecycle (`BookStatus`), API endpoints, worker responsibilities, and key data types.

*   **Path & Type**: `.docs/UI_rubrics` – Markdown Document (Filename suggests it's a rubric, but content is missing from provided map. Assuming it's a UI design rubric based on `UX_rubrics.md`.)
    *   **Responsibility**: Likely defines criteria for evaluating the User Interface design aspects of the application.
    *   **Key Exports/Classes/Functions**: N/A (Documentation)
    *   **Dependencies & Imports**: N/A
    *   **Internal Flow**: N/A (Content not provided)
    *   **Nuances & Patterns**: N/A

*   **Path & Type**: `.docs/UX_rubrics.md` – Markdown Document
    *   **Responsibility**: Provides a detailed rubric for auditing or designing mobile web app User Experience, covering information architecture, visual hierarchy, typography, interaction design, accessibility, performance, etc.
    *   **Key Exports/Classes/Functions**: N/A (Documentation)
    *   **Dependencies & Imports**: N/A
    *   **Internal Flow**: Organizes UX evaluation criteria into categories with A-F grading scales.
    *   **Nuances & Patterns**: Focuses on mobile-first principles and expert-level UX considerations.

### `prisma/`

*   **Path & Type**: `prisma/schema.prisma` – Prisma Schema File
    *   **Responsibility**: Defines the database schema, including models (User, Book, Page, Asset, UserProfile), enums (BookStatus, PageType), relations, and attributes.
    *   **Key Exports/Classes/Functions**: Models: `User`, `Book`, `Page`, `Asset`, `UserProfile`. Enums: `BookStatus`, `PageType`.
    *   **Dependencies & Imports**: N/A (Defines schema for Prisma Client generation)
    *   **Internal Flow**: N/A (Declarative schema)
    *   **Nuances & Patterns**: Uses CUIDs for IDs, `@default(now())` and `@updatedAt` for timestamps. `BookStatus` enum is crucial for tracking book lifecycle. `Page.index` for ordering. `Book.coverAssetId` links to the cover image. `Asset.thumbnailUrl` for optimized image previews. `User.clerkId` links to Clerk.

*   **Path & Type**: `prisma/migrations/.../migration.sql` – SQL Migration Files
    *   **Responsibility**: Each file in a dated subfolder represents a database schema migration generated by `prisma migrate`. They contain raw SQL commands to apply schema changes.
    *   **Key Exports/Classes/Functions**: N/A (SQL Scripts)
    *   **Dependencies & Imports**: N/A
    *   **Internal Flow**: N/A (Executed by Prisma Migrate)
    *   **Nuances & Patterns**: Migrations are sequential and timestamped. Examples:
        *   `20250413165218_init`: Initial schema setup.
        *   `20250414141753_add_thumbnail_url_to_asset`: Adds `thumbnailUrl` to `Asset` and creates `UserProfile`.
        *   `20250513164536_add_clerkid_to_user` & `20250513164814_add_clerkid`: Adds and enforces `clerkId` on `User` table.
        *   Other migrations add fields like `tokenCounts`, `illustrationNotes`, `isWinkifyEnabled`, `coverAssetId`, `page.index` and new `BookStatus` enum values (`FAILED`, `ILLUSTRATING`, `PARTIAL`).

*   **Path & Type**: `prisma/migrations/migration_lock.toml` – Prisma Migration Lock File
    *   **Responsibility**: Ensures consistency in applying migrations, especially in team environments or CI/CD.
    *   **Key Exports/Classes/Functions**: N/A (Configuration)
    *   **Dependencies & Imports**: N/A
    *   **Internal Flow**: N/A
    *   **Nuances & Patterns**: Managed by Prisma CLI.

### `scripts/`

*   **Path & Type**: `scripts/dev.js` – Node.js Script (CLI entry point)
    *   **Responsibility**: Serves as the entry point for the "Task Master" CLI tool, a meta-development script for managing development tasks.
    *   **Key Exports/Classes/Functions**: None (executable script).
    *   **Dependencies & Imports**: Imports `runCLI` from `./modules/commands.js`.
    *   **Internal Flow**: Parses process arguments and passes them to `runCLI`.
    *   **Nuances & Patterns**: This is a developer tool, not part of the Storywink.ai application's runtime.

*   **Path & Type**: `scripts/example_prd.txt` – Text File
    *   **Responsibility**: Provides a template or example structure for a Product Requirements Document (PRD) to be used with the `task-master` CLI.
    *   **Key Exports/Classes/Functions**: N/A (Template)
    *   **Dependencies & Imports**: N/A
    *   **Internal Flow**: N/A
    *   **Nuances & Patterns**: Placeholder for PRD content.

*   **Path & Type**: `scripts/prd.txt` – Text File
    *   **Responsibility**: Contains the actual Product Requirements Document for Storywink.ai, likely used as input for the `task-master parse-prd` command.
    *   **Key Exports/Classes/Functions**: N/A (Documentation/Input)
    *   **Dependencies & Imports**: N/A
    *   **Internal Flow**: Details the project overview, core features, user experience, technical architecture, roadmap, dependencies, and risks for Storywink.ai.
    *   **Nuances & Patterns**: This document seems to be the source of truth for the project's features and requirements, intended to be parsed by `scripts/dev.js`.

*   **Path & Type**: `scripts/README.md` and `scripts/README-task-master.md` – Markdown Documents
    *   **Responsibility**: Document the "Task Master" CLI tool (`dev.js`), explaining its purpose, commands, configuration, and usage for managing development tasks.
    *   **Key Exports/Classes/Functions**: N/A (Documentation)
    *   **Dependencies & Imports**: N/A
    *   **Internal Flow**: Describes commands like `init`, `parse-prd`, `list`, `update`, `generate`, `set-status`, `expand`, etc.
    *   **Nuances & Patterns**: Explains how `tasks.json` is used, AI integration (Claude, Perplexity), logging, and dependency management within the task system. These two READMEs appear to be identical.

### `src/app/`

*   **Path & Type**: `src/app/globals.css` – CSS File
    *   **Responsibility**: Defines global styles for the application, including font imports (`Excalifont`), Tailwind CSS imports, and CSS custom properties for theming (light/dark mode).
    *   **Key Exports/Classes/Functions**: N/A (CSS)
    *   **Dependencies & Imports**: `@tailwindcss`, `tw-animate-css`.
    *   **Internal Flow**: N/A (Declarative styles)
    *   **Nuances & Patterns**: Uses Oklch for colors. Defines `--radius` and other theme variables. Includes a `no-scrollbar` utility. `font-family: 'Excalifont'` is applied to `body`.

*   **Path & Type**: `src/app/layout.tsx` – Next.js Root Layout (React Server Component)
    *   **Responsibility**: Defines the root HTML structure for the application, wraps content with the ClerkProvider for authentication, and includes global components like `SiteHeader` and `SiteFooter`.
    *   **Key Exports/Classes/Functions**: `RootLayout` (default export), `metadata`.
    *   **Dependencies & Imports**: `next/font` (Geist, Geist_Mono), `@clerk/nextjs` (ClerkProvider), `./globals.css`, `SiteHeader`, `SiteFooter`, `Toaster` (from `sonner`).
    *   **Internal Flow**: Renders `<html>`, `<body>`, applies fonts, wraps children with `ClerkProvider`, and renders shared layout elements.
    *   **Nuances & Patterns**: Standard Next.js App Router root layout. `suppressHydrationWarning` is used.

*   **Path & Type**: `src/app/page.tsx` – Landing Page (React Client Component)
    *   **Responsibility**: Renders the main landing page for Storywink.ai.
    *   **Key Exports/Classes/Functions**: `Home` (default export).
    *   **Dependencies & Imports**: `Button`, `Link`, `Image`, `StatsCounter`, `ChevronLeft`, `ChevronRight`, `cn`, `CarouselSyncContext`, `SynchronizedCarousels`, `SynchronizedBeforeAfterPair`.
    *   **Internal Flow**:
        *   Uses `SynchronizedCarousels` context provider to manage multiple image carousels.
        *   Displays a hero section with a call to action ("Create Your Storybook").
        *   Renders two `SynchronizedBeforeAfterPair` components to showcase original vs. illustrated images.
        *   Includes a `StatsCounter` component.
    *   **Nuances & Patterns**:
        *   `CarouselSyncContext` manages the `currentIndex` and transition state for multiple carousels to sync their display.
        *   `SynchronizedBeforeAfterPair` displays a pair of original and illustrated images, reacting to the shared context.
        *   Uses placeholder image data directly in the component.

### `src/app/api/book/[bookId]/export/pdf/route.ts`

*   **Path & Type**: `src/app/api/book/[bookId]/export/pdf/route.ts` – Next.js API Route Handler (GET)
    *   **Responsibility**: Handles requests to generate and download a PDF version of a specified book.
    *   **Key Exports/Classes/Functions**: `GET` (async function).
    *   **Dependencies & Imports**: `NextResponse`, `@clerk/nextjs/server` (auth), `prisma` (from `@/lib/db`), `generateBookPdf` (from `@/lib/pdf/generateBookPdf`), `logger`, `@prisma/client` (Book, Page).
    *   **Internal Flow**:
        1.  Authenticates the user using Clerk.
        2.  Validates `bookId` parameter.
        3.  Fetches book data (including pages and their generated image URLs) from the database, ensuring the user owns the book.
        4.  Calls `generateBookPdf` service (which uses Puppeteer) to create the PDF buffer.
        5.  Returns the PDF buffer as a `NextResponse` with appropriate `Content-Type` and `Content-Disposition` headers to trigger a download.
    *   **Nuances & Patterns**: Securely fetches book data ensuring user ownership. Delegates PDF generation to a separate service.

### `src/app/api/book/[bookId]/page/[pageId]/route.ts`

*   **Path & Type**: `src/app/api/book/[bookId]/page/[pageId]/route.ts` – Next.js API Route Handler (PATCH)
    *   **Responsibility**: Handles updates to a specific page within a book, primarily for saving edited text.
    *   **Key Exports/Classes/Functions**: `PATCH` (async function).
    *   **Dependencies & Imports**: `NextResponse`, `@clerk/nextjs/server` (auth), `prisma` (from `@/lib/db`), `zod` (for validation).
    *   **Internal Flow**:
        1.  Authenticates the user.
        2.  Validates `bookId` and `pageId` parameters.
        3.  Parses and validates the request body (expects `text`) using Zod schema `updatePageSchema`.
        4.  Verifies that the page belongs to the specified book and that the book belongs to the authenticated user.
        5.  Updates the page's `text` in the database and sets `textConfirmed` to `false` (as text has been edited).
        6.  Returns the updated page data or an error response.
    *   **Nuances & Patterns**: Ensures user ownership and page-book association before updating. Resets `textConfirmed` on edit.

### `src/app/api/book/[bookId]/reorder/route.ts`

*   **Path & Type**: `src/app/api/book/[bookId]/reorder/route.ts` – Next.js API Route Handler (POST)
    *   **Responsibility**: Handles requests to reorder pages within a book.
    *   **Key Exports/Classes/Functions**: `POST` (async function).
    *   **Dependencies & Imports**: `NextResponse`, `@clerk/nextjs/server` (auth), `zod`, `prisma`, `logger`.
    *   **Internal Flow**:
        1.  Authenticates the user.
        2.  Validates `bookId`.
        3.  Parses and validates the request body (expects an array of `{ pageId: string, index: number }`) using Zod schema `reorderRequestSchema`.
        4.  Verifies user ownership of the book.
        5.  Uses a Prisma transaction (`prisma.$transaction`) to update the `index` (and `pageNumber` as `index + 1`) for all specified pages atomically.
        6.  Ensures each page update within the transaction affects exactly one row (i.e., the page belongs to the book).
        7.  Returns a success or error response.
    *   **Nuances & Patterns**: Uses a database transaction for atomicity of page reordering. Validates page ownership within the update.

### `src/app/api/book/[bookId]/route.ts`

*   **Path & Type**: `src/app/api/book/[bookId]/route.ts` – Next.js API Route Handler (GET, PATCH)
    *   **Responsibility**:
        *   `GET`: Fetches details for a specific book, including its pages and associated assets, ensuring user ownership.
        *   `PATCH`: Updates details of a specific book (e.g., title, child's name, art style, coverAssetId, isWinkifyEnabled).
    *   **Key Exports/Classes/Functions**: `GET` (async function), `PATCH` (async function).
    *   **Dependencies & Imports**: `NextRequest`, `NextResponse`, `@clerk/nextjs/server` (auth), `prisma`, `BookStatus` (from `@prisma/client`), `zod`, `logger`.
    *   **Internal Flow (GET)**:
        1.  Authenticates user.
        2.  Validates `bookId`.
        3.  Fetches the book with its pages (ordered by `index`) and associated assets, ensuring `userId` matches the authenticated user.
        4.  Returns book data or 404/401.
    *   **Internal Flow (PATCH)**:
        1.  Authenticates user.
        2.  Validates `bookId`.
        3.  Parses and validates request body using `updateBookSchema` (allows partial updates for `artStyle`, `isWinkifyEnabled`, `title`, `childName`, `coverAssetId`).
        4.  Uses `prisma.book.updateMany` with `where: { id: bookId, userId: userId }` to ensure ownership and existence before updating.
        5.  Updates specified fields and `updatedAt`.
        6.  Returns success or error.
    *   **Nuances & Patterns**: `GET` includes nested data (pages with assets). `PATCH` uses `updateMany` for an atomic ownership check and update. `updateBookSchema` uses `.strict()` and `.optional()` for flexible partial updates.

### `src/app/api/book/create/route.ts`

*   **Path & Type**: `src/app/api/book/create/route.ts` – Next.js API Route Handler (POST)
    *   **Responsibility**: Creates a new book draft with initial pages based on provided asset IDs.
    *   **Key Exports/Classes/Functions**: `POST` (async function).
    *   **Dependencies & Imports**: `NextRequest`, `NextResponse`, `@clerk/nextjs/server` (auth), `zod`, `prisma`, `logger`, `BookStatus`, `PageType` (from `@prisma/client`).
    *   **Internal Flow**:
        1.  Authenticates user.
        2.  Validates request body (expects `assetIds` array) using `createBookSchema`.
        3.  Uses a Prisma transaction:
            *   Fetches the provided `Asset` records to get their URLs, ensuring the user owns them.
            *   Creates a new `Book` record with default status `DRAFT`, placeholder title/childName, and `pageLength` based on `assetIds.length`.
            *   Creates `Page` records for each asset, setting `originalImageUrl`, `pageNumber`, `index` (0-based), `pageType`, and `isTitlePage` (for the first page).
        4.  Returns the `bookId` of the newly created book or an error.
    *   **Nuances & Patterns**: Transaction ensures atomicity. Validates asset ownership. Sets initial page order and title page flag.

### `src/app/api/book-content/route.ts`

*   **Path & Type**: `src/app/api/book-content/route.ts` – Next.js API Route Handler (GET)
    *   **Responsibility**: Fetches the pages (with their text and other selected fields) for a specific book, ensuring user ownership.
    *   **Key Exports/Classes/Functions**: `GET` (async function).
    *   **Dependencies & Imports**: `NextRequest`, `NextResponse`, `@clerk/nextjs/server` (auth), `prisma`.
    *   **Internal Flow**:
        1.  Authenticates user.
        2.  Gets `bookId` from query parameters.
        3.  Fetches the book (checking `userId`) and includes its pages, ordered by `pageNumber`. Selects specific page fields like `id`, `text`, `pageNumber`.
        4.  Returns only the `pages` array or an error.
    *   **Nuances & Patterns**: This endpoint seems to provide a subset of what `GET /api/book/[bookId]` provides. It might be redundant if the latter is always sufficient.

### `src/app/api/book-status/route.ts`

*   **Path & Type**: `src/app/api/book-status/route.ts` – Next.js API Route Handler (GET)
    *   **Responsibility**: Fetches the current status (`BookStatus`) of a specific book, ensuring user ownership. Used for polling by the frontend.
    *   **Key Exports/Classes/Functions**: `GET` (async function).
    *   **Dependencies & Imports**: `NextRequest`, `NextResponse`, `@clerk/nextjs/server` (auth), `prisma`.
    *   **Internal Flow**:
        1.  Authenticates user.
        2.  Gets `bookId` from query parameters.
        3.  Fetches the book (checking `userId`) and selects only the `status` field.
        4.  Returns the book status or an error.
    *   **Nuances & Patterns**: Lightweight endpoint specifically for status polling.

### `src/app/api/generate/illustrations/route.ts`

*   **Path & Type**: `src/app/api/generate/illustrations/route.ts` – Next.js API Route Handler (POST)
    *   **Responsibility**: Initiates the AI illustration generation process for a book.
    *   **Key Exports/Classes/Functions**: `POST` (async function), `IllustrationGenerationJobData` (interface).
    *   **Dependencies & Imports**: `NextResponse`, `@clerk/nextjs/server` (auth), `zod`, `getQueue`, `QueueName`, `flowProducer` (from `@/lib/queue`), `prisma`, `BookStatus`, `logger`.
    *   **Internal Flow**:
        1.  Authenticates user.
        2.  Validates request body (expects `bookId`) using `illustrationRequestSchema`.
        3.  Fetches the book with its pages, ensuring user ownership and that the book status is `COMPLETED` (i.e., text generation is done).
        4.  Updates book status to `ILLUSTRATING`.
        5.  Creates a BullMQ flow:
            *   A parent job for the `BookFinalize` queue.
            *   Child jobs for the `IllustrationGeneration` queue, one for each page. Each child job receives `IllustrationGenerationJobData` (page details, book title, art style, etc.).
        6.  Returns a 202 Accepted response.
    *   **Nuances & Patterns**: Uses BullMQ `flowProducer` to manage a parent job (finalization) that depends on multiple child jobs (per-page illustration). This ensures the book's final status is updated only after all illustrations are attempted.

### `src/app/api/generate/story/route.ts`

*   **Path & Type**: `src/app/api/generate/story/route.ts` – Next.js API Route Handler (POST)
    *   **Responsibility**: Initiates the AI story generation process for a book.
    *   **Key Exports/Classes/Functions**: `POST` (async function), `StoryGenerationJobData` (interface).
    *   **Dependencies & Imports**: `NextRequest`, `NextResponse`, `@clerk/nextjs/server` (auth), `zod`, `getQueue`, `QueueName`, `prisma`, `BookStatus`, `logger`, `StoryGenerationInput` (type from `prompts.ts`).
    *   **Internal Flow**:
        1.  Authenticates user.
        2.  Validates request body (expects `bookId`) using `triggerStoryRequestSchema`.
        3.  Fetches the book with its pages (ordered by `index`), ensuring user ownership and appropriate status (e.g., `DRAFT`, `FAILED`).
        4.  Validates that required book details (title, child name, art style) are set.
        5.  Filters out the cover page and prepares `storyPages` data for the job.
        6.  Updates book status to `GENERATING`.
        7.  Prepares `StoryGenerationJobData` (including `promptContext` and `storyPages`).
        8.  Adds a job to the `StoryGeneration` BullMQ queue.
        9.  Returns a 202 Accepted response.
    *   **Nuances & Patterns**: Prepares data specifically for the `story-generation.worker`. Recalculates `pageNumber` for the worker based on non-cover pages.

### `src/app/api/health/route.ts`

*   **Path & Type**: `src/app/api/health/route.ts` – Next.js API Route Handler (GET)
    *   **Responsibility**: Provides a basic health check endpoint.
    *   **Key Exports/Classes/Functions**: `GET` (async function).
    *   **Dependencies & Imports**: `NextResponse`.
    *   **Internal Flow**: Returns a JSON response with status "ok" and the current timestamp.
    *   **Nuances & Patterns**: Standard health check for monitoring.

### `src/app/api/upload/route.ts`

*   **Path & Type**: `src/app/api/upload/route.ts` – Next.js API Route Handler (POST)
    *   **Responsibility**: Handles file uploads (images), uploads them to Cloudinary, and creates `Asset` records in the database. If a `bookId` is provided, it also creates new `Page` records linked to the new assets and the existing book.
    *   **Key Exports/Classes/Functions**: `POST` (async function).
    *   **Dependencies & Imports**: `NextResponse`, `cloudinary` (from `v2`), `prisma`, `@clerk/nextjs/server` (auth, currentUser), `logger`, `PageType`, `ensureUser`.
    *   **Internal Flow**:
        1.  Authenticates user using Clerk.
        2.  Calls `ensureUser` to synchronize Clerk user data with the local DB.
        3.  Parses `formData` to get files and an optional `bookId`.
        4.  Validates file types and sizes.
        5.  For each file:
            *   Uploads the file buffer to Cloudinary using `uploadToCloudinary` helper.
            *   Uses a Prisma transaction (`prisma.$transaction`):
                *   Creates an `Asset` record with Cloudinary URL, public ID, thumbnail URL, etc.
                *   If `bookId` is present (and user owns the book), creates a new `Page` record linked to the new `Asset` and the `Book`, incrementing `pageNumber` and `index`.
        6.  Returns an array of created asset data (ID, thumbnail URL).
    *   **Nuances & Patterns**: Uses transactions for atomicity when creating Assets and Pages. Generates thumbnail URLs using Cloudinary transformations. Handles optional `bookId` to add pages to an existing book.

### `src/app/api/webhooks/clerk/route.ts`

*   **Path & Type**: `src/app/api/webhooks/clerk/route.ts` – Next.js API Route Handler (POST)
    *   **Responsibility**: Handles webhook events from Clerk for user creation, updates, and deletion to keep the local `User` database synchronized.
    *   **Key Exports/Classes/Functions**: `POST` (async function).
    *   **Dependencies & Imports**: `svix` (Webhook), `next/headers`, `@clerk/nextjs/server` (WebhookEvent), `prisma`, `logger`, `NextResponse`, `ensureUser`.
    *   **Internal Flow**:
        1.  Verifies the webhook signature using Svix headers and the `CLERK_WEBHOOK_SECRET`.
        2.  Processes different event types (`user.created`, `user.updated`, `user.deleted`):
            *   For `user.created` and `user.updated`: Extracts user details from the event payload and calls `ensureUser` to upsert the user in the local database based on `clerkId`.
            *   For `user.deleted`: Extracts the `clerkId` and deletes the corresponding user from the local database.
        3.  Returns a success or error response.
    *   **Nuances & Patterns**: Crucial for keeping local user data in sync with Clerk. Uses `ensureUser` for idempotent user creation/updates. Handles user deletion.

### `src/app/book/[bookId]/preview/page.tsx`

*   **Path & Type**: `src/app/book/[bookId]/preview/page.tsx` – React Client Component (Page)
    *   **Responsibility**: Displays a completed storybook in a flipbook format for preview.
    *   **Key Exports/Classes/Functions**: `BookPreviewPage` (default export).
    *   **Dependencies & Imports**: `useState`, `useEffect`, `useCallback`, `useRef`, `useParams`, `useRouter`, `Link`, `@prisma/client` (Book, Page, BookStatus), `lucide-react` (icons), `Button`, `Card`, `Progress`, `Sheet`, `BookPageGallery`, `FlipbookViewer`, `FlipbookActions`, `toast`.
    *   **Internal Flow**:
        1.  Fetches book data (including pages) via `fetchBookData` (local async function calling `/api/book/[bookId]`) on mount and when `bookId` changes.
        2.  If the book status is `ILLUSTRATING`, polls `loadBook` (which fetches data) at `POLLING_INTERVAL` to check for updates.
        3.  Renders different UI based on `book.status`:
            *   `ILLUSTRATING`: Shows a progress bar and loading state.
            *   `FAILED`: Shows an error message.
            *   `COMPLETED`: Renders the `FlipbookViewer` and `BookPageGallery`.
        4.  `BookPageGallery` displays page thumbnails and allows navigation by calling `onPageSelect`.
        5.  `FlipbookViewer` displays the book pages. `onPageChange` prop updates `currentPageNumber` state.
        6.  Navigation buttons (`handlePrevPage`, `handleNextPage`) interact with the `FlipbookViewer` via its `ref`.
        7.  "Export PDF" button triggers a download by navigating to `/api/book/[bookId]/export/pdf`.
    *   **Nuances & Patterns**: Client-side data fetching and polling. Uses a `ref` to control the `FlipbookViewer` component. Manages loading and error states. Responsive layout with different header/options for mobile (using `Sheet`) vs. desktop.

### `src/app/create/[bookId]/edit/page.tsx`

*   **Path & Type**: `src/app/create/[bookId]/edit/page.tsx` – React Client Component (Page)
    *   **Responsibility**: Provides the main editor interface for a book, allowing users to edit the cover, reorder pages, and choose an art style. It also allows adding more photos and triggering story generation.
    *   **Key Exports/Classes/Functions**: `EditBookPage` (default export).
    *   **Dependencies & Imports**: `useState`, `useEffect`, `useRef`, `useMemo`, `useCallback`, `useParams`, `useRouter`, `toast`, `lucide-react` (icons), `StoryboardPage`, `BookWithStoryboardPages` (types), `BottomToolbar`, `PhotoSourceSheet`, `logger`, `Canvas`, `Sheet`, `StoryboardGrid`, `Button`, `Drawer`, `ArtStylePicker`, `CoverEditorPanel`, `Asset` (from `@prisma/client`), `Tooltip`, `WritingProgressScreen`, `useMediaQuery`.
    *   **Internal Flow**:
        1.  Fetches `BookWithStoryboardPages` data via `/api/book/[bookId]` on mount.
        2.  Manages local state for `bookData`, `isLoading`, `error`, `activeTab`, panel visibility (`isPhotoSheetOpen`, `isPagesPanelOpen`, etc.), pending changes for art style and cover details, and loading states for various save/generation operations.
        3.  `BottomToolbar` handles tab switching (`handleTabChange`), which controls which editor panel is shown (cover, pages, art style).
        4.  **Cover Editing**: `CoverEditorPanel` allows changes to title, child name, and cover asset. `handleSaveCover` calls `PATCH /api/book/[bookId]`.
        5.  **Page Reordering**: `StoryboardGrid` (using `dnd-kit`) allows drag-and-drop. `handleStoryboardOrderChange` updates local `storyboardOrder`. `handleSaveStoryboardOrder` calls `POST /api/book/[bookId]/reorder`.
        6.  **Art Style Editing**: `ArtStylePicker` allows style and "Winkify" selection. `handleSaveArtStyle` calls `PATCH /api/book/[bookId]`.
        7.  **Adding Photos**: `PhotoSourceSheet` is opened. `handleAddPhotoFileInputChange` uploads files to `/api/upload` (with `bookId`) and then calls `fetchBookData` to refresh.
        8.  **Story Generation**: "Generate Story" button (`handleGenerateStory`), enabled when required fields are filled (`canGenerate` memo), calls `POST /api/generate/story`. Shows `WritingProgressScreen` which polls for status and calls `handleGenerationComplete` or `handleGenerationError`.
        9.  `Canvas` component displays the current selected page or cover.
        10. Responsive panel display: Uses `Drawer` for desktop side panels and `Sheet` for mobile bottom sheets.
    *   **Nuances & Patterns**: Complex client-side state management. Extensive use of `useCallback` and `useMemo` for performance. `isMountedRef` for safe async state updates. Handles different UI presentations for desktop vs. mobile using `useMediaQuery`. Filters cover page from `storyboardOrder` for the grid.

### `src/app/create/layout.tsx`

*   **Path & Type**: `src/app/create/layout.tsx` – Next.js Layout Component (Client Component)
    *   **Responsibility**: Provides a layout for the book creation flow (e.g., `/create`, `/create/[bookId]/edit`, `/create/review`), wrapping them with `BookCreationProvider`.
    *   **Key Exports/Classes/Functions**: Default export `CreateLayout`.
    *   **Dependencies & Imports**: `ReactNode`, `BookCreationProvider` (from `@/context/BookCreationContext`).
    *   **Internal Flow**: Renders children wrapped in `BookCreationProvider`.
    *   **Nuances & Patterns**: Enables shared state via context for the creation process, though its current necessity is under review as per `cleanup.md`.

### `src/app/create/page.tsx`

*   **Path & Type**: `src/app/create/page.tsx` – React Client Component (Page)
    *   **Responsibility**: The initial page for starting a new book creation process, primarily focused on photo uploads.
    *   **Key Exports/Classes/Functions**: `CreateBookPage` (default export).
    *   **Dependencies & Imports**: `useState`, `useRef`, `useRouter`, `Button`, `ArrowLeft`, `Loader2`, `Plus` (icons), `toast`, `PhotoSourceSheet`, `UploadProgressScreen`, `logger`.
    *   **Internal Flow**:
        1.  User clicks "Start Creating" (`handleStartCreatingClick`), which opens `PhotoSourceSheet`.
        2.  User chooses to upload from phone, triggering `fileInputRef.current?.click()`.
        3.  `handleFileInputChange`:
            *   Sets loading/progress states (`isUploading`, `showProgressScreen`).
            *   Uploads files to `/api/upload` (without a `bookId` initially).
            *   On successful upload, calls `handleUploadComplete`.
        4.  `handleUploadComplete`:
            *   Calls `handleCreateBook` (local async function that POSTs to `/api/book/create` with asset IDs).
            *   If book creation is successful, navigates to `/create/[bookId]/edit`.
            *   Handles errors and updates UI accordingly.
        5.  `UploadProgressScreen` is shown during upload and initial book creation.
    *   **Nuances & Patterns**: Manages the initial asset upload and then triggers the book draft creation. Uses a full-screen progress overlay.

### `src/app/create/review/page.tsx`

*   **Path & Type**: `src/app/create/review/page.tsx` – React Client Component (Page with Suspense)
    *   **Responsibility**: Allows users to review and edit the AI-generated text for each page of their book, confirm pages, and trigger illustration generation. This page is heavily focused on mobile optimization.
    *   **Key Exports/Classes/Functions**: `ReviewPage` (default export), `ReviewPageContent` (inner component).
    *   **Dependencies & Imports**: `useState`, `useEffect`, `useRef`, `useCallback`, `Suspense`, `Image`, `Button`, `Textarea`, `useRouter`, `useSearchParams`, `useBookCreation` (context, though `bookId` primarily from URL), `toast`, `Loader2`, `@prisma/client` (types), `cn`, `RoughButton`, `RoughBorder`, `PageTracker`, `PageCard`, `NavigationControls`.
    *   **Internal Flow**:
        1.  `bookId` is fetched from URL search parameters.
        2.  `fetchBookData` (local async function) fetches full book details (including pages with text) from `/api/book/[bookId]` on mount.
        3.  Manages state for `pages` (array of `PageData`), `bookDetails`, `currentIndex` (current page being viewed), `confirmed` (array of booleans), loading states (`isLoadingText`, `isSavingPage`, `isStartingIllustration`, `isAwaitingFinalStatus`).
        4.  **Text Polling**: If book status is `GENERATING`, polls `/api/book-status` via `checkTextStatus` until status changes to `COMPLETED` or `FAILED`, then re-fetches full content.
        5.  **Final Status Polling**: If book status is `ILLUSTRATING` (or after triggering illustration), polls `/api/book-status` via `checkFinalBookStatus` until status is `COMPLETED`, `PARTIAL`, or `FAILED`, then navigates accordingly.
        6.  **UI Components**:
            *   `PageTracker`: Displays progress dots, total confirmed, and the "Illustrate My Book" button.
            *   `PageCard`: Displays the image and text for the `currentPageData`. Handles text editing (`handleTextChange`) and confirmation (`toggleConfirm`). Title page (`currentIndex === 0`) uses an `Input` for `pendingTitleReview`; story pages use `Textarea`.
            *   `NavigationControls`: Provides "Previous" and "Next" buttons.
        7.  `toggleConfirm`: Saves title changes (for title page) via `PATCH /api/book/[bookId]` or page text changes via `PATCH /api/book/[bookId]/page/[pageId]`, setting `textConfirmed` to true.
        8.  `handleIllustrate`: Triggered when all pages are confirmed. Calls `POST /api/generate/illustrations`. Sets `isAwaitingFinalStatus` to true to start polling for final book status.
        9.  Keyboard navigation (left/right arrows) is supported.
    *   **Nuances & Patterns**: Heavy reliance on client-side state and effects for polling and UI updates. Mobile-first design with dedicated components for tracking, page display, and navigation. `isMountedRef` for safe async state updates.

### `src/app/gallery/page.tsx`

*   **Path & Type**: `src/app/gallery/page.tsx` – React Server Component (Page)
    *   **Responsibility**: Displays a public gallery of example storybooks.
    *   **Key Exports/Classes/Functions**: `GalleryPage` (default export).
    *   **Dependencies & Imports**: None explicitly shown beyond React.
    *   **Internal Flow**: Currently a placeholder.
    *   **Nuances & Patterns**: Intended for showcasing books.

### `src/app/library/actions.ts`

*   **Path & Type**: `src/app/library/actions.ts` – Next.js Server Actions File
    *   **Responsibility**: Contains server-side logic for library operations like fetching user books, deleting books, and duplicating books.
    *   **Key Exports/Classes/Functions**: `getUserBooks`, `deleteBook`, `duplicateBook`, `LibraryBook` (type), `UserBooksResult` (interface).
    *   **Dependencies & Imports**: `@clerk/nextjs/server` (auth), `prisma`, `@prisma/client` (types), `revalidatePath`, `logger`.
    *   **Internal Flow (`getUserBooks`)**:
        1.  Authenticates user.
        2.  Fetches books for the user, selecting specific fields and the first page's `generatedImageUrl` as a `thumbnailUrl`.
        3.  Sorts books into `inProgressBooks` and `completedBooks`.
    *   **Internal Flow (`deleteBook`)**:
        1.  Authenticates user.
        2.  Verifies book ownership.
        3.  Deletes the book.
        4.  Calls `revalidatePath('/library')` to update the cache.
    *   **Internal Flow (`duplicateBook`)**:
        1.  Authenticates user.
        2.  Fetches the original book to copy its details.
        3.  Creates a new book record with copied details, a modified title (e.g., " (Copy)"), and `DRAFT` status.
        4.  Calls `revalidatePath('/library')`.
    *   **Nuances & Patterns**: Uses server actions for secure data modification and fetching. `revalidatePath` is used for cache invalidation and UI updates.

### `src/app/library/library-client-view.tsx`

*   **Path & Type**: `src/app/library/library-client-view.tsx` – React Client Component
    *   **Responsibility**: Renders the user's library of books, handling client-side interactions like sorting, deleting, and duplicating.
    *   **Key Exports/Classes/Functions**: `LibraryClientView` (default export).
    *   **Dependencies & Imports**: `useState`, `useMemo`, `useTransition`, `Button`, `Card`, `Link`, `BookCard`, `LibraryBook`, `UserBooksResult`, `deleteBook`, `duplicateBook` (server actions), `Select`, `AlertDialog`, `logger`, `toast`, `useRouter`, `lucide-react` (icons), `Image`, `cn`, `Badge`, `DropdownMenu`, `Skeleton`, `Tabs`, `Drawer`.
    *   **Internal Flow**:
        1.  Receives `initialData` (fetched server-side).
        2.  Manages state for `sortBy`, delete confirmation dialog (`isDeleteDialogOpen`, `bookToDelete`), and loading states (`isDeleting`, `isDuplicating`).
        3.  Uses `useMemo` to sort books based on `sortBy`.
        4.  Renders books in "In Progress" and "Completed" sections (or tabs on mobile).
        5.  Each book is rendered using `BookCard`.
        6.  Handles delete (`handleDelete`) and duplicate (`handleDuplicate`) actions by calling server actions and using `useTransition` for pending UI.
        7.  Provides sorting UI (`Select` for desktop, `Drawer` for mobile).
        8.  Uses `Tabs` for mobile layout to switch between "In Progress" and "Completed".
    *   **Nuances & Patterns**: Client component for interactivity, taking initial data from a server component. Uses server actions for mutations. Responsive design with different layouts/controls for mobile vs. desktop.

### `src/app/library/page.tsx`

*   **Path & Type**: `src/app/library/page.tsx` – React Server Component (Page)
    *   **Responsibility**: Server-side entry point for the library page. Fetches initial book data and passes it to the client component.
    *   **Key Exports/Classes/Functions**: `LibraryPage` (default export).
    *   **Dependencies & Imports**: `getUserBooks` (server action), `LibraryClientView`.
    *   **Internal Flow**: Calls `getUserBooks` server action to fetch data, then renders `LibraryClientView` passing the fetched data as `initialData`.
    *   **Nuances & Patterns**: Follows the pattern of using Server Components for data fetching and Client Components for interactivity.

### `src/app/pricing/page.tsx`, `src/app/privacy/page.tsx`, `src/app/terms/page.tsx`

*   **Path & Type**: Static content pages (React Server Components).
    *   **Responsibility**: Display pricing, privacy policy, and terms of service information, respectively.
    *   **Key Exports/Classes/Functions**: Default page component exports.
    *   **Dependencies & Imports**: Basic React/Next.js.
    *   **Internal Flow**: Render static content with placeholder text.
    *   **Nuances & Patterns**: Standard static pages.

### `src/app/sign-in/[[...sign-in]]/page.tsx`, `src/app/sign-up/[[...sign-up]]/page.tsx`

*   **Path & Type**: Clerk Authentication Pages (React Client Components).
    *   **Responsibility**: Render Clerk's pre-built UI components for sign-in and sign-up.
    *   **Key Exports/Classes/Functions**: Default page component exports.
    *   **Dependencies & Imports**: `@clerk/nextjs` (`SignIn`, `SignUp`).
    *   **Internal Flow**: Display the respective Clerk UI component.
    *   **Nuances & Patterns**: Leverages Clerk's catch-all routes for its UI.

### `src/app/upload/actions.ts`

*   **Path & Type**: `src/app/upload/actions.ts` – Next.js Server Actions File
    *   **Responsibility**: Handles server-side image upload logic, including validation, Cloudinary upload, and Asset record creation in the database.
    *   **Key Exports/Classes/Functions**: `handleImageUpload` (async server action), `UploadFileParams` (interface), `UploadResult` (interface).
    *   **Dependencies & Imports**: `@clerk/nextjs/server` (auth), `logger`, `uploadImage` (from `@/lib/imageUpload`), `prisma`.
    *   **Internal Flow**:
        1.  Authenticates user.
        2.  Validates `fileName`, `fileType`, `fileSize` against predefined constants.
        3.  Calls `uploadImage` (from `lib/imageUpload.ts`, which uses Cloudinary) to upload `fileDataUrl`.
        4.  Generates a `thumbnailUrl` using Cloudinary transformations.
        5.  Creates an `Asset` record in the database with details from the Cloudinary upload result.
        6.  Returns a success/failure result including `assetId`, `cloudinaryUrl`, etc.
    *   **Nuances & Patterns**: Server-side validation complements client-side checks. Separates Cloudinary interaction from the API route. Uses base64 data URL for file transfer.

### `src/components/`

*   **Path & Type**: `src/components/index.ts` – Index File
    *   **Responsibility**: Intended to export components from the `components` directory for easier imports, but currently exports nothing.
    *   **Key Exports/Classes/Functions**: None.
    *   **Dependencies & Imports**: None.
    *   **Internal Flow**: N/A.
    *   **Nuances & Patterns**: Placeholder.

*   **Path & Type**: `src/components/book-card.tsx` – React Client Component
    *   **Responsibility**: Renders a card displaying information about a single book in the user's library.
    *   **Key Exports/Classes/Functions**: `BookCard` (default export), `BookCardProps` (interface).
    *   **Dependencies & Imports**: `Link`, `Image`, `@prisma/client` (BookStatus, Page), `Card` components, `Button`, `Badge`, `DropdownMenu` components, `lucide-react` (icons), `useRouter`, `cn`, `LibraryBook` (type from `library/actions.ts`).
    *   **Internal Flow**:
        1.  Receives book data (`id`, `title`, `status`, `updatedAt`, `coverImageUrl`, `pages`) and action handlers (`onDeleteClick`, `onDuplicateClick`), and loading states (`isDeleting`, `isDuplicating`).
        2.  Determines cover image from `coverImageUrl` or the first page's `generatedImageUrl`.
        3.  Renders book title, last updated date, and status badge (with icon and color based on status).
        4.  Provides "View" or "Edit" button based on `book.status`.
        5.  Includes a dropdown menu (`MoreHorizontal` icon) for "Duplicate" and "Delete" actions.
        6.  Shows loading spinners on buttons when `isDeleting` or `isDuplicating` is true.
        7.  Layout adapts for mobile (image on left, content on right) vs. desktop (image on top).
    *   **Nuances & Patterns**: Responsive card design. Conditional rendering based on book status. Uses helper functions `getStatusVariant` and `getStatusIcon`.

*   **Path & Type**: `src/components/book/BookPageGallery.tsx` – React Client Component
    *   **Responsibility**: Displays a horizontal scrollable gallery of page thumbnails for a book, allowing users to select a page.
    *   **Key Exports/Classes/Functions**: `BookPageGallery` (default export).
    *   **Dependencies & Imports**: `useRef`, `useEffect`, `Image`, `@prisma/client` (Page, BookStatus), `lucide-react` (Loader2, AlertTriangle), `cn`.
    *   **Internal Flow**:
        1.  Receives `pages`, `bookStatus`, `currentPageNumber`, and `onPageSelect` callback.
        2.  Renders a scrollable `div` containing a button for each page.
        3.  Each button displays the page's `generatedImageUrl` as a thumbnail.
        4.  Indicates loading state (`ILLUSTRATING` status and no image) or failed state (`FAILED` status and no image) for thumbnails.
        5.  Highlights the `currentPageNumber` thumbnail.
        6.  Uses `useEffect` and `useRef` to scroll the active thumbnail into view.
    *   **Nuances & Patterns**: Horizontal scrolling gallery optimized for touch. Visual feedback for active, loading, and failed page states.

*   **Path & Type**: `src/components/book/FlipbookViewer.tsx` – React Client Component
    *   **Responsibility**: Renders book pages in an interactive flipbook format using `react-pageflip`.
    *   **Key Exports/Classes/Functions**: `FlipbookViewer` (default export, `forwardRef`), `FlipbookActions` (interface for ref).
    *   **Dependencies & Imports**: `useRef`, `useEffect`, `useState`, `useCallback`, `forwardRef`, `useImperativeHandle`, `HTMLFlipBook` (from `react-pageflip`), `Page` (type), `Image`, `cn`, `Loader2`.
    *   **Internal Flow**:
        1.  Receives `pages`, `initialPageNumber`, `onPageChange` callback.
        2.  Uses `HTMLFlipBook` component to render pages.
        3.  Calculates `spreadWidth` and `pageSide` based on container dimensions for responsive sizing.
        4.  Handles page flip events (`handleFlip`) and calls `onPageChange`.
        5.  On initialization (`handleInit`), turns to `initialPageNumber`.
        6.  Exposes `pageFlip` API instance via `ref` using `useImperativeHandle`.
        7.  Each page displays its `generatedImageUrl`. Shows loading/error placeholders if image is missing.
    *   **Nuances & Patterns**: Wraps `react-pageflip`. Responsive sizing. Exposes internal API via ref for parent control.

*   **Path & Type**: `src/components/create/PhotoSourceSheet.tsx` – React Client Component
    *   **Responsibility**: Renders a sheet (bottom drawer on mobile) offering options to add photos (from phone or Google Photos).
    *   **Key Exports/Classes/Functions**: `PhotoSourceSheet` (default export).
    *   **Dependencies & Imports**: `Button`, `Sheet` components, `lucide-react` (Smartphone, ImageIcon).
    *   **Internal Flow**:
        1.  Controlled by `isOpen` and `onOpenChange` props.
        2.  Provides buttons for "Choose from Phone" (calls `onChooseFromPhone`) and "Import from Google Photos" (calls `onImportFromGooglePhotos`, currently disabled).
    *   **Nuances & Patterns**: Standard sheet component for presenting choices.

*   **Path & Type**: `src/components/create/UploadProgressScreen.tsx` – React Client Component
    *   **Responsibility**: Displays a full-screen loading/progress indicator during file uploads and initial book creation.
    *   **Key Exports/Classes/Functions**: `UploadProgressScreen` (default export).
    *   **Dependencies & Imports**: `Loader2` (icon).
    *   **Internal Flow**: Shows a spinning loader and a message "Hatching a story egg...". Props for `progress`, `currentFile`, `totalFiles` are present but currently not used to display detailed progress.
    *   **Nuances & Patterns**: Simple full-screen overlay for blocking UI during uploads.

*   **Path & Type**: `src/components/create/editor/ArtStylePicker.tsx` – React Client Component
    *   **Responsibility**: Allows users to select an art style for their book and toggle the "Winkify" feature.
    *   **Key Exports/Classes/Functions**: `ArtStylePicker` (default export).
    *   **Dependencies & Imports**: `Image`, `cn`, `Label`, `Switch`, `Card`, `STYLE_LIBRARY` (from `@/lib/ai/styleLibrary` via `require`).
    *   **Internal Flow**:
        1.  Receives `currentStyle`, `isWinkifyEnabled`, and change handlers.
        2.  Renders a grid of art style options based on `STYLE_LIBRARY`. Each option displays a reference image and label.
        3.  Highlights the `currentStyle`. Clicking an option calls `onStyleChange`.
        4.  Renders a `Switch` component for "Winkify", calling `onWinkifyChange`.
    *   **Nuances & Patterns**: Dynamically renders styles from `STYLE_LIBRARY`. Uses `require` for the CJS style library module.

*   **Path & Type**: `src/components/create/editor/BottomToolbar.tsx` – React Client Component
    *   **Responsibility**: Provides the main navigation toolbar at the bottom of the editor screen, allowing users to switch between editor tabs (Cover, Pages, Art Style) and add photos.
    *   **Key Exports/Classes/Functions**: `BottomToolbar` (default export), `EditorTab` (type).
    *   **Dependencies & Imports**: `Button`, `cn`, `lucide-react` (icons: BookOpen, LayoutGrid, Palette, Plus).
    *   **Internal Flow**:
        1.  Receives `activeTab`, `onTabChange`, `onAddPhotoClick`.
        2.  Renders buttons for each tab defined in a local `tabs` array.
        3.  Highlights the `activeTab`. Clicking a tab button calls `onTabChange`.
        4.  Includes an "Add Photo" button that calls `onAddPhotoClick`.
        5.  Layout adapts for mobile (full-width bottom bar) vs. desktop (centered, floating bar).
    *   **Nuances & Patterns**: Central navigation for the editor. Responsive design.

*   **Path & Type**: `src/components/create/editor/Canvas.tsx` – React Client Component
    *   **Responsibility**: Displays the currently selected book page or cover image in the editor, using an Embla carousel for navigation between pages.
    *   **Key Exports/Classes/Functions**: `Canvas` (default export).
    *   **Dependencies & Imports**: `useState`, `useEffect`, `useCallback`, `useMemo`, `useEmblaCarousel`, `EmblaOptionsType`, `EmblaCarouselType`, `Image`, `Button`, `lucide-react` (ChevronLeft, ChevronRight, ArrowLeft, ArrowRight), `cn`, `BookWithStoryboardPages`.
    *   **Internal Flow**:
        1.  Receives `bookData`.
        2.  `orderedPagesForDisplay` memo calculates the display order: cover page first (based on `bookData.coverAssetId` or `isTitlePage`), then other pages sorted by `index`.
        3.  Uses `useEmblaCarousel` to create a carousel of these pages.
        4.  Displays the image for each page (`page.asset.url` or `page.originalImageUrl`).
        5.  If it's the cover page (index 0), overlays the `bookData.title`.
        6.  Provides previous/next navigation buttons and dot indicators.
    *   **Nuances & Patterns**: Image carousel for page preview. Logic to determine and display cover page correctly.

*   **Path & Type**: `src/components/create/editor/CoverEditorPanel.tsx` – React Client Component
    *   **Responsibility**: Provides UI for editing the book's cover photo, title, and child's name.
    *   **Key Exports/Classes/Functions**: `CoverEditorPanel` (default export).
    *   **Dependencies & Imports**: `useState`, `Label`, `Input`, `Button`, `Tabs`, `Image`, `Asset` (type), `Check` (icon), `cn`.
    *   **Internal Flow**:
        1.  Receives `allBookAssets`, current cover/title/name values, and change handlers.
        2.  Uses `Tabs` to switch between "Photo" and "Title" editing sections.
        3.  **Photo Tab**: Displays a grid of `allBookAssets`. Clicking an asset calls `onCoverAssetSelect`. Highlights the `currentCoverAssetId`.
        4.  **Title Tab**: Provides `Input` fields for "Book Title" (calls `onTitleChange`) and "Child's Name" (calls `onChildNameChange`).
    *   **Nuances & Patterns**: Tabbed interface for organizing cover editing options.

*   **Path & Type**: `src/components/create/editor/StoryboardGrid.tsx` – React Client Component
    *   **Responsibility**: Displays a grid of draggable page thumbnails for reordering pages within a book.
    *   **Key Exports/Classes/Functions**: `StoryboardGrid` (default export), `SortablePageItem` (internal component).
    *   **Dependencies & Imports**: `useState`, `useEffect`, `@dnd-kit/core`, `@dnd-kit/sortable`, `@dnd-kit/utilities`, `Image`, `StoryboardPage` (type), `cn`.
    *   **Internal Flow**:
        1.  Receives `pages` (non-cover pages) and `onOrderChange` callback.
        2.  Manages internal `items` state, synced with `pages` prop.
        3.  Uses `DndContext` and `SortableContext` from `@dnd-kit` to enable drag-and-drop.
        4.  `SortablePageItem` renders each draggable page thumbnail, showing image and page number.
        5.  `handleDragEnd`: When a drag operation finishes, updates the local `items` order using `arrayMove`, re-calculates `index` and `pageNumber` for all items, and calls `onOrderChange` with the new, fully re-indexed list.
    *   **Nuances & Patterns**: Implements drag-and-drop functionality. Crucially, re-indexes all pages after a move to maintain a contiguous 0-based index for saving.

*   **Path & Type**: `src/components/create/editor/WritingProgressScreen.tsx` – React Client Component
    *   **Responsibility**: Displays a full-screen loading indicator while AI story generation is in progress. Polls for status updates.
    *   **Key Exports/Classes/Functions**: `WritingProgressScreen` (default export).
    *   **Dependencies & Imports**: `useState`, `useEffect`, `useRouter`, `Loader2`, `toast`, `BookStatus` (type).
    *   **Internal Flow**:
        1.  Receives `bookId`, `onComplete`, and `onError` callbacks.
        2.  On mount, starts an interval (`POLLING_INTERVAL`) to fetch book status from `/api/book-status?bookId=...`.
        3.  Updates `currentStatus` state based on polling response.
        4.  If status becomes `COMPLETED`, clears interval and calls `onComplete`.
        5.  If status becomes `FAILED` or poll count exceeds `MAX_POLLS`, clears interval and calls `onError`.
        6.  Displays a loading spinner and "Winking your story..." message.
    *   **Nuances & Patterns**: Client-side polling for long-running background task.

*   **Path & Type**: `src/components/create/review/NavigationControls.tsx` – React Client Component
    *   **Responsibility**: Renders previous/next navigation buttons and page count display for the review page.
    *   **Key Exports/Classes/Functions**: `NavigationControls` (default export).
    *   **Dependencies & Imports**: `Button`, `lucide-react` (ChevronLeft, ChevronRight).
    *   **Internal Flow**: Displays "Previous" and "Next" buttons (disabled based on `canGoPrevious`/`canGoNext` and `isProcessing` props) and "X of Y" page indicator.
    *   **Nuances & Patterns**: Simple presentational component for review page navigation.

*   **Path & Type**: `src/components/create/review/PageCard.tsx` – React Client Component
    *   **Responsibility**: Displays a single page's image and text for review and editing.
    *   **Key Exports/Classes/Functions**: `PageCard` (default export).
    *   **Dependencies & Imports**: `useState`, `useEffect`, `Image`, `Button`, `Textarea`, `Input`, `lucide-react` (Loader2, Pencil, Check, AlertTriangle), `toast`.
    *   **Internal Flow**:
        1.  Receives page data, confirmation status, saving state, and callbacks.
        2.  Displays page image (`generatedImageUrl` or `originalImageUrl`).
        3.  If `isTitlePage`, shows an `Input` for the title; otherwise, a `Textarea` for page text.
        4.  Allows toggling `isEditing` state.
        5.  In edit mode, shows "Save Changes" and "Cancel" buttons. `handleSaveText` calls `onTextChange` and exits edit mode.
        6.  In view mode, shows a "Confirm Text" button which calls `onConfirm`. Button text/style changes based on `isConfirmed` and `isSaving`.
        7.  Displays moderation status warnings if applicable.
    *   **Nuances & Patterns**: Handles both title page (input) and story page (textarea) editing. Manages local `editedText` state.

*   **Path & Type**: `src/components/create/review/PageTracker.tsx` – React Client Component
    *   **Responsibility**: Displays a progress tracker with dots for each page, indicating current page and confirmation status. Also includes the "Illustrate My Book" button.
    *   **Key Exports/Classes/Functions**: `PageTracker` (default export).
    *   **Dependencies & Imports**: `Button`, `lucide-react` (BookOpen, CheckCircle, SparklesIcon).
    *   **Internal Flow**:
        1.  Renders a series of dots, one for each page.
        2.  Highlights the `currentPage` dot and styles dots based on confirmation status.
        3.  Shows a tooltip with page number/title on hover.
        4.  The "Illustrate My Book" button is enabled only when `allPagesConfirmed` is true and not `isProcessing`. Calls `onIllustrate` when clicked.
    *   **Nuances & Patterns**: Visual progress indicator for the review step.

*   **Path & Type**: `src/components/landing-page/image-carousel.tsx` – React Client Component
    *   **Responsibility**: Displays a synchronized pair of "before" (original photo) and "after" (illustrated version) image carousels for the landing page.
    *   **Key Exports/Classes/Functions**: `ImageCarousel` (default export).
    *   **Dependencies & Imports**: `useState`, `useEffect`, `Image`, `cn`, `Loader2`.
    *   **Internal Flow**:
        1.  Receives `imagePairs` and an optional `interval`.
        2.  Uses `useEffect` to set up a timer that cycles `currentIndex`.
        3.  Renders two image panels side-by-side.
        4.  Each panel displays the image corresponding to `currentIndex` from `imagePairs`. Images transition with opacity.
        5.  Includes labels "Original Photo" and "Storywink Style!".
        6.  Optionally shows dot indicators for navigation.
        7.  Includes a `showMascot` prop to display "Winky the TREX" mascot over the illustrated image.
    *   **Nuances & Patterns**: Automatic image cycling with smooth transitions. The component in `src/app/page.tsx` uses a more complex setup with `CarouselSyncContext` to synchronize multiple instances of a similar carousel logic. This component is a simpler version used by the main landing page.

*   **Path & Type**: `src/components/landing-page/stats-counter.tsx` – React Client Component
    *   **Responsibility**: Displays a formatted number and accompanying text (e.g., "1,234 stories created").
    *   **Key Exports/Classes/Functions**: `StatsCounter` (default export).
    *   **Dependencies & Imports**: `cn`.
    *   **Internal Flow**: Formats the `count` prop with commas and renders it with the `text` prop.
    *   **Nuances & Patterns**: Simple presentational component.

*   **Path & Type**: `src/components/site-footer.tsx` – React Server Component
    *   **Responsibility**: Renders the site footer with copyright information and navigation links (Terms, Privacy).
    *   **Key Exports/Classes/Functions**: `SiteFooter`.
    *   **Dependencies & Imports**: `Link`.
    *   **Internal Flow**: Static content rendering.
    *   **Nuances & Patterns**: Standard site footer.

*   **Path & Type**: `src/components/site-header.tsx` – React Client Component
    *   **Responsibility**: Renders the site header, including logo, navigation links (desktop), authentication buttons (Sign In, Sign Up, UserButton, My Library), and a mobile menu.
    *   **Key Exports/Classes/Functions**: `SiteHeader`.
    *   **Dependencies & Imports**: `Link`, `cn`, `Button`, `@clerk/nextjs` (SignedIn, SignedOut, UserButton), `Image`, `MenuIcon`, `useState`.
    *   **Internal Flow**:
        1.  Uses Clerk's `SignedIn` and `SignedOut` components to conditionally render auth-related buttons.
        2.  Desktop: Shows logo, (commented out) nav links, and auth buttons.
        3.  Mobile: Shows logo, a menu icon (`MenuIcon`) that toggles `isMobileMenuOpen` state.
        4.  If `isMobileMenuOpen` is true, renders a dropdown menu with navigation and auth options.
    *   **Nuances & Patterns**: Responsive header with different layouts for desktop and mobile. Clerk integration for auth state.

*   **`src/components/ui/`**: This directory contains shadcn/ui components. These are generally wrappers around Radix UI primitives, styled with Tailwind CSS.
    *   `alert-dialog.tsx`, `aspect-ratio.tsx`, `badge.tsx`, `button.tsx`, `card.tsx`, `dialog.tsx`, `drawer.tsx`, `dropdown-menu.tsx`, `input.tsx`, `label.tsx`, `progress.tsx`, `radio-group.tsx`, `select.tsx`, `sheet.tsx`, `skeleton.tsx`, `sonner.tsx` (for toasts), `switch.tsx`, `tabs.tsx`, `textarea.tsx`, `tooltip.tsx`: Standard UI building blocks.
    *   `rough-border.tsx`, `rough-button.tsx`, `rough-input-wrapper.tsx`, `rough-underline.tsx`: Custom components that use `roughjs` to create a hand-drawn, sketchy visual style. They typically wrap standard elements or draw SVG shapes.
        *   `RoughButton`: Wraps a standard `Button` and overlays a `roughjs` SVG rectangle for the border/fill. Manages hover/active/selected states to change rough options.
        *   `RoughBorder`: A generic component to draw a `roughjs` rectangle border around its children or an area of specified dimensions.
        *   `RoughInputWrapper`: Wraps an input/textarea and provides a `RoughBorder` around it, changing style on focus.
        *   `RoughUnderline`: Draws a `roughjs` line, typically used for underlining text.

### `src/context/`

*   **Path & Type**: `src/context/BookCreationContext.tsx` – React Context Provider & Hook
    *   **Responsibility**: Provides a shared state (`BookData`) for the multi-step book creation process. This state includes `bookId`, uploaded `assets`, `pages` (simplified), and `settings` (title, child name, art style, etc.).
    *   **Key Exports/Classes/Functions**: `BookCreationProvider`, `useBookCreation`, `BookData` (interface).
    *   **Dependencies & Imports**: `useState`, `createContext`, `useContext`, `ReactNode`, `@prisma/client` (BookStatus type).
    *   **Internal Flow**: Uses `useState` to hold `bookData`. `BookCreationProvider` makes this state and its setter available to consuming components via `useBookCreation` hook.
    *   **Nuances & Patterns**: Centralized state for the creation flow. However, as noted in `cleanup.md`, its role might be reduced as editor/review pages now primarily fetch data via `bookId` from URL.

### `src/generated/prisma/client/`

This directory contains the Prisma Client generated from `prisma/schema.prisma`.
*   **`index.js` / `index.d.ts`**: Main entry point for the Prisma Client in Node.js environments. Exports `PrismaClient` class, enums, types, and utility functions like `Prisma.sql`.
*   **`edge.js` / `edge.d.ts`**: Prisma Client tailored for edge runtimes (e.g., Vercel Edge Functions, Cloudflare Workers).
*   **`wasm.js` / `wasm.d.ts`**: Prisma Client using the Wasm query engine, typically for environments that support WASM but not Node-API.
*   **`index-browser.js` / `index-browser.d.ts`**: A stub/minimal version of Prisma Client for browser environments. It typically throws errors if database operations are attempted, as direct DB access from the browser is unsafe. Exports `Decimal`, enums, and some public types.
*   **`react-native.js` / `react-native.d.ts`**: Prisma Client specifically for React Native environments.
*   **`library.js` / `library.d.ts`**: The core runtime logic for the Prisma Client when using the Node-API library query engine. This is a complex, often minified file containing the query building, serialization, error handling, and engine interaction logic.
*   **`runtime/` subdirectory**: Contains various internal modules used by the Prisma Client runtime variants (e.g., `edge.js`, `library.js`). These handle DMMF processing, error formatting, query serialization, decimal handling, etc.
    *   `library.js` (within runtime): This is the actual core runtime logic for the Node-API library engine. It's a large, bundled file containing many internal Prisma utilities.
    *   `edge.js`, `edge-esm.js`, `wasm.js`, `react-native.js` (within runtime): These are the core runtime logic files for their respective environments.
    *   `index-browser.js` (within runtime): Core logic for the browser stub.
*   **`package.json`**: Defines the entry points and exports for different environments for the Prisma Client package.
*   **`schema.prisma`**: A copy of the main Prisma schema file, used by the generated client.

### `src/hooks/`

*   **Path & Type**: `src/hooks/index.ts` – Index File
    *   **Responsibility**: Intended to export custom hooks from this directory. Currently exports nothing.
    *   **Key Exports/Classes/Functions**: None.

*   **Path & Type**: `src/hooks/useMediaQuery.ts` – Custom React Hook
    *   **Responsibility**: Provides a boolean state indicating whether a given CSS media query matches, updating when the match status changes.
    *   **Key Exports/Classes/Functions**: `useMediaQuery` (default export).
    *   **Dependencies & Imports**: `useEffect`, `useState` from React.
    *   **Internal Flow**:
        1.  Initializes `matches` state by checking `window.matchMedia(query).matches` (client-side only).
        2.  Uses `useEffect` to add/remove an event listener for the media query's 'change' event.
        3.  Updates `matches` state when the media query match status changes.
    *   **Nuances & Patterns**: Client-side only hook. Useful for responsive component rendering logic.

### `src/lib/`

*   **Path & Type**: `src/lib/ai/styleLibrary.ts` – TypeScript Module (ESM, but also has a CJS wrapper)
    *   **Responsibility**: Defines the available art styles (`STYLE_LIBRARY`) with their labels and reference image URLs. Provides a function `createIllustrationPrompt` to generate prompts for the AI illustration service based on selected style, page text, and other options.
    *   **Key Exports/Classes/Functions**: `STYLE_LIBRARY`, `TypedStyleLibrary`, `createIllustrationPrompt`, `StyleKey` (type), `IllustrationPromptOptions` (interface), `StyleDefinition` (interface).
    *   **Dependencies & Imports**: `logger`.
    *   **Internal Flow (`createIllustrationPrompt`)**:
        1.  Constructs a detailed text prompt for the OpenAI Images API (edit endpoint).
        2.  Incorporates base instructions about using two input images (content source, style source).
        3.  Adds "Winkify" specific instructions if `isWinkifyEnabled` and `illustrationNotes` are provided.
        4.  Adds page-specific instructions for title pages (integrating book title) or story pages (rendering page text).
        5.  Truncates the prompt if it exceeds `MAX_PROMPT_CHARS`.
    *   **Nuances & Patterns**: Central place for art style definitions. Prompt engineering for image generation. The `.cjs` version is for worker compatibility.

*   **Path & Type**: `src/lib/ai/styleLibrary.cjs` – CommonJS Module
    *   **Responsibility**: Acts as a CommonJS wrapper to dynamically import the ESM `styleLibrary.ts` module, making its exports available to CJS environments (like BullMQ workers run with `ts-node` configured for CommonJS).
    *   **Key Exports/Classes/Functions**: Exports a promise that resolves to the exports of `styleLibrary.ts`.
    *   **Dependencies & Imports**: Dynamically imports `@/lib/ai/styleLibrary`.
    *   **Internal Flow**: Uses `async function loadStyleLibrary()` with `import()` to load the ESM module.
    *   **Nuances & Patterns**: Bridge between ESM and CJS module systems for worker compatibility.

*   **Path & Type**: `src/lib/cloudinary.ts` – TypeScript Module
    *   **Responsibility**: Configures and exports the Cloudinary v2 SDK instance. Provides a helper function `getSignedImageUrl`.
    *   **Key Exports/Classes/Functions**: `cloudinary` (default export), `getSignedImageUrl`.
    *   **Dependencies & Imports**: `v2 as cloudinary` from 'cloudinary', `logger`.
    *   **Internal Flow**:
        1.  Reads Cloudinary credentials from environment variables.
        2.  Configures the global `cloudinary` instance.
        3.  `getSignedImageUrl` uses `cloudinary.url` with `sign_url: true` to generate signed URLs (not currently used heavily, but available).
    *   **Nuances & Patterns**: Centralized Cloudinary configuration. Logs errors if config is missing.

*   **Path & Type**: `src/lib/db.ts` – TypeScript Module
    *   **Responsibility**: Instantiates and exports the Prisma Client, ensuring only one instance is created in development (singleton pattern for Next.js hot-reloading).
    *   **Key Exports/Classes/Functions**: `db` (PrismaClient instance).
    *   **Dependencies & Imports**: `@prisma/client` (PrismaClient).
    *   **Internal Flow**: Checks if `globalThis.__prisma` exists. If not, creates a new `PrismaClient` and stores it on `globalThis.__prisma` (in non-production). Exports this instance.
    *   **Nuances & Patterns**: Standard way to manage Prisma Client instances in Next.js to prevent too many connections during development. This is likely the primary Prisma client instance used.

*   **Path & Type**: `src/lib/db/ensureUser.ts` – TypeScript Module
    *   **Responsibility**: Ensures a user record exists in the local database, synchronizing it with data from Clerk.
    *   **Key Exports/Classes/Functions**: `ensureUser` (async function).
    *   **Dependencies & Imports**: `@prisma/client` (PrismaClient).
    *   **Internal Flow**:
        1.  Takes Clerk user details (`id` (Clerk ID), `email`, `name`, `imageUrl`) as input.
        2.  Performs a Prisma `upsert` operation on the `User` table:
            *   `where`: Uses `clerkId`.
            *   `update`: Updates `email`, `name`, `imageUrl` if the user exists.
            *   `create`: Creates a new user with all provided details if the user doesn't exist.
    *   **Nuances & Patterns**: Idempotent operation crucial for syncing Clerk users with the local DB. Uses `clerkId` as the unique foreign key.

*   **Path & Type**: `src/lib/imageUpload.ts` – TypeScript Module
    *   **Responsibility**: Provides a reusable function `uploadImage` to upload image files (or data URLs) to Cloudinary.
    *   **Key Exports/Classes/Functions**: `uploadImage` (async function), `UploadOptions` (interface), `UploadResult` (interface).
    *   **Dependencies & Imports**: `cloudinary` (from `./cloudinary`), `logger`.
    *   **Internal Flow (`uploadImage`)**:
        1.  Takes a file (string data URI or Buffer) and Cloudinary upload options.
        2.  Calls `cloudinary.uploader.upload` with `resource_type: 'image'` and provided options.
        3.  Logs success or error.
        4.  Returns the Cloudinary upload result.
    *   **Nuances & Patterns**: Abstraction over direct Cloudinary SDK calls for image uploads.

*   **Path & Type**: `src/lib/logger.client.ts` – TypeScript Module
    *   **Responsibility**: Provides a minimal logger implementation (shim) for client-side code, using `console.debug`, `console.info`, etc.
    *   **Key Exports/Classes/Functions**: `logger` (default export), `Logger` (type).
    *   **Dependencies & Imports**: None.
    *   **Internal Flow**: Exports an object with logging methods that map to `console` methods.
    *   **Nuances & Patterns**: Ensures client-side code can call logger methods without errors, even if a more complex server-side logger isn't available.

*   **Path & Type**: `src/lib/logger.server.ts` – TypeScript Module
    *   **Responsibility**: Provides a server-side logger instance using `pino`. Configures different logging behavior for development (pretty-printed, synchronous) and production (JSON).
    *   **Key Exports/Classes/Functions**: `logger` (default export), `Logger` (type).
    *   **Dependencies & Imports**: `pino`.
    *   **Internal Flow**:
        1.  Checks `process.env.NODE_ENV` to determine if in development.
        2.  Reads `LOG_LEVEL` from environment (defaults to 'info').
        3.  Initializes `pino` with pretty-printing and synchronous destination for dev, and standard JSON output for prod.
    *   **Nuances & Patterns**: Environment-aware logging configuration.

*   **Path & Type**: `src/lib/logger.ts` – TypeScript Module
    *   **Responsibility**: Acts as a universal logger entry point, dynamically requiring either `logger.server.ts` or `logger.client.ts` based on the execution environment (Node.js vs. browser).
    *   **Key Exports/Classes/Functions**: `logger` (default export), `Logger` (re-exported type).
    *   **Dependencies & Imports**: Dynamically requires `./logger.server` or `./logger.client`.
    *   **Internal Flow**: Checks `typeof window`. If `undefined` (Node.js/server), requires server logger; otherwise, requires client logger.
    *   **Nuances & Patterns**: Allows isomorphic usage of the logger. Leverages `require` for conditional loading to enable tree-shaking.

*   **Path & Type**: `src/lib/openai/index.ts` – TypeScript Module
    *   **Responsibility**: Initializes and exports the OpenAI SDK client.
    *   **Key Exports/Classes/Functions**: `openai` (default export - OpenAI client instance).
    *   **Dependencies & Imports**: `openai` (OpenAI SDK).
    *   **Internal Flow**: Reads `OPENAI_API_KEY` from environment variables and instantiates `OpenAI`. Throws an error if the API key is missing.
    *   **Nuances & Patterns**: Centralized OpenAI client configuration.

*   **Path & Type**: `src/lib/openai/prompts.ts` – TypeScript Module
    *   **Responsibility**: Defines system prompts and functions to create dynamic prompts for OpenAI API calls, specifically for story generation.
    *   **Key Exports/Classes/Functions**: `systemPrompt` (const string), `createVisionStoryGenerationPrompt` (function), `StoryGenerationInput` (interface), `MessageContentPart` (type).
    *   **Dependencies & Imports**: `Asset` (type from `@prisma/client`).
    *   **Internal Flow (`createVisionStoryGenerationPrompt`)**:
        1.  Takes `StoryGenerationInput` (child name, book title, page data, Winkify status, etc.).
        2.  Constructs an array of `MessageContentPart` objects for the OpenAI Chat Completions API (vision model).
        3.  Includes a configuration section with user inputs.
        4.  Includes a "Storyboard Sequence" section, iterating through `storyPages` and adding text and `image_url` parts for each page.
        5.  Appends detailed instructions covering narrative style, tone, sentence structure, use of user details, and output format (JSON).
        6.  Conditionally adds "Winkify" instructions if `isWinkifyEnabled` is true, asking for `illustrationNotes`.
        7.  Specifies JSON output format.
    *   **Nuances & Patterns**: Detailed prompt engineering for vision-capable LLMs. Handles conditional logic for "Winkify" feature within the prompt. Prepares input for multi-modal LLM calls.

*   **Path & Type**: `src/lib/package.json` – JSON File
    *   **Responsibility**: Specifies `"type": "commonjs"` for the `src/lib` directory. This is likely to ensure that modules within `src/lib` (like `styleLibrary.ts` when compiled) are treated as CommonJS by workers if they are imported directly by CJS worker files.
    *   **Key Exports/Classes/Functions**: N/A (Configuration)
    *   **Dependencies & Imports**: N/A
    *   **Internal Flow**: N/A
    *   **Nuances & Patterns**: Used to control module system behavior for a specific directory, often for compatibility with older tooling or specific parts of a hybrid ESM/CJS project.

*   **Path & Type**: `src/lib/pdf/generateBookPdf.ts` – TypeScript Module
    *   **Responsibility**: Generates a PDF buffer for a given book using Puppeteer.
    *   **Key Exports/Classes/Functions**: `generateBookPdf` (async function).
    *   **Dependencies & Imports**: `puppeteer`, `@prisma/client` (Book, Page types), `logger`.
    *   **Internal Flow**:
        1.  Takes `BookWithPages` data as input.
        2.  `generatePageHtml`: Helper function to create HTML for a single book page (image and placeholder text styling).
        3.  Constructs full HTML for the book by concatenating HTML for all pages. Includes basic CSS for page size and margins.
        4.  Launches a headless Puppeteer browser.
        5.  Creates a new page, sets its content to the generated HTML, and waits for network idle.
        6.  Calls `page.pdf()` with specified dimensions (derived from `PAGE_WIDTH_PX`, `PAGE_HEIGHT_PX`) and options.
        7.  Converts the resulting `Uint8Array` to a Node.js `Buffer`.
        8.  Closes the browser.
        9.  Returns the PDF buffer.
    *   **Nuances & Patterns**: Uses headless browser automation for PDF generation. Page styling is currently basic and inline. Defines page dimensions based on DPI.

*   **Path & Type**: `src/lib/prisma.ts` – TypeScript Module
    *   **Responsibility**: Instantiates and exports the Prisma Client (similar to `db.ts`).
    *   **Key Exports/Classes/Functions**: `prisma` (PrismaClient instance).
    *   **Dependencies & Imports**: `@prisma/client` (PrismaClient).
    *   **Internal Flow**: Similar to `db.ts`, uses `global.prisma` for singleton pattern in development.
    *   **Nuances & Patterns**: This file is **redundant** if `src/lib/db.ts` is the primary Prisma client instance. `cleanup.md` suggests consolidating to `db.ts`.

*   **Path & Type**: `src/lib/queue/index.ts` – TypeScript Module
    *   **Responsibility**: Configures and exports BullMQ queues and a FlowProducer for managing background jobs.
    *   **Key Exports/Classes/Functions**: `QueueName` (enum), `getQueue` (function), `flowProducer` (FlowProducer instance), `workerConnectionOptions` (const).
    *   **Dependencies & Imports**: `bullmq` (Queue, QueueOptions, WorkerOptions, FlowProducer), `ioredis`.
    *   **Internal Flow**:
        1.  Reads `REDIS_URL` from environment variables.
        2.  Defines `connectionOptions` for Redis.
        3.  Creates and exports a `flowProducer` instance.
        4.  Defines `QueueName` enum for different job types.
        5.  `getQueue` function acts as a factory/singleton manager for `Queue` instances, creating them on demand and storing them in a `Map`.
    *   **Nuances & Patterns**: Centralized queue management. Uses IORedis for Redis connection. `FlowProducer` is used for creating complex job flows (parent/child jobs).

*   **Path & Type**: `src/lib/utils.ts` – TypeScript Utility Module
    *   **Responsibility**: Provides general utility functions.
    *   **Key Exports/Classes/Functions**: `cn` (for conditional class names), `formatDate`, `delay`.
    *   **Dependencies & Imports**: `clsx`, `tailwind-merge`.
    *   **Internal Flow**:
        *   `cn`: Merges class names using `clsx` and resolves Tailwind CSS conflicts using `tailwind-merge`.
        *   `formatDate`: Formats a date using `Intl.DateTimeFormat`.
        *   `delay`: Returns a promise that resolves after a specified number of milliseconds.
    *   **Nuances & Patterns**: Common utility functions. `cn` is standard for shadcn/ui projects.

### `src/queues/workers/`

*   **Path & Type**: `src/queues/workers/package.json` – JSON File
    *   **Responsibility**: Specifies `"type": "commonjs"` for the `src/queues/workers` directory. This ensures worker files are treated as CommonJS modules.
    *   **Key Exports/Classes/Functions**: N/A (Configuration)
    *   **Dependencies & Imports**: N/A
    *   **Internal Flow**: N/A
    *   **Nuances & Patterns**: Important for ensuring workers, often run in separate Node.js processes (e.g., via `ts-node` or compiled JS), correctly handle module resolution, especially if the main project uses ESM.

*   **Path & Type**: `src/queues/workers/book-finalize.worker.ts` – BullMQ Worker (TypeScript)
    *   **Responsibility**: Processes jobs from the `BookFinalize` queue. This worker runs after all illustration generation jobs for a book are complete (or have failed). It determines the final status of the book.
    *   **Key Exports/Classes/Functions**: None (executable worker script).
    *   **Dependencies & Imports**: `dotenv`, `path`, `bullmq` (Worker, Job), `prisma` (from `@/lib/db`), `QueueName`, `workerConnectionOptions`, `BookStatus`, `logger`.
    *   **Internal Flow (`processFinalizeBookJob`)**:
        1.  Receives `bookId` and `userId` from job data.
        2.  Fetches all pages for the book, selecting `generatedImageUrl` and `moderationStatus`.
        3.  Determines the final `BookStatus`:
            *   `COMPLETED`: If all pages have `moderationStatus: "OK"` and a `generatedImageUrl`.
            *   `PARTIAL`: If some pages are OK with images, or some are `FLAGGED`.
            *   `FAILED`: If no pages succeeded or were flagged (e.g., all failed implicitly).
        4.  Updates the `Book` record in the database with the determined `finalBookStatus`.
    *   **Nuances & Patterns**: Acts as the parent job in an illustration flow. Aggregates results from child (per-page illustration) jobs.

*   **Path & Type**: `src/queues/workers/illustration-generation.worker.ts` – BullMQ Worker (TypeScript)
    *   **Responsibility**: Processes jobs from the `IllustrationGeneration` queue. Generates an illustration for a single book page using AI.
    *   **Key Exports/Classes/Functions**: None (executable worker script).
    *   **Dependencies & Imports**: `dotenv`, `path`, `bullmq`, `prisma`, `QueueName`, `workerConnectionOptions`, `BookStatus`, `OpenAI`, `toFile`, `FileLike`, `cloudinary`, `logger`, `styleLibrary.cjs` (dynamically required), `StyleKey` (type from `styleLibrary.ts`).
    *   **Internal Flow (`processIllustrationGenerationJob`)**:
        1.  Receives detailed job data: `userId`, `bookId`, `pageId`, `pageNumber`, `text`, `artStyle`, `bookTitle`, `isTitlePage`, `illustrationNotes`, `originalImageUrl`, `isWinkifyEnabled`.
        2.  Fetches the original content image (`originalImageUrl`) and the style reference image (from `STYLE_LIBRARY` based on `artStyle`).
        3.  Constructs a prompt for OpenAI Images API (edit endpoint) using `createIllustrationPrompt` from `styleLibrary.cjs`. This prompt instructs the AI to apply the style of the reference image to the content of the original image.
        4.  Prepares image files (`FileLike`) for the API call.
        5.  Calls OpenAI Images Edit API (`openai.images.edit`) with the two images and the text prompt.
        6.  Handles the API response:
            *   Extracts `b64_json` image data.
            *   Sets `moderationBlocked` and `moderationReasonText` if generation fails or content is flagged.
        7.  If an image is successfully generated and not blocked, uploads it to Cloudinary.
        8.  Updates the `Page` record in the database with `generatedImageUrl`, `moderationStatus`, and `moderationReason`.
    *   **Nuances & Patterns**: Complex job involving multiple external API calls (fetching images, OpenAI, Cloudinary). Uses a dynamically imported CJS module (`styleLibrary.cjs`) for prompt generation. Handles potential errors at each step.

*   **Path & Type**: `src/queues/workers/story-generation.worker.ts` – BullMQ Worker (TypeScript)
    *   **Responsibility**: Processes jobs from the `StoryGeneration` queue. Generates story text for all pages of a book using AI.
    *   **Key Exports/Classes/Functions**: None (executable worker script).
    *   **Dependencies & Imports**: `dotenv`, `path`, `bullmq`, `prisma`, `QueueName`, `workerConnectionOptions`, `StoryGenerationJobData` (type), `createVisionStoryGenerationPrompt`, `systemPrompt`, `StoryGenerationInput` (from `openai/prompts`), `openai`, `BookStatus`, `Prisma` (type), `logger`, `zod`.
    *   **Internal Flow (`processStoryGenerationJob`)**:
        1.  Receives `bookId`, `userId`, `promptContext`, `storyPages`, `isWinkifyEnabled` from job data.
        2.  Updates book status to `GENERATING`.
        3.  Constructs a multi-modal prompt for OpenAI (GPT-4o Vision) using `createVisionStoryGenerationPrompt`. This prompt includes user inputs and image URLs for all story pages.
        4.  Calls OpenAI Chat Completions API once to generate text (and `illustrationNotes` if Winkify is enabled) for all pages in a single JSON response.
        5.  Parses and validates the JSON response using Zod schemas (`openAIResponseSchema` or `winkifiedResponseSchema`).
        6.  Iterates through the `storyPages` from the job data and updates each corresponding `Page` record in the database with the generated `text` (and `illustrationNotes`).
        7.  Updates the book's final status to `COMPLETED` and stores token usage (`promptTokens`, `completionTokens`, `totalTokens`).
    *   **Nuances & Patterns**: Makes a single, comprehensive API call to OpenAI for all pages. Parses a structured JSON response. Handles conditional logic for "Winkify" feature.

### `src/styles/`

*   **Path & Type**: `src/styles/globals.css` – CSS File
    *   **Responsibility**: Intended for global styles.
    *   **Key Exports/Classes/Functions**: N/A (CSS)
    *   **Dependencies & Imports**: None shown.
    *   **Internal Flow**: N/A (Declarative styles)
    *   **Nuances & Patterns**: This file is likely **redundant** as `src/app/globals.css` is the standard location for global styles in the App Router. `cleanup.md` suggests consolidating.

### `src/types/`

*   **Path & Type**: `src/types/index.ts` – TypeScript Type Definition File
    *   **Responsibility**: Defines custom TypeScript types and interfaces used across the application.
    *   **Key Exports/Classes/Functions**: Interfaces: `User`, `Book`, `Page`, `Asset`, `ApiResponse`. Types: `BookStatus` (custom), `PageType` (custom), `StoryboardPage`, `BookWithStoryboardPages`.
    *   **Dependencies & Imports**: None explicitly shown, but implicitly relies on understanding of Prisma model structures.
    *   **Internal Flow**: N/A (Type definitions)
    *   **Nuances & Patterns**:
        *   Defines `User`, `Book`, `Page`, `Asset`, `BookStatus`, `PageType` which are **redundant** as these are generated by Prisma and should be imported from `@prisma/client` and `@prisma/client/$Enums`.
        *   `StoryboardPage` (combining `Page` and `Asset` subset) and `BookWithStoryboardPages` (combining `Book` with `StoryboardPage[]`) are useful custom aggregate types.
        *   `ApiResponse` is a generic type for API responses.

### Root `src/` files

*   **Path & Type**: `src/middleware.ts` – Next.js Middleware
    *   **Responsibility**: Implements authentication protection for routes using Clerk middleware.
    *   **Key Exports/Classes/Functions**: `default` (clerkMiddleware), `config` (matcher).
    *   **Dependencies & Imports**: `@clerk/nextjs/server` (clerkMiddleware).
    *   **Internal Flow**: Uses `clerkMiddleware()` to protect all matched routes by default. The matcher `['/((?!.+\\.[\\w]+$|_next).*)', '/', '/(api|trpc)(.*)']` is a common Next.js pattern to apply middleware to most application routes and API routes while excluding static files and `_next` internal routes.
    *   **Nuances & Patterns**: Centralized route protection. The previous version had `createRouteMatcher` for more granular control, but the current version uses a simpler, broader protection.

### Root Project Files

*   **`.gitignore`**: Specifies intentionally untracked files by Git (e.g., `node_modules`, `.env*`, build outputs, logs).
*   **`components.json`**: Configuration file for `shadcn/ui`, defining aliases for components, utils, lib, hooks, and the icon library (lucide).
*   **`docker-compose.yml`**: Defines services for local development: `db` (PostgreSQL) and `redis` (for BullMQ), along with their volumes and network.
*   **`eslint.config.mjs`**: ESLint flat configuration file. Ignores `src/generated/`. Extends `next/core-web-vitals` and `eslint-config-prettier`. Uses `typescript-eslint` parser and plugin. Configures `eslint-plugin-import` with TypeScript resolver. Includes custom rules.
*   **`next.config.mjs`**: Next.js configuration. Primarily configures `images.remotePatterns` to allow images from `via.placeholder.com` and `res.cloudinary.com`.
*   **`next.config.ts`**: TypeScript version of Next.js configuration. This is likely **redundant** if `next.config.mjs` is being used.
*   **`package.json`**: Defines project metadata, dependencies, and scripts.
    *   Key dependencies: `@clerk/nextjs`, `@prisma/client`, `bullmq`, `cloudinary`, `next`, `openai`, `puppeteer`, `react`, `tailwindcss`, `zod`, `roughjs`, `react-pageflip`, `@dnd-kit/*`.
    *   Key scripts: `dev`, `build`, `build:worker`, `start`, `lint`, `format`, Prisma commands (`prisma:*`), worker dev scripts (`worker:dev:*`), `dev:all` (concurrently runs Next.js and workers).
*   **`postcss.config.mjs`**: PostCSS configuration, uses `@tailwindcss/postcss`.
*   **`README.md`**: Main project README providing an overview, feature list, setup instructions, project structure, and tech stack.
*   **`tsconfig.json`**: Main TypeScript configuration for the Next.js application. Uses `ESNext` module system, targets `ES2017`. Includes path aliases (`@/*`).
*   **`tsconfig.worker.json`**: Separate TypeScript configuration for compiling BullMQ workers. Outputs to `dist-worker`, uses `CommonJS` module system, targets `ES2018`. Includes path aliases.

### `workers/`

*   **Path & Type**: `workers/finalize-check/Dockerfile`, `workers/illustration/Dockerfile`, `workers/story/Dockerfile` – Dockerfiles
    *   **Responsibility**: Define the Docker images for deploying the BullMQ workers (`book-finalize.worker.ts`, `illustration-generation.worker.ts`, `story-generation.worker.ts` respectively).
    *   **Key Exports/Classes/Functions**: N/A (Build instructions)
    *   **Dependencies & Imports**: Based on `node:20-alpine`.
    *   **Internal Flow**: Multi-stage Docker build:
        1.  **Build Stage**: Copies `package.json`, installs production dependencies, generates Prisma client, copies application code, compiles worker TypeScript using `npm run build:worker` (which uses `tsconfig.worker.json` and `tsc-alias`), and copies a `package.json` (likely `{"type": "commonjs"}`) to the worker output directory.
        2.  **Run Stage**: Starts from a clean Node.js Alpine image, copies necessary artifacts (dependencies, compiled worker code, Prisma schema) from the build stage, and sets the `CMD` to run the specific worker script (e.g., `node dist-worker/queues/workers/illustration-generation.worker.js`).
    *   **Nuances & Patterns**: Optimized for smaller image sizes by using multi-stage builds and Alpine Linux. Ensures workers have their specific dependencies and compiled code.

## 3. Inter-File Interactions

*   **Frontend (Pages/Components) -> API Routes:**
    *   `src/app/create/page.tsx` -> `POST /api/upload` (for initial photos) -> `POST /api/book/create`
    *   `src/app/create/[bookId]/edit/page.tsx`:
        *   `GET /api/book/[bookId]` (fetch data)
        *   `PATCH /api/book/[bookId]` (save cover, art style)
        *   `POST /api/book/[bookId]/reorder` (save page order)
        *   `POST /api/upload` (add more photos, includes `bookId`)
        *   `POST /api/generate/story` (trigger story generation)
        *   Polls `GET /api/book-status` (during story generation)
    *   `src/app/create/review/page.tsx`:
        *   `GET /api/book/[bookId]` or `GET /api/book-content` (fetch data)
        *   `PATCH /api/book/[bookId]/page/[pageId]` (save page text)
        *   `PATCH /api/book/[bookId]` (save title page text)
        *   `POST /api/generate/illustrations` (trigger illustration generation)
        *   Polls `GET /api/book-status` (during text and illustration generation)
    *   `src/app/book/[bookId]/preview/page.tsx`:
        *   `GET /api/book/[bookId]` (fetch data)
        *   Polls `GET /api/book-status` (if illustrating)
        *   `GET /api/book/[bookId]/export/pdf` (trigger PDF download)
    *   `src/app/library/page.tsx` (Server) -> `src/app/library/actions.ts` (`getUserBooks`)
    *   `src/app/library/library-client-view.tsx` -> `src/app/library/actions.ts` (`deleteBook`, `duplicateBook`)

*   **API Routes -> Services/Lib:**
    *   `/api/upload` -> `src/lib/imageUpload.ts` (Cloudinary) -> `src/lib/db.ts` (Prisma for Asset/Page)
    *   `/api/book/*` routes -> `src/lib/db.ts` (Prisma for Book/Page CRUD)
    *   `/api/generate/*` routes -> `src/lib/queue/index.ts` (add jobs to BullMQ)
    *   `/api/book/[bookId]/export/pdf` -> `src/lib/pdf/generateBookPdf.ts` (Puppeteer)
    *   All API routes using DB -> `src/lib/db/ensureUser.ts` (if user interaction)

*   **BullMQ Workers -> Services/Lib:**
    *   `story-generation.worker.ts` -> `src/lib/openai/index.ts`, `src/lib/openai/prompts.ts`, `src/lib/db.ts`
    *   `illustration-generation.worker.ts` -> `src/lib/ai/styleLibrary.cjs`, `src/lib/openai/index.ts`, `src/lib/cloudinary.ts`, `src/lib/db.ts`
    *   `book-finalize.worker.ts` -> `src/lib/db.ts`

*   **Critical Handoffs:**
    *   **Photo Upload to Editor**: `create/page.tsx` uploads assets -> `/api/upload` creates `Asset` records -> `/api/book/create` creates `Book` and `Page` records -> `router.push` to `create/[bookId]/edit`.
    *   **Editor to Story Generation**: `edit/page.tsx` triggers `POST /api/generate/story` -> API enqueues job -> `story-generation.worker.ts` processes -> updates DB. Frontend polls `/api/book-status`.
    *   **Review to Illustration Generation**: `review/page.tsx` triggers `POST /api/generate/illustrations` -> API enqueues flow (parent `BookFinalize`, children `IllustrationGeneration`) -> workers process -> update DB. Frontend polls `/api/book-status`.
    *   **Clerk to Local DB**: Clerk webhook -> `POST /api/webhooks/clerk` -> `ensureUser.ts` -> `src/lib/db.ts`.

## 4. Cross-Cutting Concerns

*   **Authentication**:
    *   Handled by Clerk (`@clerk/nextjs`).
    *   `src/middleware.ts` protects routes using `clerkMiddleware`.
    *   `src/app/layout.tsx` wraps the app in `<ClerkProvider>`.
    *   Sign-in/sign-up pages (`src/app/sign-in`, `src/app/sign-up`) use Clerk's UI components.
    *   User data (ID, email, name, image) is synced from Clerk to the local `User` table via:
        *   Webhooks: `src/app/api/webhooks/clerk/route.ts` handles `user.created`, `user.updated`, `user.deleted` events.
        *   On-demand: `src/lib/db/ensureUser.ts` is called in API routes like `/api/upload` to ensure the user exists locally before performing actions.
    *   `clerkId` in the `User` table links local users to Clerk users.
    *   Frontend uses `useAuth()` and `useUser()` hooks. Backend uses `auth()` and `currentUser()` from `@clerk/nextjs/server`.

*   **State Management**:
    *   **Global/Shared**: `src/context/BookCreationContext.tsx` is used for the book creation flow, but its role might be diminishing as pages increasingly rely on URL params (`bookId`) and direct API calls for data.
    *   **Local Component State**: React's `useState` and `useEffect` are heavily used within page components (e.g., `edit/page.tsx`, `review/page.tsx`, `preview/page.tsx`) to manage UI state, form data, loading/error states, and fetched data.
    *   **URL State**: `bookId` is passed via URL parameters, driving data fetching in editor/review/preview pages.
    *   **Server State (DB)**: Prisma and the PostgreSQL database are the ultimate source of truth for persistent data. Server Actions (`src/app/library/actions.ts`) and API routes modify this state.

*   **Routing & Navigation**:
    *   Next.js App Router is used.
    *   Dynamic routes: `/[bookId]/edit`, `/[bookId]/preview`, `/api/book/[bookId]`, `/api/book/[bookId]/page/[pageId]`.
    *   Client-side navigation: `useRouter()` from `next/navigation` and `<Link>` component.
    *   Route protection: Via `src/middleware.ts` (Clerk).

*   **Error Handling**:
    *   **API Routes**: Use `try/catch` blocks. Return JSON error responses with appropriate HTTP status codes (400, 401, 403, 404, 500). Zod is used for input validation, and Zod errors are returned in responses. `logger` is used for server-side error logging.
    *   **Frontend**: `try/catch` in async functions. `useState` for error messages. `sonner` (toasts) for user-facing feedback. `WritingProgressScreen` handles errors from generation polling.
    *   **Workers**: `try/catch` within job processing functions. Update `Book.status` to `FAILED` on critical errors. BullMQ handles retries. `logger` is used.
    *   **Prisma Errors**: Prisma Client can throw specific error types (e.g., `PrismaClientKnownRequestError`). These are caught and handled or re-thrown.

*   **Performance**:
    *   **Image Optimization**: Cloudinary is used, which offers transformations. `Asset.thumbnailUrl` suggests thumbnails are generated and used. `next/image` with `fill` and `priority` props is used.
    *   **Background Jobs**: Long-running AI tasks (story/illustration generation) are offloaded to BullMQ workers, preventing blocking of API responses.
    *   **Polling**: Used for status updates, which is generally less efficient than WebSockets/SSE but simpler to implement.
    *   **Lazy Loading**: Not explicitly detailed for components, but Next.js handles code splitting by route.
    *   **Memoization**: `useMemo` and `useCallback` are used in some complex client components (e.g., `edit/page.tsx`, `Canvas.tsx`) to optimize re-renders.
    *   **Database Queries**: Prisma queries in API routes and server actions are generally specific, selecting necessary fields.

## 5. User & Data Flows

### 5.1. New User Sign-Up & First Book Creation

1.  **User signs up** via `/sign-up` (Clerk UI).
    *   Clerk creates a user.
    *   Clerk webhook `user.created` triggers `POST /api/webhooks/clerk`.
    *   `ensureUser.ts` creates a corresponding record in the local `User` table.
2.  **User navigates to `/create`**.
    *   `src/app/create/page.tsx` is rendered.
3.  **User uploads photos**:
    *   Clicks "Start Creating", `PhotoSourceSheet` opens.
    *   Selects photos from device. `FileUploader` (via `fileInputRef`) handles selection.
    *   `handleFileInputChange` in `create/page.tsx`:
        *   Shows `UploadProgressScreen`.
        *   POSTs files to `/api/upload/route.ts`.
    *   `/api/upload/route.ts`:
        *   Calls `ensureUser` (on-demand sync).
        *   Uploads each image to Cloudinary via `src/lib/imageUpload.ts`.
        *   Creates an `Asset` record in DB for each image (stores Cloudinary URL, public ID, thumbnail URL).
        *   Returns array of `{ id, thumbnailUrl }` for created assets.
4.  **Book Draft Creation**:
    *   `handleUploadComplete` in `create/page.tsx` receives asset data.
    *   Calls `handleCreateBook` which `POST`s asset IDs to `/api/book/create/route.ts`.
    *   `/api/book/create/route.ts`:
        *   Creates a `Book` record (status `DRAFT`, default title/childName, `pageLength`).
        *   Creates `Page` records, one for each asset ID, linking `Page.assetId` and `Page.originalImageUrl`. Sets `index` and `pageNumber`. First page marked `isTitlePage`.
        *   Returns `{ bookId }`.
5.  **Navigate to Editor**:
    *   `create/page.tsx` router pushes to `/create/[bookId]/edit`.

### 5.2. Editing a Book (Cover, Pages, Art Style)

1.  **User navigates to `/create/[bookId]/edit`**.
    *   `src/app/create/[bookId]/edit/page.tsx` fetches book data from `GET /api/book/[bookId]`.
    *   `Canvas` displays the current page (initially cover). `BottomToolbar` is shown.
2.  **Editing Cover**:
    *   User selects "Cover" tab. `CoverEditorPanel` is shown.
    *   User changes title/child name -> `pendingTitle`/`pendingChildName` state updates.
    *   User selects a new cover asset from `allBookAssets` -> `pendingCoverAssetId` updates.
    *   User clicks "Done" -> `handleSaveCover` calls `PATCH /api/book/[bookId]` with changed fields.
    *   Local `bookData` state updates, `Canvas` re-renders.
3.  **Reordering Pages**:
    *   User selects "Pages" tab. `StoryboardGrid` is shown.
    *   User drags and drops pages. `handleStoryboardOrderChange` updates local `storyboardOrder` state.
    *   User clicks "Done" -> `handleSaveStoryboardOrder` calls `POST /api/book/[bookId]/reorder` with `{ pageId, newIndex }` for all pages (including cover at index 0).
    *   Local `bookData` state updates.
4.  **Choosing Art Style**:
    *   User selects "Art Style" tab. `ArtStylePicker` is shown.
    *   User selects a style and/or toggles "Winkify" -> `pendingArtStyle`/`pendingWinkifyEnabled` state updates.
    *   User clicks "Done" -> `handleSaveArtStyle` calls `PATCH /api/book/[bookId]` with `artStyle` and/or `isWinkifyEnabled`.
    *   Local `bookData` state updates.

### 5.3. Story Generation and Review

1.  **Trigger Story Generation**:
    *   In `edit/page.tsx`, user clicks "Generate Story" (enabled by `canGenerate` if title, child name, art style are set).
    *   `handleGenerateStory` calls `POST /api/generate/story` with `bookId`.
    *   `/api/generate/story`:
        *   Fetches book details and pages (excluding cover).
        *   Updates `Book.status` to `GENERATING`.
        *   Enqueues a job in `StoryGeneration` queue (BullMQ) with `StoryGenerationJobData`.
    *   `edit/page.tsx` shows `WritingProgressScreen`.
2.  **Worker Processes Story**:
    *   `story-generation.worker.ts` picks up the job.
    *   Constructs prompt using `createVisionStoryGenerationPrompt` (includes image URLs).
    *   Calls OpenAI Chat API.
    *   Parses JSON response containing text (and `illustrationNotes` if Winkify enabled) for each page.
    *   Updates `Page.text`, `Page.illustrationNotes` for each page in DB.
    *   Updates `Book.status` to `COMPLETED` and token counts.
3.  **Frontend Polls and Navigates to Review**:
    *   `WritingProgressScreen` polls `GET /api/book-status`.
    *   When status is `COMPLETED`, `handleGenerationComplete` (callback from `WritingProgressScreen`) navigates to `/create/review?bookId=[bookId]`.
4.  **User Reviews Text**:
    *   `src/app/create/review/page.tsx` fetches book data (now with generated text).
    *   `PageCard` displays current page's image and text. `PageTracker` shows progress. `NavigationControls` for page turning.
    *   User edits text in `Textarea` (or `Input` for title page). `handleTextChange` updates local page state.
    *   User clicks "Confirm Text". `toggleConfirm` calls:
        *   `PATCH /api/book/[bookId]/page/[pageId]` (for story pages) with new text and `textConfirmed: true`.
        *   `PATCH /api/book/[bookId]` (for title page) with new title.
    *   UI updates to show page as confirmed.

### 5.4. Illustration Generation and Preview

1.  **Trigger Illustration Generation**:
    *   In `review/page.tsx`, when all pages are confirmed, "Illustrate My Book" button (in `PageTracker`) is enabled.
    *   User clicks it. `handleIllustrate` calls `POST /api/generate/illustrations` with `bookId`.
    *   `/api/generate/illustrations`:
        *   Fetches book details and pages.
        *   Updates `Book.status` to `ILLUSTRATING`.
        *   Creates a BullMQ flow: parent `BookFinalize` job, child `IllustrationGeneration` jobs (one per page).
    *   `review/page.tsx` shows a loading state ("Illustrations In Progress...") and starts polling via `checkFinalBookStatus`.
2.  **Workers Process Illustrations**:
    *   `illustration-generation.worker.ts` (one per page):
        *   Fetches original image and style reference image.
        *   Constructs prompt using `createIllustrationPrompt`.
        *   Calls OpenAI Images API (edit endpoint).
        *   Uploads generated image to Cloudinary.
        *   Updates `Page.generatedImageUrl` and `moderationStatus`.
    *   `book-finalize.worker.ts` (after all illustration jobs):
        *   Checks all `Page.moderationStatus` and `Page.generatedImageUrl`.
        *   Sets final `Book.status` (`COMPLETED`, `PARTIAL`, or `FAILED`).
3.  **Frontend Polls and Navigates to Preview**:
    *   `review/page.tsx` (via `checkFinalBookStatus` polling `GET /api/book-status`):
        *   If `COMPLETED`, navigates to `/book/[bookId]/preview`.
        *   If `PARTIAL` or `FAILED`, navigates to `/create?bookId=[bookId]&fix=1` (editor in fix mode - *this specific fix mode URL is an assumption based on common patterns*).
4.  **User Previews Book**:
    *   `src/app/book/[bookId]/preview/page.tsx` fetches book data (now with `generatedImageUrl`s).
    *   `FlipbookViewer` displays the illustrated book. `BookPageGallery` for thumbnails.
5.  **User Exports PDF**:
    *   Clicks "Export PDF". `handleExportPdf` navigates browser to `GET /api/book/[bookId]/export/pdf`.
    *   API route generates PDF using Puppeteer and streams it back.

## 6. Third-Party & Infra Dependencies

*   **Next.js**: Full-stack React framework.
*   **React**: UI library.
*   **Prisma**: ORM for PostgreSQL.
*   **PostgreSQL**: Relational database.
*   **Clerk**: Authentication and user management.
*   **Cloudinary**: Image storage, manipulation, and CDN.
*   **OpenAI API**:
    *   GPT-4o (or similar vision model) for story text generation.
    *   DALL-E / Images API (edit endpoint) for illustration generation.
*   **BullMQ**: Task queue system for background jobs.
*   **Redis**: Message broker and storage for BullMQ.
*   **Puppeteer**: Headless Chrome for PDF generation.
*   **shadcn/ui**: UI component library (built on Radix UI and Tailwind CSS).
    *   `vaul`: Used by `Drawer` component.
    *   `@radix-ui/*`: Primitive components.
*   `react-pageflip`: For the flipbook viewer.
*   `@dnd-kit/*`: For drag-and-drop in `StoryboardGrid`.
*   `embla-carousel-react`: For image carousel in `Canvas`.
*   `svix`: For verifying Clerk webhook signatures.
*   `zod`: Schema validation for API requests.
*   `pino`: Logger.
*   `roughjs`: For "sketchy" UI elements.
*   **Deployment Infra (Assumed/Typical for Next.js & Workers)**:
    *   Vercel (for Next.js app).
    *   Separate hosting for BullMQ workers (e.g., Docker containers on Railway, Fly.io, or other PaaS/IaaS).
    *   Managed PostgreSQL database service.
    *   Managed Redis service.

## 7. Structured Output

This entire response is structured in Markdown as requested.

**Potential Gotchas & Hotspots for Future Refactoring:**

*   **`src/types/index.ts` vs. Prisma Types**: As noted in `cleanup.md`, many custom types in `src/types/index.ts` are redundant with Prisma-generated types. Refactoring to use Prisma types directly will improve maintainability.
*   **Prisma Client Instantiation**: `src/lib/db.ts` and `src/lib/prisma.ts` are duplicates. Consolidate to `src/lib/db.ts`.
*   **`BookCreationContext`**: Its role might be simplified or removed if editor/review pages primarily rely on `bookId` from URL and API calls for data, reducing complex client-side state synchronization.
*   **API Endpoint Consolidation**: `/api/book-content/route.ts` might be redundant if `/api/book/[bookId]/route.ts` provides sufficient data.
*   **Error Handling in Workers**: Ensure robust error handling in workers that correctly updates `Book.status` to `FAILED` or `PARTIAL` and provides clear reasons. The `book-finalize.worker.ts` is key here.
*   **PDF Generation Styling**: `generateBookPdf.ts` uses basic inline styles. This will need significant enhancement for a production-quality PDF (fonts, text layout, bleeds, etc.).
*   **Mobile UX for Drag-and-Drop**: `StoryboardGrid`'s `dnd-kit` might need alternative interaction patterns for mobile if drag-and-drop is clunky.
*   **Polling Efficiency**: While simple, polling for status updates can be inefficient. Consider WebSockets or Server-Sent Events for real-time updates in the future if scaling becomes an issue.
*   **Worker Module Resolution**: The use of `.cjs` for `styleLibrary` and `package.json` files with `"type": "commonjs"` in `lib` and `queues/workers` indicates careful management of ESM/CJS interop for workers. This needs to be maintained correctly if dependencies or build processes change.
*   **Security of `ensureUser`**: While `clerkId` is used, ensure that email updates via `ensureUser` are intended and secure, as Clerk is the source of truth for email.
*   **`pageNumber` vs `index`**: While currently handled consistently (`pageNumber = index + 1` or `storyIndex + 1`), ensure this logic remains robust throughout, especially if pages can be deleted or if the cover page logic changes. `index` should be the canonical source for DB ordering.

This detailed analysis should provide a strong foundation for understanding and working with the Storywink.ai codebase.