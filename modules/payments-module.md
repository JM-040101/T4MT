# Payments Module

## Purpose

The Payments module handles subscription management, billing, payment processing, and webhook integration with **Lemon Squeezy**. Lemon Squeezy acts as the Merchant of Record (MoR), handling VAT/tax compliance, payment processing, and subscription lifecycle management.

## Key Features

### Subscription Tiers
- **Free:** 2 camps, basic XP/streaks, leaderboard
- **Pro ($6.99/mo):** All camps, offline mode, AI sparring, pronunciation feedback
- **Gym Edition (Custom):** Bulk licenses, admin dashboard, team leaderboards

### Payment Processing
- Lemon Squeezy handles all payment processing
- Supports credit cards, PayPal, Apple Pay
- Automatic VAT/tax calculation for global users
- Secure checkout flow (hosted by Lemon Squeezy)

### Subscription Management
- Upgrade/downgrade plans
- Cancel subscription (continues until period end)
- Reactivate cancelled subscription
- Update payment method
- View billing history

### Webhook Integration
- Real-time subscription status updates
- Handle payment success/failure
- Manage subscription lifecycle events
- Sync subscription data to database

## Implementation Constraints

### Lemon Squeezy Configuration
- Create store in Lemon Squeezy dashboard
- Set up products (Free, Pro, Gym Edition)
- Configure webhook endpoint
- Store API keys securely
- Test in sandbox mode before production

### Security Requirements
- **Verify webhook signatures** to prevent spoofing
- **Never trust client-side plan data** — always verify on server
- **Rate limit checkout endpoints** to prevent abuse
- **Log all payment events** for audit trail
- **Encrypt sensitive data** (customer IDs, payment details)

### Error Handling
- Handle payment failures gracefully
- Provide retry mechanism for failed payments
- Email notifications for payment issues
- Grace period before downgrading (3 days)

### Compliance
- GDPR: Allow users to export billing data
- PCI: Lemon Squeezy handles card storage (PCI Level 1)
- EU VAT: Automatically calculated by Lemon Squeezy
- Terms of Service: Link to TOS during checkout

## Subscription Plans

### Free Tier
```typescript
{
  name: 'Free',
  price: 0,
  interval: null,
  features: [
    '2 training camps unlocked',
    'Basic XP and streaks',
    'Global leaderboard access',
    'Limited to 30 lessons',
  ],
  limits: {
    camps: 2,
    ai_conversations: 0,
    pronunciation_checks: 0,
    offline_mode: false,
  }
}
```

### Pro Tier
```typescript
{
  name: 'Pro',
  price: 6.99,
  interval: 'month',
  lemon_squeezy_variant_id: 'xxxxx',
  features: [
    'All training camps',
    'Offline mode',
    'AI sparring partner (unlimited)',
    'Pronunciation feedback',
    'Priority support',
  ],
  limits: {
    camps: Infinity,
    ai_conversations: Infinity,
    pronunciation_checks: Infinity,
    offline_mode: true,
  }
}
```

### Gym Edition
```typescript
{
  name: 'Gym Edition',
  price: 'custom', // Negotiated per gym
  interval: 'month',
  features: [
    'Bulk licenses (10+ users)',
    'Admin dashboard',
    'Team leaderboards',
    'Custom branding',
    'Dedicated support',
  ]
}
```

## API Endpoints

### GET /api/v1/billing/plans
**Purpose:** Fetch available subscription plans

**Auth:** Required

**Response:**
```typescript
{
  data: {
    id: string;
    name: string;
    price: number;
    interval: 'month' | 'year';
    features: string[];
    lemon_squeezy_variant_id: string;
  }[]
}
```

### POST /api/v1/billing/checkout
**Purpose:** Create checkout session for plan upgrade

**Auth:** Required

**Body:**
```typescript
{
  variant_id: string; // Lemon Squeezy variant ID
}
```

**Response:**
```typescript
{
  data: {
    checkout_url: string; // Redirect user to this URL
  }
}
```

**Logic:**
```typescript
import { createCheckout } from '@lemonsqueezy/lemonsqueezy.js'

const checkout = await createCheckout(
  process.env.LEMON_SQUEEZY_STORE_ID!,
  variantId,
  {
    checkoutData: {
      email: user.email,
      custom: {
        user_id: user.id,
      },
    },
    productOptions: {
      redirectUrl: `${process.env.NEXT_PUBLIC_APP_URL}/billing?success=true`,
    },
  }
)

return { checkout_url: checkout.data.attributes.url }
```

### POST /api/v1/billing/portal
**Purpose:** Generate Lemon Squeezy customer portal URL (for managing subscription)

**Auth:** Required

**Response:**
```typescript
{
  data: {
    portal_url: string;
  }
}
```

**Logic:**
```typescript
import { getCustomerPortalUrl } from '@lemonsqueezy/lemonsqueezy.js'

const { data: subscription } = await supabase
  .from('subscriptions')
  .select('lemon_squeezy_customer_id')
  .eq('user_id', userId)
  .single()

const portalUrl = await getCustomerPortalUrl(subscription.lemon_squeezy_customer_id)

return { portal_url: portalUrl }
```

### POST /api/v1/billing/cancel
**Purpose:** Cancel subscription (continues until period end)

**Auth:** Required

**Response:**
```typescript
{
  data: {
    cancelled_at: string;
    ends_at: string;
  }
}
```

**Logic:**
```typescript
import { cancelSubscription } from '@lemonsqueezy/lemonsqueezy.js'

const { data: subscription } = await supabase
  .from('subscriptions')
  .select('lemon_squeezy_id')
  .eq('user_id', userId)
  .single()

await cancelSubscription(subscription.lemon_squeezy_id)

await supabase
  .from('subscriptions')
  .update({ 
    cancel_at_period_end: true,
    updated_at: new Date().toISOString()
  })
  .eq('user_id', userId)

return { 
  cancelled_at: new Date().toISOString(),
  ends_at: subscription.current_period_end 
}
```

## Webhook Handling

### POST /api/webhooks/lemon-squeezy
**Purpose:** Receive subscription events from Lemon Squeezy

**Auth:** None (verified via signature)

**Webhook Events:**
- `subscription_created` — New subscription started
- `subscription_updated` — Plan changed or payment method updated
- `subscription_cancelled` — Subscription cancelled by user
- `subscription_expired` — Subscription ended (payment failed or cancelled)
- `subscription_payment_success` — Payment received
- `subscription_payment_failed` — Payment failed

**Implementation:**
```typescript
// app/api/webhooks/lemon-squeezy/route.ts

import { headers } from 'next/headers'
import crypto from 'crypto'
import { supabase } from '@/lib/supabase/server'

export async function POST(request: Request) {
  const body = await request.text()
  const signature = headers().get('x-signature')
  
  // 1. Verify webhook signature
  const secret = process.env.LEMON_SQUEEZY_WEBHOOK_SECRET!
  const hmac = crypto.createHmac('sha256', secret)
  const digest = hmac.update(body).digest('hex')
  
  if (signature !== digest) {
    return new Response('Invalid signature', { status: 401 })
  }
  
  // 2. Parse event
  const event = JSON.parse(body)
  const eventName = event.meta.event_name
  const subscriptionData = event.data.attributes
  
  // 3. Extract user_id from custom data
  const userId = event.meta.custom_data?.user_id
  
  if (!userId) {
    console.error('No user_id in webhook event')
    return new Response('Missing user_id', { status: 400 })
  }
  
  // 4. Handle event
  switch (eventName) {
    case 'subscription_created':
      await handleSubscriptionCreated(userId, subscriptionData)
      break
    case 'subscription_updated':
      await handleSubscriptionUpdated(userId, subscriptionData)
      break
    case 'subscription_cancelled':
      await handleSubscriptionCancelled(userId, subscriptionData)
      break
    case 'subscription_expired':
      await handleSubscriptionExpired(userId, subscriptionData)
      break
    case 'subscription_payment_success':
      await handlePaymentSuccess(userId, subscriptionData)
      break
    case 'subscription_payment_failed':
      await handlePaymentFailed(userId, subscriptionData)
      break
    default:
      console.log('Unhandled event:', eventName)
  }
  
  return new Response('OK', { status: 200 })
}

async function handleSubscriptionCreated(userId: string, data: any) {
  await supabase
    .from('subscriptions')
    .upsert({
      user_id: userId,
      plan: mapVariantToPlan(data.variant_id),
      status: 'active',
      lemon_squeezy_id: data.id,
      lemon_squeezy_customer_id: data.customer_id,
      current_period_end: data.renews_at,
      updated_at: new Date().toISOString()
    })
  
  // Send welcome email
  await sendEmail(userId, 'subscription_created')
}

async function handleSubscriptionUpdated(userId: string, data: any) {
  await supabase
    .from('subscriptions')
    .update({
      plan: mapVariantToPlan(data.variant_id),
      status: data.status,
      current_period_end: data.renews_at,
      updated_at: new Date().toISOString()
    })
    .eq('user_id', userId)
}

async function handleSubscriptionCancelled(userId: string, data: any) {
  await supabase
    .from('subscriptions')
    .update({
      status: 'cancelled',
      cancel_at_period_end: true,
      updated_at: new Date().toISOString()
    })
    .eq('user_id', userId)
  
  // Send cancellation email
  await sendEmail(userId, 'subscription_cancelled')
}

async function handleSubscriptionExpired(userId: string, data: any) {
  await supabase
    .from('subscriptions')
    .update({
      plan: 'free',
      status: 'active', // Downgrade to free
      lemon_squeezy_id: null,
      updated_at: new Date().toISOString()
    })
    .eq('user_id', userId)
  
  // Send expiration email
  await sendEmail(userId, 'subscription_expired')
}

async function handlePaymentSuccess(userId: string, data: any) {
  await supabase
    .from('subscriptions')
    .update({
      current_period_end: data.renews_at,
      updated_at: new Date().toISOString()
    })
    .eq('user_id', userId)
  
  // Send payment receipt
  await sendEmail(userId, 'payment_success')
}

async function handlePaymentFailed(userId: string, data: any) {
  await supabase
    .from('subscriptions')
    .update({
      status: 'past_due',
      updated_at: new Date().toISOString()
    })
    .eq('user_id', userId)
  
  // Send payment failed email
  await sendEmail(userId, 'payment_failed')
}

function mapVariantToPlan(variantId: string): string {
  // Map Lemon Squeezy variant IDs to plan names
  const variantMap = {
    '12345': 'pro',
    '67890': 'gym_edition',
  }
  return variantMap[variantId] || 'free'
}
```

## Frontend Components

### BillingPage
```tsx
// app/(dashboard)/billing/page.tsx

import { getSubscription } from '@/lib/supabase/queries'
import { PlanCard } from '@/components/billing/PlanCard'
import { UpgradeButton } from '@/components/billing/UpgradeButton'
import { ManageSubscriptionButton } from '@/components/billing/ManageSubscriptionButton'

export default async function BillingPage() {
  const subscription = await getSubscription()
  
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <h1 className="text-3xl font-bold mb-6">Billing & Subscription</h1>
      
      <PlanCard subscription={subscription} />
      
      {subscription.plan === 'free' && (
        <div className="mt-8">
          <h2 className="text-2xl font-bold mb-4">Upgrade to Pro</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="border rounded-lg p-6">
              <h3 className="text-xl font-bold mb-2">Free</h3>
              <p className="text-3xl font-bold mb-4">$0</p>
              <ul className="space-y-2 text-sm">
                <li>✓ 2 training camps</li>
                <li>✓ Basic XP & streaks</li>
                <li>✓ Global leaderboard</li>
                <li>✗ AI sparring partner</li>
                <li>✗ Offline mode</li>
              </ul>
            </div>
            
            <div className="border-2 border-primary-blue rounded-lg p-6 relative">
              <div className="absolute top-0 right-0 bg-primary-blue text-white px-3 py-1 rounded-bl-lg text-xs">
                Popular
              </div>
              <h3 className="text-xl font-bold mb-2">Pro</h3>
              <p className="text-3xl font-bold mb-4">
                $6.99<span className="text-sm text-gray-600">/month</span>
              </p>
              <ul className="space-y-2 text-sm mb-6">
                <li>✓ All training camps</li>
                <li>✓ AI sparring partner</li>
                <li>✓ Pronunciation feedback</li>
                <li>✓ Offline mode</li>
                <li>✓ Priority support</li>
              </ul>
              <UpgradeButton variantId="12345" />
            </div>
          </div>
        </div>
      )}
      
      {subscription.plan === 'pro' && (
        <div className="mt-8">
          <ManageSubscriptionButton />
        </div>
      )}
    </div>
  )
}
```

### UpgradeButton
```tsx
// components/billing/UpgradeButton.tsx
'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'

export function UpgradeButton({ variantId }: { variantId: string }) {
  const [loading, setLoading] = useState(false)
  
  async function handleUpgrade() {
    setLoading(true)
    
    const response = await fetch('/api/v1/billing/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ variant_id: variantId })
    })
    
    const data = await response.json()
    window.location.href = data.data.checkout_url
  }
  
  return (
    <Button
      onClick={handleUpgrade}
      disabled={loading}
      className="w-full"
    >
      {loading ? 'Redirecting...' : 'Upgrade to Pro'}
    </Button>
  )
}
```

### ManageSubscriptionButton
```tsx
// components/billing/ManageSubscriptionButton.tsx
'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'

export function ManageSubscriptionButton() {
  const [loading, setLoading] = useState(false)
  
  async function handleManage() {
    setLoading(true)
    
    const response = await fetch('/api/v1/billing/portal', {
      method: 'POST'
    })
    
    const data = await response.json()
    window.location.href = data.data.portal_url
  }
  
  return (
    <Button
      onClick={handleManage}
      disabled={loading}
      variant="outline"
    >
      {loading ? 'Loading...' : 'Manage Subscription'}
    </Button>
  )
}
```

## Payment Flow

### Upgrade Flow
```
1. User clicks "Upgrade to Pro" on /billing
2. Frontend calls POST /api/v1/billing/checkout
3. Backend creates Lemon Squeezy checkout session
4. User redirected to Lemon Squeezy checkout page
5. User enters payment details
6. Lemon Squeezy processes payment
7. Webhook sent to /api/webhooks/lemon-squeezy
8. Backend updates subscription status
9. User redirected to /billing?success=true
10. Frontend shows success message
11. User immediately has access to Pro features
```

### Cancellation Flow
```
1. User clicks "Manage Subscription" on /billing
2. Frontend calls POST /api/v1/billing/portal
3. User redirected to Lemon Squeezy customer portal
4. User clicks "Cancel Subscription"
5. Webhook sent to /api/webhooks/lemon-squeezy
6. Backend marks subscription as cancelled (ends at period end)
7. User redirected back to /billing
8. User retains Pro access until period end
9. At period end, webhook sent (subscription_expired)
10. Backend downgrades user to Free plan
```

## Grace Period Handling

### Payment Failed
```
1. Lemon Squeezy attempts to charge card
2. Payment fails (expired card, insufficient funds)
3. Webhook sent: subscription_payment_failed
4. Backend updates status to 'past_due'
5. Email sent to user: "Payment failed, please update payment method"
6. Grace period: 3 days
7. If payment succeeds within 3 days: status → 'active'
8. If payment still fails after 3 days: subscription_expired → downgrade to Free
```

## Testing Checklist

- [ ] Checkout flow works for Pro plan
- [ ] Webhook signature verification works
- [ ] subscription_created event updates database
- [ ] subscription_cancelled event marks subscription
- [ ] subscription_expired event downgrades to Free
- [ ] payment_failed event sends email
- [ ] Customer portal URL generation works
- [ ] User can cancel subscription
- [ ] User retains access until period end after cancellation
- [ ] Grace period logic works correctly

## Security Considerations

### Webhook Security
- **Always verify webhook signatures** before processing
- **Use environment variable for webhook secret**
- **Log all webhook events** for audit trail
- **Return 200 OK even if processing fails** (prevent retry storms)
- **Use idempotency** — handle duplicate webhook deliveries

### Payment Data
- **Never store card details** — Lemon Squeezy handles PCI compliance
- **Never trust client-side plan data** — always verify subscription status server-side
- **Encrypt subscription IDs** when storing in database (optional)

### Rate Limiting
- **Rate limit checkout endpoint** — 5 attempts per hour per user
- **Rate limit webhook endpoint** — 100 requests per minute (prevent abuse)

## Email Notifications

### Transactional Emails

**subscription_created:**
```
Subject: Welcome to ThaiFightTalk Pro! 🥋
Body: 
  Hi [Name],
  
  Your Pro subscription is now active! You now have access to:
  - All training camps
  - AI sparring partner
  - Pronunciation feedback
  - Offline mode
  
  Start training: [Link to dashboard]
  
  Questions? Reply to this email.
```

**payment_failed:**
```
Subject: Payment Failed - Action Required
Body:
  Hi [Name],
  
  We couldn't process your payment for ThaiFightTalk Pro.
  
  Update your payment method: [Link to customer portal]
  
  Your subscription will be cancelled if we don't receive payment within 3 days.
```

**subscription_cancelled:**
```
Subject: Subscription Cancelled
Body:
  Hi [Name],
  
  Your Pro subscription has been cancelled. You'll retain access until [End Date].
  
  We'd love to have you back! Reactivate anytime: [Link to billing page]
```

## Future Enhancements (V1.5+)

- Annual billing (discounted)
- Lifetime access option
- Team plans (gyms)
- Referral discounts
- Coupon codes
- Usage-based pricing (AI conversations)

---

**References:**
- Lemon Squeezy Docs: https://docs.lemonsqueezy.com
- Lemon Squeezy JS SDK: https://github.com/lmsqueezy/lemonsqueezy.js
- Webhook Best Practices: https://docs.lemonsqueezy.com/help/webhooks

