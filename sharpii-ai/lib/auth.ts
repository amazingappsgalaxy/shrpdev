import { betterAuth } from "better-auth";
import { Pool } from "pg";

// Construct PostgreSQL connection string from Supabase URL
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Extract database connection details from Supabase URL
// Format: https://[project-ref].supabase.co
const projectRef = supabaseUrl.replace('https://', '').replace('.supabase.co', '');
const databaseUrl = `postgresql://postgres.${projectRef}:${supabaseServiceKey}@aws-0-us-west-1.pooler.supabase.com:6543/postgres`;

const pool = new Pool({
  connectionString: databaseUrl,
  ssl: {
    rejectUnauthorized: false
  }
});

export const auth = betterAuth({
  database: pool,
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false, // Set to true if you want email verification
  },
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
    },
  },
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24, // 1 day
  },
  user: {
    additionalFields: {
      subscriptionStatus: {
        type: "string",
        defaultValue: "free",
      },
      apiUsage: {
        type: "number",
        defaultValue: 0,
      },
      monthlyApiLimit: {
        type: "number",
        defaultValue: 100,
      },
    },
  },
  advanced: {
    generateId: () => {
      // Generate a custom ID format if needed
      return crypto.randomUUID();
    },
  },
});

export type Session = typeof auth.$Infer.Session;
export type User = typeof auth.$Infer.Session.user;