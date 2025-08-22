// Inngest API endpoint for handling scheduled functions
import { serve } from 'inngest/next';
import { inngest } from '@/lib/inngest';
import { inngestFunctions } from '@/lib/inngest/functions';

// Create the Inngest serve handler
export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: inngestFunctions,
  signingKey: process.env.INNGEST_SIGNING_KEY,
});
