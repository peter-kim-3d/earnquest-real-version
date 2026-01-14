# Edge Functions Setup Guide

## Overview

Two Edge Functions power the hybrid task system:

1. **daily-task-generator** - Creates task instances daily at midnight UTC
2. **auto-approve-tasks** - Auto-approves pending tasks every 15 minutes

## Prerequisites

- Supabase CLI installed (`npm install -g supabase`)
- Supabase project linked (`supabase link --project-ref YOUR_PROJECT_REF`)
- Service role key available

## Deployment

### 1. Deploy Edge Functions

```bash
# Deploy daily-task-generator
supabase functions deploy daily-task-generator

# Deploy auto-approve-tasks
supabase functions deploy auto-approve-tasks
```

### 2. Set Environment Variables

Both functions need access to your Supabase service role key:

```bash
# Set secrets for both functions
supabase secrets set SUPABASE_URL=https://YOUR_PROJECT.supabase.co
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
```

**Note**: These are automatically available in Supabase Edge Functions, but you need to ensure your service role key has the correct permissions.

## Scheduling Options

### Option 1: pg_cron (Recommended for Supabase)

If your Supabase project has `pg_cron` enabled:

```sql
-- Enable pg_cron extension (if not already enabled)
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Schedule daily-task-generator (runs at 00:01 UTC daily)
SELECT cron.schedule(
  'daily-task-generator',
  '1 0 * * *', -- Every day at 00:01 UTC
  $$
  SELECT
    net.http_post(
      url := 'https://YOUR_PROJECT.supabase.co/functions/v1/daily-task-generator',
      headers := jsonb_build_object(
        'Authorization', 'Bearer YOUR_SERVICE_ROLE_KEY',
        'Content-Type', 'application/json'
      ),
      body := '{}'::jsonb
    ) AS request_id;
  $$
);

-- Schedule auto-approve-tasks (runs every 15 minutes)
SELECT cron.schedule(
  'auto-approve-tasks',
  '*/15 * * * *', -- Every 15 minutes
  $$
  SELECT
    net.http_post(
      url := 'https://YOUR_PROJECT.supabase.co/functions/v1/auto-approve-tasks',
      headers := jsonb_build_object(
        'Authorization', 'Bearer YOUR_SERVICE_ROLE_KEY',
        'Content-Type', 'application/json'
      ),
      body := '{}'::jsonb
    ) AS request_id;
  $$
);
```

**Check scheduled jobs:**

```sql
SELECT * FROM cron.job;
```

**Remove a job:**

```sql
SELECT cron.unschedule('daily-task-generator');
SELECT cron.unschedule('auto-approve-tasks');
```

### Option 2: Vercel Cron (If using Vercel for hosting)

If deploying to Vercel, use Vercel Cron Jobs:

#### Create API Routes

**`app/api/cron/daily-tasks/route.ts`:**

```typescript
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  // Verify cron secret
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response('Unauthorized', { status: 401 });
  }

  try {
    // Call Supabase Edge Function
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/daily-task-generator`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    );

    const result = await response.json();
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error calling daily-task-generator:', error);
    return NextResponse.json({ error: 'Failed to generate tasks' }, { status: 500 });
  }
}
```

**`app/api/cron/auto-approve/route.ts`:**

```typescript
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response('Unauthorized', { status: 401 });
  }

  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/auto-approve-tasks`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    );

    const result = await response.json();
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error calling auto-approve-tasks:', error);
    return NextResponse.json({ error: 'Failed to auto-approve' }, { status: 500 });
  }
}
```

#### Configure `vercel.json`:

```json
{
  "crons": [
    {
      "path": "/api/cron/daily-tasks",
      "schedule": "1 0 * * *"
    },
    {
      "path": "/api/cron/auto-approve",
      "schedule": "*/15 * * * *"
    }
  ]
}
```

#### Environment Variables in Vercel:

Add to your Vercel project settings:
- `CRON_SECRET` - Generate a random secret string
- `SUPABASE_SERVICE_ROLE_KEY` - Your Supabase service role key
- `NEXT_PUBLIC_SUPABASE_URL` - Your Supabase project URL

## Testing

### Test Manually

#### Daily Task Generator:

```bash
curl -X POST \
  https://YOUR_PROJECT.supabase.co/functions/v1/daily-task-generator \
  -H "Authorization: Bearer YOUR_SERVICE_ROLE_KEY" \
  -H "Content-Type: application/json"
```

Expected response:
```json
{
  "success": true,
  "instancesCreated": 5,
  "date": "2026-01-09",
  "tasksProcessed": 3
}
```

#### Auto-Approve Tasks:

```bash
curl -X POST \
  https://YOUR_PROJECT.supabase.co/functions/v1/auto-approve-tasks \
  -H "Authorization: Bearer YOUR_SERVICE_ROLE_KEY" \
  -H "Content-Type: application/json"
```

Expected response:
```json
{
  "success": true,
  "processed": 2,
  "approved": 2,
  "failed": 0,
  "timestamp": "2026-01-09T12:00:00.000Z",
  "results": [...]
}
```

### Test with Sample Data

```sql
-- 1. Create a test auto-assign task
INSERT INTO tasks (family_id, name, frequency, auto_assign, is_active)
VALUES ('your-family-id', 'Test Daily Task', 'daily', true, true);

-- 2. Run daily-task-generator (or call via API)

-- 3. Verify instances created
SELECT * FROM task_instances WHERE scheduled_date = CURRENT_DATE;

-- 4. Complete a task with manual approval
-- (create task_completion with status='pending' and auto_approve_at set)

-- 5. Run auto-approve-tasks (or call via API)

-- 6. Verify auto-approval worked
SELECT * FROM task_completions WHERE status = 'auto_approved';
```

## Monitoring

### View Edge Function Logs

In Supabase Dashboard:
1. Go to **Edge Functions** section
2. Click on function name
3. View **Logs** tab

### Check Cron Job Execution

```sql
-- View pg_cron job history
SELECT * FROM cron.job_run_details
WHERE jobname IN ('daily-task-generator', 'auto-approve-tasks')
ORDER BY start_time DESC
LIMIT 20;
```

## Troubleshooting

### Edge Function Not Running

1. **Check deployment**: `supabase functions list`
2. **Check secrets**: Ensure `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are set
3. **Check logs**: View in Supabase Dashboard → Edge Functions → Logs

### Cron Job Not Triggering

1. **Verify pg_cron is enabled**: `SELECT * FROM pg_extension WHERE extname = 'pg_cron';`
2. **Check scheduled jobs**: `SELECT * FROM cron.job;`
3. **View job run history**: `SELECT * FROM cron.job_run_details;`

### No Instances Created

1. **Check for auto-assign tasks**: `SELECT * FROM tasks WHERE auto_assign = true AND is_active = true;`
2. **Verify children exist**: `SELECT * FROM children WHERE deleted_at IS NULL;`
3. **Check Edge Function logs** for errors

### Auto-Approval Not Working

1. **Check for pending completions**: `SELECT * FROM task_completions WHERE status = 'pending' AND auto_approve_at < NOW();`
2. **Verify `approve_task_completion` function exists**: `SELECT proname FROM pg_proc WHERE proname = 'approve_task_completion';`
3. **Check Edge Function logs**

## Next Steps

After setting up Edge Functions:
1. ✅ Verify daily-task-generator runs at midnight UTC
2. ✅ Verify auto-approve-tasks runs every 15 minutes
3. ✅ Monitor logs for the first few days
4. ✅ Proceed to Phase 3: Update task completion API logic
