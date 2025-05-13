import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function ensureUser(clerkUser: {
  id: string; // This is the Clerk ID
  email: string;
  name?: string | null; // Clerk's `firstName` and `lastName` might be separate or nullable
  imageUrl?: string | null;
}) {
  const { id: clerkId, email, name, imageUrl } = clerkUser;

  // Ensure name and imageUrl are not undefined, convert to null if they are
  const finalName = name === undefined ? null : name;
  const finalImageUrl = imageUrl === undefined ? null : imageUrl;

  // Upsert based on clerkId as the primary anchor.
  // This ensures that if a user exists with this clerkId, their details (like email) are updated.
  // If they don't exist, a new record is created.
  return prisma.user.upsert({
    where: { clerkId: clerkId } as any,
    update: {
      email: email,
      name: finalName,
      imageUrl: finalImageUrl,
      // updatedAt will be handled by Prisma's @updatedAt directive
    } as any,
    create: {
      clerkId: clerkId,
      email: email,
      name: finalName,
      imageUrl: finalImageUrl,
    } as any,
  });
} 