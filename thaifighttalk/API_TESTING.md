# ThaiFightTalk API Testing Guide

## Prerequisites

1. **Dev server running**: `npm run dev` (should be on http://localhost:3000)
2. **Create a test user**:
   - Go to http://localhost:3000/signup
   - Sign up with: test@thaifighttalk.com / password123456
   - Or use any email/password combination

3. **Get your auth token**:
   - Open browser DevTools (F12)
   - Go to Application/Storage → Cookies
   - Find cookies for localhost:3000
   - Look for `sb-*-auth-token` cookie
   - Copy the value (this is your auth token)

## API Endpoints

### 1. Get All Camps
**Endpoint**: `GET /api/v1/camps`

```bash
curl http://localhost:3000/api/v1/camps \
  -H "Cookie: sb-ydalwnoedxxyvimvrjje-auth-token=YOUR_AUTH_TOKEN_HERE"
```

**Expected Response**:
```json
{
  "data": [
    {
      "id": "uuid",
      "title": "Basic Greetings & Respect",
      "theme": "greetings",
      "unlock_level": 1,
      "is_unlocked": true,
      ...
    }
  ]
}
```

---

### 2. Get Camp Lessons
**Endpoint**: `GET /api/v1/camps/{campId}/lessons`

```bash
# Replace {campId} with actual camp ID from previous response
curl http://localhost:3000/api/v1/camps/{campId}/lessons \
  -H "Cookie: sb-ydalwnoedxxyvimvrjje-auth-token=YOUR_AUTH_TOKEN_HERE"
```

**Expected Response**:
```json
{
  "data": [
    {
      "id": "uuid",
      "title": "Greetings and Introductions",
      "difficulty": "beginner",
      "xp_reward": 10,
      "user_progress": {
        "completed": false,
        "score": null,
        "attempts": 0
      },
      ...
    }
  ]
}
```

---

### 3. Get Lesson Detail
**Endpoint**: `GET /api/v1/lessons/{lessonId}`

```bash
# Replace {lessonId} with actual lesson ID
curl http://localhost:3000/api/v1/lessons/{lessonId} \
  -H "Cookie: sb-ydalwnoedxxyvimvrjje-auth-token=YOUR_AUTH_TOKEN_HERE"
```

**Expected Response**:
```json
{
  "data": {
    "id": "uuid",
    "title": "Greetings and Introductions",
    "content": {
      "vocabulary": [...],
      "exercises": [...]
    },
    "camp": {
      "id": "uuid",
      "title": "Basic Greetings & Respect",
      "theme": "greetings"
    },
    "user_progress": {
      "completed": false,
      "score": null
    }
  }
}
```

---

### 4. Get All Badges
**Endpoint**: `GET /api/v1/badges`

```bash
curl http://localhost:3000/api/v1/badges \
  -H "Cookie: sb-ydalwnoedxxyvimvrjje-auth-token=YOUR_AUTH_TOKEN_HERE"
```

**Expected Response**:
```json
{
  "data": [
    {
      "id": "uuid",
      "name": "First Words",
      "description": "Complete your first lesson",
      "earned": false,
      "earned_at": null,
      ...
    }
  ]
}
```

---

### 5. Get Leaderboard
**Endpoint**: `GET /api/v1/leaderboard?page=1&limit=10`

```bash
curl "http://localhost:3000/api/v1/leaderboard?page=1&limit=10" \
  -H "Cookie: sb-ydalwnoedxxyvimvrjje-auth-token=YOUR_AUTH_TOKEN_HERE"
```

**Expected Response**:
```json
{
  "data": [
    {
      "rank": 1,
      "user_id": "uuid",
      "display_name": "Test User",
      "xp": 150,
      "level": 2,
      "streak": 3
    }
  ],
  "meta": {
    "page": 1,
    "limit": 10,
    "total": 1,
    "current_user_rank": 1
  }
}
```

---

### 6. AI Sparring Partner
**Endpoint**: `POST /api/v1/ai/sparring`

**Note**: Requires OpenAI API key in `.env.local` and Pro subscription.

```bash
curl -X POST http://localhost:3000/api/v1/ai/sparring \
  -H "Cookie: sb-ydalwnoedxxyvimvrjje-auth-token=YOUR_AUTH_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "message": "สวัสดีครับ",
    "conversation_history": []
  }'
```

**Expected Response** (if Pro user):
```json
{
  "data": {
    "response": "สวัสดีครับ ยินดีที่ได้รู้จัก",
    "translation": "Hello! Nice to meet you.",
    "corrections": []
  }
}
```

**Expected Response** (if Free user):
```json
{
  "error": {
    "code": "FORBIDDEN",
    "message": "AI sparring requires Pro plan"
  }
}
```

---

## Testing Unauthenticated Access

All endpoints should return `401 Unauthorized` without auth:

```bash
# This should fail with 401
curl http://localhost:3000/api/v1/camps
```

**Expected Response**:
```json
{
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Authentication required"
  }
}
```

---

## Quick Browser Testing (Recommended)

Since authentication uses HTTP-only cookies, the easiest way to test is:

1. **Open browser** and go to http://localhost:3000
2. **Sign up/Login** to get authenticated
3. **Open DevTools Console** (F12 → Console tab)
4. **Run fetch commands**:

```javascript
// Test camps endpoint
fetch('/api/v1/camps')
  .then(r => r.json())
  .then(d => console.log('Camps:', d))

// Test badges endpoint
fetch('/api/v1/badges')
  .then(r => r.json())
  .then(d => console.log('Badges:', d))

// Test leaderboard
fetch('/api/v1/leaderboard?page=1&limit=5')
  .then(r => r.json())
  .then(d => console.log('Leaderboard:', d))

// Test AI sparring (POST request)
fetch('/api/v1/ai/sparring', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    message: 'สวัสดีครับ',
    conversation_history: []
  })
})
  .then(r => r.json())
  .then(d => console.log('AI Response:', d))
```

---

## Common Issues

### 401 Unauthorized
- **Cause**: Not authenticated or auth token expired
- **Fix**: Sign in again at http://localhost:3000/login

### 403 Forbidden (AI Sparring)
- **Cause**: Free plan user trying to access Pro feature
- **Fix**: Update user's subscription in Supabase:
  ```sql
  INSERT INTO subscriptions (user_id, plan, status)
  VALUES ('your-user-id', 'pro', 'active')
  ON CONFLICT (user_id) DO UPDATE SET plan = 'pro', status = 'active';
  ```

### 404 Not Found
- **Cause**: Camp/Lesson ID doesn't exist
- **Fix**: Check database has seed data (run migrations/seed script)

### 500 Internal Server Error
- **Cause**: Database connection issue or missing env variables
- **Fix**:
  - Check `.env.local` has correct Supabase credentials
  - Check Supabase project is running
  - Check database tables exist
  - Check API logs in terminal

---

## API Status Checklist

Test each endpoint and check off when working:

- [ ] GET /api/v1/camps
- [ ] GET /api/v1/camps/{campId}/lessons
- [ ] GET /api/v1/lessons/{lessonId}
- [ ] GET /api/v1/badges
- [ ] GET /api/v1/leaderboard
- [ ] POST /api/v1/ai/sparring
- [ ] 401 response for unauthenticated requests

---

## Next Steps After Testing

Once all endpoints are working:

1. **Build frontend components** to consume these APIs
2. **Add rate limiting** (especially for AI endpoint)
3. **Add caching** for camps/lessons data
4. **Monitor API performance** with logging
5. **Write integration tests** with Playwright
