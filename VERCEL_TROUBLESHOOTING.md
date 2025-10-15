# Vercel 404 Error Troubleshooting

## Quick Diagnostic Steps

### 1. Check Root Directory Setting in Vercel

**CRITICAL**: This is the #1 cause of 404 errors with monorepos.

1. Go to your Vercel project
2. Click **Settings** → **General**
3. Scroll to **Root Directory**
4. It MUST show: `thaifighttalk`

**If it shows anything else (like blank, or `/`, or `T4MT`):**
1. Click **Edit**
2. Type: `thaifighttalk`
3. Click **Save**
4. Go to **Deployments** tab
5. Click **Redeploy** on latest deployment

---

### 2. Check Build Logs

1. Go to your Vercel project
2. Click **Deployments** tab
3. Click on the latest deployment
4. Click **Build Logs**

**Look for these signs of success:**
```
✓ Compiled successfully
✓ Generating static pages
Route (app)                    Size     First Load JS
┌ ○ /                         162 B         105 kB
```

**If you see errors:**
- Share the error message
- Check if it says "Cannot find module" → Root Directory is wrong
- Check if it says "Build failed" → Check environment variables

---

### 3. Check Deployed URL Structure

Try accessing these URLs directly:

1. **Root page**: `https://your-app.vercel.app/`
   - Should show: ThaiFightTalk landing page with gradient background

2. **Login page**: `https://your-app.vercel.app/login`
   - Should show: Login form

3. **API test**: `https://your-app.vercel.app/api/v1/camps`
   - Should return: JSON or 401 error (not 404)

**If all return 404:**
- Root Directory is definitely wrong
- Or deployment failed completely

---

### 4. Check Framework Detection

In Vercel project settings:

1. Go to **Settings** → **General**
2. Check **Framework Preset**
3. Should show: **Next.js**

**If it shows something else:**
1. Click **Edit**
2. Select **Next.js** from dropdown
3. Save and redeploy

---

### 5. Verify Environment Variables

1. Go to **Settings** → **Environment Variables**
2. Check that these exist:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `NEXT_PUBLIC_APP_URL`

**Missing variables won't cause 404, but will break functionality**

---

## Common Root Causes

### Issue 1: Root Directory Not Set

**Symptoms:**
- All pages return 404
- Build logs show "Cannot find package.json"

**Fix:**
1. Settings → General → Root Directory
2. Set to: `thaifighttalk`
3. Redeploy

---

### Issue 2: Wrong Build Command

**Symptoms:**
- Build fails
- Error: "Cannot find next"

**Fix:**
1. Settings → General → Build & Development Settings
2. Build Command: `npm run build`
3. Install Command: `npm install`
4. Redeploy

---

### Issue 3: Output Directory Wrong

**Symptoms:**
- Build succeeds but deployment has no pages

**Fix:**
1. Settings → General → Build & Development Settings
2. Output Directory: `.next` (with the dot)
3. Redeploy

---

## Step-by-Step Fix (If Nothing Works)

1. **Delete the Vercel project** (yes, completely delete it)

2. **Re-import from GitHub:**
   - Go to https://vercel.com/new
   - Import `JM-040101/T4MT`

3. **STOP! Before clicking Deploy:**
   - Click **Edit** next to Root Directory
   - Type: `thaifighttalk`
   - Click **Continue**

4. **Add Environment Variables:**
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://ydalwnoedxxyvimvrjje.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlkYWx3bm9lZHh4eXZpbXZyamplIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA1MDc0NjMsImV4cCI6MjA3NjA4MzQ2M30.F1hYOEJKX3pjWJXSWLu9g2hXz7Mq_eHtqEhgN8OmTpo
   SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlkYWx3bm9lZHh4eXZpbXZyamplIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDUwNzQ2MywiZXhwIjoyMDc2MDgzNDYzfQ.Mb-Cgjk0hcK7yu4mMDMPoYJvbahOnn_cFCP89OfCwbs
   NEXT_PUBLIC_APP_URL=https://your-app.vercel.app
   OPENAI_API_KEY=your_key_here
   ```

5. **Now click Deploy**

6. **Wait for build to complete**

7. **Test the URL**

---

## Screenshot: Where to Find Root Directory

When importing to Vercel, look for this section:

```
Configure Project
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Root Directory   [Edit]
The directory in which your code is located.
[thaifighttalk/                        ]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

It MUST say `thaifighttalk` in that box.

---

## Still Getting 404?

If you've done all of the above and still get 404:

1. **Share these with me:**
   - Screenshot of Settings → General (Root Directory section)
   - Build logs from latest deployment
   - The exact URL you're accessing

2. **Check the deployment:**
   - Go to Deployments tab
   - Look at the "Preview" link
   - Try that link instead of production link

3. **Check GitHub:**
   - Make sure latest code is pushed
   - Vercel deploys from GitHub, not local files

---

## Expected Behavior (Working Deployment)

When deployment is successful:

1. **Root URL** (`https://your-app.vercel.app/`):
   - Shows: Gradient background with "ThaiFightTalk" heading
   - Shows: "Start Learning" and "Log In" buttons
   - No 404 error

2. **Build Status**:
   - Shows: Green checkmark ✓
   - Shows: "Deployment completed"
   - Shows: Route table in logs

3. **All Routes Work**:
   - `/login` → Login page
   - `/signup` → Signup page
   - `/dashboard` → Redirects to login (if not authenticated)

---

Need more help? Let me know:
1. What's your Root Directory setting?
2. What's in your build logs?
3. What URL are you accessing?
