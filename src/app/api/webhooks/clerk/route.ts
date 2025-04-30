import { Webhook } from 'svix';
import { headers } from 'next/headers';
import { WebhookEvent } from '@clerk/nextjs/server';
import { db as prisma } from '@/lib/db';
import logger from '@/lib/logger';
import { NextResponse } from 'next/server';

// Ensure Clerk Webhook Secret is set in environment variables
const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET;

if (!WEBHOOK_SECRET) {
  logger.error('CLERK_WEBHOOK_SECRET is not set in environment variables.');
  // Optionally throw an error during startup if critical
  // throw new Error('CLERK_WEBHOOK_SECRET is not set.');
}

export async function POST(req: Request) {
  logger.info('Received Clerk webhook request.');

  if (!WEBHOOK_SECRET) {
    logger.error('Webhook secret not configured, cannot process request.');
    return NextResponse.json({ error: 'Webhook secret not configured' }, { status: 500 });
  }

  // Get the headers
  const headerPayload = await headers();
  const svix_id = headerPayload.get("svix-id");
  const svix_timestamp = headerPayload.get("svix-timestamp");
  const svix_signature = headerPayload.get("svix-signature");

  // If there are no headers, error out
  if (!svix_id || !svix_timestamp || !svix_signature) {
    logger.warn('Webhook request missing required Svix headers.');
    return NextResponse.json({ error: 'Missing Svix headers' }, { status: 400 });
  }

  // Get the body
  let payload: WebhookEvent;
  try {
    const body = await req.json();
    payload = body as WebhookEvent; // Cast after parsing
  } catch (err) {
    logger.error('Error parsing webhook request body:', err);
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }


  // Create a new Svix instance with your secret.
  const wh = new Webhook(WEBHOOK_SECRET);

  let evt: WebhookEvent;

  // Verify the payload with the headers
  try {
    evt = wh.verify(JSON.stringify(payload), { // Verify the stringified payload
      "svix-id": svix_id,
      "svix-timestamp": svix_timestamp,
      "svix-signature": svix_signature,
    }) as WebhookEvent;
    logger.info({ eventType: evt.type }, 'Webhook signature verified successfully.');
  } catch (err: any) {
    logger.error('Error verifying webhook signature:', err.message);
    return NextResponse.json({ error: 'Webhook signature verification failed' }, { status: 400 });
  }

  // Get the ID and type
  const eventType = evt.type;

  logger.info({ eventType }, `Processing webhook event...`);

  // Handle the event type
  try {
    switch (eventType) {
      case 'user.created':
      case 'user.updated':
        const { id, email_addresses, first_name, last_name, image_url } = evt.data;
        const email = email_addresses?.[0]?.email_address;

        if (!email) {
           logger.warn({ userId: id }, 'User created/updated webhook missing primary email address.');
           // Decide if you want to proceed without email or return an error
           // return NextResponse.json({ error: 'Missing primary email' }, { status: 400 });
        }

        logger.info({ userId: id, email, eventType }, `Upserting user...`);
        await prisma.user.upsert({
          where: { id: id },
          update: {
            email: email || '', // Handle case where email might be missing but we proceed
            name: `${first_name || ''} ${last_name || ''}`.trim() || null,
            imageUrl: image_url,
            updatedAt: new Date(), // Explicitly set updatedAt
          },
          create: {
            id: id,
            email: email || `placeholder-${id}@example.com`, // Provide a placeholder if email is critical but missing
            name: `${first_name || ''} ${last_name || ''}`.trim() || null,
            imageUrl: image_url,
          },
        });
        logger.info({ userId: id, eventType }, `User upsert completed.`);
        break;

      case 'user.deleted':
        // Clerk might send delete events even for users not in your DB if sync was incomplete
        // Use deleteMany which doesn't throw if the user doesn't exist.
        const { id: deletedId } = evt.data;
        if (deletedId) {
            logger.info({ userId: deletedId }, `Attempting to delete user...`);
            const deleteResult = await prisma.user.deleteMany({
              where: { id: deletedId },
            });
            if (deleteResult.count > 0) {
                logger.info({ userId: deletedId }, `User deleted successfully.`);
            } else {
                logger.warn({ userId: deletedId }, `User deletion webhook received, but user not found in DB.`);
            }
        } else {
             logger.warn('User deleted webhook received, but no ID found in payload data.');
        }
        break;

      default:
        logger.info({ eventType }, `Ignoring unhandled webhook event type.`);
    }

    return NextResponse.json({ message: 'Webhook processed successfully' }, { status: 200 });

  } catch (error: any) {
    logger.error({ eventType, error: error.message }, 'Error processing webhook event.');
    return NextResponse.json({ error: 'Internal server error processing webhook' }, { status: 500 });
  }
} 