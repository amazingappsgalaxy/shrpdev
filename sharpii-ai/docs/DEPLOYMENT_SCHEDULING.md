# Deployment Scheduling Configuration

This document explains how to set up scheduled tasks for cleanup and renewal processes across different cloud platforms.

## Overview

The application requires two scheduled tasks:
1. **Cleanup Expired Tasks** - Runs daily at 2 AM to remove tasks older than 45 days
2. **Process Renewals** - Runs daily at midnight to process monthly credit renewals

## Platform-Specific Configurations

### Netlify (Current Configuration)

**Functions Location:** `netlify/functions/`
- `cleanup-expired-tasks.js`
- `process-renewals.js`

**Scheduling Options:**

1. **Netlify Scheduled Functions (Recommended)**
   - Requires Netlify Pro plan or higher
   - Add to `netlify.toml`:
   ```toml
   [[functions]]
   name = "cleanup-expired-tasks"
   schedule = "0 2 * * *"
   
   [[functions]]
   name = "process-renewals"
   schedule = "0 0 * * *"
   ```

2. **External Cron Service**
   - Use services like cron-job.org, EasyCron, or GitHub Actions
   - Make HTTP POST requests to:
     - `https://your-domain.netlify.app/.netlify/functions/cleanup-expired-tasks`
     - `https://your-domain.netlify.app/.netlify/functions/process-renewals`
   - Include `Authorization: Bearer YOUR_ADMIN_SECRET_KEY` header

### Vercel

**Configuration:** `vercel.json`
```json
{
  "crons": [
    {
      "path": "/api/admin/cleanup-expired-tasks",
      "schedule": "0 2 * * *"
    },
    {
      "path": "/api/admin/process-renewals",
      "schedule": "0 0 * * *"
    }
  ]
}
```

**API Routes:** `src/app/api/admin/`
- `cleanup-expired-tasks/route.ts`
- `process-renewals/route.ts`

### AWS (Lambda + EventBridge)

1. Deploy functions as AWS Lambda
2. Create EventBridge rules with cron expressions:
   - Cleanup: `cron(0 2 * * ? *)`
   - Renewals: `cron(0 0 * * ? *)`

### Google Cloud Platform

1. Deploy as Cloud Functions
2. Use Cloud Scheduler with cron expressions:
   - Cleanup: `0 2 * * *`
   - Renewals: `0 0 * * *`

### Railway

1. Deploy application normally
2. Use Railway's Cron Jobs feature
3. Configure HTTP triggers to your API endpoints

## Environment Variables Required

Ensure these environment variables are set in your deployment:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Tebi.io Configuration
TEBI_ACCESS_KEY_ID=your_tebi_access_key
TEBI_SECRET_ACCESS_KEY=your_tebi_secret_key
TEBI_ENDPOINT=your_tebi_endpoint
TEBI_REGION=your_tebi_region
TEBI_BUCKET_NAME=your_tebi_bucket_name

# Admin Security
ADMIN_SECRET_KEY=your_admin_secret_key
```

## Manual Execution

For testing or manual execution, you can call the endpoints directly:

```bash
# Cleanup expired tasks
curl -X POST https://your-domain.com/.netlify/functions/cleanup-expired-tasks \
  -H "Authorization: Bearer YOUR_ADMIN_SECRET_KEY"

# Process renewals
curl -X POST https://your-domain.com/.netlify/functions/process-renewals \
  -H "Authorization: Bearer YOUR_ADMIN_SECRET_KEY"
```

## Monitoring

Both functions log their activities and return detailed responses including:
- Number of items processed
- Any errors encountered
- Execution summary

Monitor your platform's function logs to ensure proper execution.

## Migration Between Platforms

1. **From Vercel to Netlify:** Functions are already created in `netlify/functions/`
2. **From Netlify to Vercel:** Use the API routes in `src/app/api/admin/`
3. **To other platforms:** Adapt the function code to your platform's requirements

## Troubleshooting

- Ensure all environment variables are properly set
- Check function logs for detailed error messages
- Verify admin secret key is correctly configured
- Test functions manually before relying on scheduled execution