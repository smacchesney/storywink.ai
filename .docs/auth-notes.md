# Storywink.ai Authentication System Overview

This document outlines the authentication and user management system for Storywink.ai, which leverages Clerk for core authentication services and synchronizes user data with a local PostgreSQL database via Prisma.

## 1. Overview

Storywink.ai uses [Clerk](https://clerk.com/) as its primary authentication provider. Clerk handles user sign-up, sign-in, session management, and provides user profile information. This information is then synchronized with a local `User` table in the application's database to link application-specific data (like books and assets) to users.

## 2. Clerk Setup & Configuration

### Environment Variables
Clerk integration requires specific environment variables to be set, primarily for identifying your Clerk application instance and securing webhook communication:

-   `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`: Clerk's public key for frontend components.
-   `CLERK_SECRET_KEY`: Clerk's secret key for backend operations.
-   `CLERK_WEBHOOK_SECRET`: Secret used to verify webhook signatures originating from Clerk.
-   `NEXT_PUBLIC_CLERK_SIGN_IN_URL`: Path to your sign-in page (e.g., `/sign-in`).
-   `NEXT_PUBLIC_CLERK_SIGN_UP_URL`: Path to your sign-up page (e.g., `/sign-up`).
-   `NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL`: Where to redirect after sign-in (e.g., `/dashboard`).
-   `NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL`: Where to redirect after sign-up (e.g., `/dashboard`).

These are typically managed in an `.env` file.

### Middleware (`middleware.ts`)
The Next.js middleware (`middleware.ts` at the root of `src` or project root) is crucial for protecting routes and managing authentication state across the application.

```typescript
// Example: middleware.ts
import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

const isProtectedRoute = createRouteMatcher([
  '/dashboard(.*)', // Protect dashboard routes
  '/create(.*)',    // Protect creation routes
  '/api/upload(.*)', // Protect upload API
  // Add other routes that require authentication
]);

export default clerkMiddleware((auth, req) => {
  if (isProtectedRoute(req)) {
    auth().protect(); // If the route is protected, enforce authentication
  }
});

export const config = {
  matcher: ["/((?!.*\\..*|_next).*)", "/", "/(api|trpc)(.*)"],
};
```
This middleware ensures that users are authenticated before accessing protected routes.

### Clerk Provider (`src/app/layout.tsx`)
The root layout wraps the application with `<ClerkProvider>` to make Clerk's authentication state and hooks available throughout the React component tree.

```tsx
// src/app/layout.tsx
import { ClerkProvider } from '@clerk/nextjs';
// Potentially import custom styling for Clerk components, e.g., dark theme
// import { dark } from '@clerk/themes';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider /* appearance={{ baseTheme: dark }} */ >
      <html lang="en">
        <body>{children}</body>
      </html>
    </ClerkProvider>
  );
}
```

## 3. User Authentication Flow

Clerk provides pre-built UI components for handling user authentication flows:
-   **Sign-up**: `<SignUp />` component.
-   **Sign-in**: `<SignIn />` component.
-   **User Profile Management**: `<UserProfile />` for managing profile details, connected accounts, etc.
-   **Sign-out**: Typically handled by a button that uses Clerk's `signOut()` function.

These components are usually placed on dedicated pages like `/sign-in`, `/sign-up`, and `/user-profile`.

Session management is handled automatically by Clerk using cookies and its backend services.

## 4. Accessing User Data & Auth State

### Frontend (Client Components)
Clerk provides hooks for accessing authentication state and user information in client components:
-   `useAuth()`: Provides access to `userId`, `sessionId`, `isLoaded`, `isSignedIn`.
    ```tsx
    import { useAuth } from '@clerk/nextjs';
    // ...
    const { userId, isSignedIn } = useAuth();
    if (!isSignedIn) return <p>Please sign in.</p>;
    ```
-   `useUser()`: Provides access to the full user object if signed in: `user.id` (Clerk ID), `user.firstName`, `user.lastName`, `user.emailAddresses`, `user.imageUrl`, etc.
    ```tsx
    import { useUser } from '@clerk/nextjs';
    // ...
    const { user } = useUser();
    if (!user) return null; // Or loading state
    return <p>Hello, {user.firstName}!</p>;
    ```

### Backend (API Routes & Server Components)
In backend code (Next.js API routes, Route Handlers, Server Components), Clerk provides server-side helpers:
-   `auth()`: From `@clerk/nextjs/server`. Returns an object with `userId`, `sessionId`, and a `protect()` method.
    ```typescript
    // src/app/api/some-route/route.ts
    import { auth } from '@clerk/nextjs/server';
    export async function GET(request: Request) {
      const { userId } = await auth();
      if (!userId) return new Response("Unauthorized", { status: 401 });
      // ... logic for authenticated user ...
    }
    ```
-   `currentUser()`: From `@clerk/nextjs/server`. Asynchronously retrieves the full Clerk user object.
    ```typescript
    // src/app/api/upload/route.ts (example)
    import { auth, currentUser } from '@clerk/nextjs/server';
    // ...
    const { userId: clerkIdFromAuth } = await auth();
    const user = await currentUser(); // Full Clerk user object
    if (!clerkIdFromAuth || !user) { /* Unauthorized */ }
    // Access user.id, user.emailAddresses, user.firstName, etc.
    ```

## 5. Route Protection

### Clerk Middleware
As shown in section 2.2, `middleware.ts` is the primary mechanism for protecting routes server-side before they are even rendered or executed.

### Conditional Rendering in UI
Client components can use `useAuth()` or `useUser()` to conditionally render content or redirect users:
```tsx
if (!isLoaded) return <p>Loading auth state...</p>;
if (!isSignedIn) return <RedirectToSignIn />;
// Show protected content
```

### Auth Checks in API Routes
API routes must explicitly check for authentication using `auth()` at the beginning of their handlers, as shown in section 4.2.

## 6. Database Synchronization with Local User Table

To associate application-specific data with users, Storywink.ai maintains a local `User` table in its PostgreSQL database. This table is managed by Prisma.

### Prisma `User` Model (`prisma/schema.prisma`)
The `User` model is defined in `storywink.ai/prisma/schema.prisma`:
```prisma
// storywink.ai/prisma/schema.prisma
model User {
  id        String       @id @default(cuid()) // Internal database CUID
  clerkId   String       @unique              // Stores the Clerk User ID
  email     String       @unique              // User's primary email
  name      String?
  imageUrl  String?
  createdAt DateTime     @default(now())
  updatedAt DateTime     @updatedAt
  books     Book[]
  assets    Asset[]
  profile   UserProfile?
}
```
-   `id`: The internal primary key for the database.
-   `clerkId`: Stores the unique ID from Clerk. This is the crucial link.
-   `email`: Stores the user's primary email, also unique.

### `ensureUser` Utility (`src/lib/db/ensureUser.ts`)
This utility function is responsible for creating or updating a user record in the local database, ensuring it's synchronized with the information from Clerk.

```typescript
// storywink.ai/src/lib/db/ensureUser.ts
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

export async function ensureUser(clerkUser: {
  id: string;        // This is the Clerk ID
  email: string;
  name?: string | null;
  imageUrl?: string | null;
}) {
  const { id: clerkId, email, name, imageUrl } = clerkUser;
  // ... (logic to handle nulls for name/imageUrl) ...

  return prisma.user.upsert({
    where: { clerkId: clerkId }, // Upsert based on the immutable Clerk ID
    update: {
      email: email, // Update email if it changed in Clerk
      name: finalName,
      imageUrl: finalImageUrl,
    },
    create: {
      clerkId: clerkId,
      email: email,
      name: finalName,
      imageUrl: finalImageUrl,
    },
  });
}
```
**Key behavior**: It uses `clerkId` as the primary anchor for the upsert. If a user with that `clerkId` exists, their details (including email) are updated. If not, a new record is created. This correctly handles scenarios like email changes in Clerk.

### Clerk Webhooks (`src/app/api/webhooks/clerk/route.ts`)
This API route listens for events from Clerk (e.g., user creation, updates, deletion) to keep the local database synchronized.

-   **`user.created` / `user.updated` Events**:
    -   The webhook extracts user details (`id` (Clerk ID), `email_addresses`, `first_name`, `last_name`, `image_url`) from the event payload.
    -   It then calls `ensureUser()` with these details to create or update the corresponding user record in the local database.
    ```typescript
    // Inside webhook handler for user.created/updated
    // ... extract data from evt.data ...
    const primaryEmail = /* logic to get primary email */;
    if (!primaryEmail) { /* handle missing email */ }
    await ensureUser({
        id: clerkIdFromEvent,
        email: primaryEmail,
        name: /* combined first/last name */,
        imageUrl: imageUrlFromEvent,
    });
    ```

-   **`user.deleted` Event**:
    -   When a user is deleted in Clerk, this event is triggered.
    -   The webhook handler extracts the `id` (Clerk ID) of the deleted user.
    -   It then deletes the corresponding user from the local database using `prisma.user.deleteMany({ where: { clerkId: deletedClerkId } })`.
    ```typescript
    // Inside webhook handler for user.deleted
    const { id: deletedClerkId, deleted } = evt.data;
    if (deleted && deletedClerkId) {
      await prisma.user.deleteMany({
        where: { clerkId: deletedClerkId },
      });
    }
    ```

### API Route Integration (Example: `src/app/api/upload/route.ts`)
Protected API routes that perform operations on behalf of a user also call `ensureUser` at the beginning of their execution. This serves as a an on-demand synchronization step, guaranteeing that a local user record exists before related database operations (e.g., creating an asset linked to a `userId`).

```typescript
// storywink.ai/src/app/api/upload/route.ts
import { auth, currentUser } from '@clerk/nextjs/server';
import { ensureUser } from '@/lib/db/ensureUser';
// ...
export async function POST(request: Request) {
  const { userId: clerkIdFromAuth } = await auth();
  const clerkUserDetails = await currentUser();

  if (!clerkIdFromAuth || !clerkUserDetails) { /* Unauthorized */ }
  
  const primaryEmail = /* Get primary email from clerkUserDetails */;
  if (!primaryEmail) { /* Handle error */ }

  // Ensure user exists in local DB before proceeding
  await ensureUser({
    id: clerkUserDetails.id, // Clerk ID
    email: primaryEmail,
    name: /* ... */,
    imageUrl: clerkUserDetails.imageUrl,
  });

  // ... rest of the upload logic, using clerkIdFromAuth as userId for DB relations ...
}
```
This ensures data integrity, especially if a user interacts with the application before the `user.created` webhook has had a chance to process.

## 7. Key Files Summary

-   **`middleware.ts`**: Enforces authentication for protected routes.
-   **`src/app/layout.tsx`**: Provides Clerk context to the application.
-   **`src/app/(auth)` directory (e.g., `src/app/(auth)/sign-in/[[...sign-in]]/page.tsx`)**: Hosts Clerk's UI components for sign-in, sign-up.
-   **`prisma/schema.prisma`**: Defines the `User` model and its relation to Clerk (`clerkId`).
-   **`src/lib/db/ensureUser.ts`**: Core utility for synchronizing Clerk user data to the local database.
-   **`src/app/api/webhooks/clerk/route.ts`**: Handles webhook events from Clerk for real-time database synchronization.
-   **Protected API Routes (e.g., `src/app/api/upload/route.ts`)**: Demonstrate how `ensureUser` is called on-demand.
-   **Client Components using `useAuth`, `useUser`**: For UI interactions based on auth state.

This system provides a robust authentication layer using Clerk, with a tightly synchronized local user database for application-specific data management.
