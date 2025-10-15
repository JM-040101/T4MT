# ThaiFightTalk Deployment Guide

## Deploying to Vercel

### Prerequisites

1. **GitHub Repository**: Ensure all code is pushed to your GitHub repo
2. **Vercel Account**: Sign up at https://vercel.com
3. **Supabase Project**: Running with migrations applied
4. **Environment Variables**: Ready from `.env.example`

---

## Step-by-Step Deployment

### 1. Connect Repository to Vercel

1. Go to https://vercel.com/new
2. Import your Git repository: `JM-040101/T4MT`
3. **IMPORTANT**: Vercel will auto-detect the framework

### 2. Configure Project Settings

**CRITICAL**: Before clicking Deploy, configure these settings:

**Root Directory**:
1. Click **Edit** next to "Root Directory"
2. Set to: `thaifighttalk`
3. This tells Vercel where your Next.js app lives

**Framework Preset**:
- Should auto-detect as: **Next.js**
- If not, manually select **Next.js**

**Build Command** (leave default or set to):
```bash
npm run build
```

**Output Directory** (leave default):
```
.next
```

**Install Command** (leave default):
```bash
npm install
```

**Node.js Version**:
- Set to: **20.x** (recommended)

### 3. Add Environment Variables

In Vercel project settings → Environment Variables, add these:

#### Supabase
```env
NEXT_PUBLIC_SUPABASE_URL=https://ydalwnoedxxyvimvrjje.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlkYWx3bm9lZHh4eXZpbXZyamplIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA1MDc0NjMsImV4cCI6MjA3NjA4MzQ2M30.F1hYOEJKX3pjWJXSWLu9g2hXz7Mq_eHtqEhgN8OmTpo
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlkYWx3bm9lZHh4eXZpbXZyamplIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDUwNzQ2MywiZXhwIjoyMDc2MDgzNDYzfQ.Mb-Cgjk0hcK7yu4mMDMPoYJvbahOnn_cFCP89OfCwbs
```

#### OpenAI (for AI sparring partner)
```env
OPENAI_API_KEY=your_openai_api_key_here
```

#### Lemon Squeezy (optional, for payments)
```env
LEMON_SQUEEZY_API_KEY=your_lemon_squeezy_api_key_here
LEMON_SQUEEZY_STORE_ID=your_store_id
LEMON_SQUEEZY_WEBHOOK_SECRET=your_webhook_secret
```

#### App URL
```env
NEXT_PUBLIC_APP_URL=https://your-app.vercel.app
```
**Note**: Update this after deployment with your actual Vercel URL

### 4. Deploy

Click **Deploy** button and wait for build to complete.

---

## Post-Deployment Steps

### 1. Update App URL

After deployment:
1. Copy your Vercel deployment URL (e.g., `https://thaifighttalk.vercel.app`)
2. Update `NEXT_PUBLIC_APP_URL` environment variable in Vercel
3. Redeploy to apply changes

### 2. Configure Supabase Auth Callbacks

In Supabase Dashboard:
1. Go to Authentication → URL Configuration
2. Add your Vercel URL to **Site URL**:
   ```
   https://your-app.vercel.app
   ```
3. Add redirect URLs:
   ```
   https://your-app.vercel.app/auth/callback
   https://your-app.vercel.app/**
   ```

### 3. Test Authentication

1. Visit your deployed app
2. Try signing up with email/password
3. Try Google OAuth (if configured)
4. Verify redirects work correctly

### 4. Verify Database Connection

1. Sign in to your app
2. Visit `/dashboard` - should show your profile data
3. Visit `/profile` - should show badges
4. Visit `/leaderboard` - should show rankings

---

## Troubleshooting

### 404 Error on Root

**Cause**: Vercel is looking in wrong directory

**Fix**: Ensure `vercel.json` has:
```json
{
  "rootDirectory": "thaifighttalk"
}
```

### Build Fails

**Check**:
1. All environment variables are set
2. Root directory is set to `thaifighttalk`
3. Build logs for specific errors

### Authentication Not Working

**Check**:
1. Supabase callback URLs are correct
2. `NEXT_PUBLIC_APP_URL` matches deployment URL
3. Supabase environment variables are correct
4. Check browser console for errors

### API Routes Return 500

**Check**:
1. Supabase credentials are valid
2. Database migrations have been run
3. RLS policies are enabled
4. Check Vercel function logs

### Middleware Errors

**Common Issue**: Edge Runtime warnings

**Fix**: Already handled with `export const runtime = 'nodejs'` in `middleware.ts`

---

## Environment Variables Checklist

Before deploying, ensure you have:

- [x] `NEXT_PUBLIC_SUPABASE_URL`
- [x] `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- [x] `SUPABASE_SERVICE_ROLE_KEY`
- [ ] `OPENAI_API_KEY` (required for AI features)
- [ ] `LEMON_SQUEEZY_API_KEY` (optional, for payments)
- [ ] `LEMON_SQUEEZY_STORE_ID` (optional)
- [ ] `LEMON_SQUEEZY_WEBHOOK_SECRET` (optional)
- [x] `NEXT_PUBLIC_APP_URL`

---

## Database Setup on Production

### 1. Run Migrations

In Supabase SQL Editor, run these files in order:

```sql
-- 1. Run supabase/migrations/001_initial_schema.sql
-- 2. Run supabase/migrations/002_rls_policies.sql
-- 3. Run supabase/migrations/003_seed_data.sql
```

### 2. Verify Tables

Check that these tables exist:
- users
- camps
- lessons
- user_lessons
- badges
- user_badges
- subscriptions
- sparring_sessions

### 3. Test Data Access

1. Create a test user via signup
2. Check that user appears in `users` table
3. Verify seed data (camps, lessons, badges) is visible

---

## Vercel Configuration

### Configuration via Vercel UI (Recommended)

All project settings are configured through the Vercel UI:

1. **Root Directory**: Set to `thaifighttalk` in Project Settings
2. **Framework**: Next.js (auto-detected)
3. **Build Command**: `npm run build`
4. **Install Command**: `npm install`
5. **Node.js Version**: 20.x

### No vercel.json Required

For monorepo setups with Next.js, Vercel's UI configuration is the recommended approach. The `rootDirectory` setting in the UI replaces the need for `vercel.json`.

---

## Common Deployment Errors

### Error: "Module not found"

**Cause**: Dependencies not installed

**Fix**:
1. Ensure `package.json` has all dependencies
2. Delete `node_modules` and `package-lock.json`
3. Run `npm install`
4. Commit changes
5. Redeploy

### Error: "Middleware execution failed"

**Cause**: Supabase middleware using Node.js APIs in Edge Runtime

**Fix**: Already handled with runtime config in `middleware.ts`

### Error: "Database connection failed"

**Cause**: Environment variables not set

**Fix**:
1. Check Vercel environment variables
2. Ensure no extra spaces in values
3. Redeploy after adding variables

---

## Performance Optimization

### Enable Caching

In `next.config.ts`, add:
```typescript
const nextConfig: NextConfig = {
  headers: async () => [
    {
      source: '/api/:path*',
      headers: [
        {
          key: 'Cache-Control',
          value: 'public, s-maxage=60, stale-while-revalidate=300',
        },
      ],
    },
  ],
}
```

### Enable Image Optimization

Images are automatically optimized by Next.js Image component.

Ensure you're using:
```tsx
import Image from 'next/image'
```

### Monitor Performance

1. Go to Vercel Dashboard → Analytics
2. Check Core Web Vitals
3. Monitor function execution times

---

## Security Checklist

Before going live:

- [ ] All secrets are in environment variables (not committed)
- [ ] `.env.local` is in `.gitignore`
- [ ] Supabase RLS policies are enabled on all tables
- [ ] API routes validate user authentication
- [ ] CORS is properly configured
- [ ] Rate limiting is enabled (TODO: implement)
- [ ] Supabase service role key is only in environment variables

---

## DNS Configuration (Custom Domain)

### Add Custom Domain

1. In Vercel → Project Settings → Domains
2. Add your domain (e.g., `thaifighttalk.com`)
3. Follow Vercel's DNS configuration instructions
4. Update `NEXT_PUBLIC_APP_URL` to your custom domain
5. Update Supabase auth URLs

### SSL Certificate

Vercel automatically provisions SSL certificates via Let's Encrypt.

---

## Monitoring and Logging

### Vercel Logs

Access logs in Vercel Dashboard:
1. Go to your project
2. Click "Logs" tab
3. Filter by function, status, or time

### Supabase Logs

Access database logs in Supabase Dashboard:
1. Go to Project → Logs
2. Check API logs, Postgres logs

### Error Tracking (Optional)

Integrate Sentry:
```bash
npm install @sentry/nextjs
npx @sentry/wizard@latest -i nextjs
```

---

## Rollback Procedure

If deployment breaks:

1. Go to Vercel Dashboard → Deployments
2. Find last working deployment
3. Click "..." → Promote to Production
4. Fix issue locally
5. Redeploy

---

## Success Checklist

After deployment, verify:

- [ ] Home page loads (/)
- [ ] Login works (/login)
- [ ] Signup works (/signup)
- [ ] Dashboard loads (/dashboard)
- [ ] Profile page loads (/profile)
- [ ] Leaderboard loads (/leaderboard)
- [ ] API endpoints return data
- [ ] Authentication persists across page refreshes
- [ ] No console errors in browser
- [ ] No 500 errors in Vercel logs

---

## Support

If you encounter issues:

1. Check Vercel deployment logs
2. Check Supabase logs
3. Review this guide's Troubleshooting section
4. Check Next.js documentation: https://nextjs.org/docs
5. Check Supabase documentation: https://supabase.com/docs

---

**You're ready to deploy!** 🚀

Follow the steps above and your ThaiFightTalk app will be live on Vercel.
