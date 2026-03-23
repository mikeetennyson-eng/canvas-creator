# Razorpay Integration Setup Guide

This guide explains how to integrate Razorpay payments into the Canvas Creator subscription system.

## Prerequisites

You need a Razorpay business account. If you don't have one, sign up at [https://razorpay.com](https://razorpay.com)

## Step 1: Get Your Razorpay Credentials

1. Log in to your Razorpay Dashboard at https://dashboard.razorpay.com
2. Navigate to **Settings > API Keys**
3. You'll find two keys:
   - **Key ID** (public key)
   - **Key Secret** (private/secret key)

⚠️ **Important**: Keep your Key Secret confidential. Never commit it to version control or expose it in client-side code.

## Step 2: Configure Environment Variables

### For Development:

Update your `.env` file with your Razorpay credentials:

```env
# Razorpay Configuration
VITE_RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxx
RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxx
RAZORPAY_KEY_SECRET=xxxxxxxxxxx
```

### For Production (Vercel):

Add these environment variables to your Vercel project settings:

1. Go to your Vercel project dashboard
2. Navigate to **Settings > Environment Variables**
3. Add the following variables:
   - `VITE_RAZORPAY_KEY_ID` = Your live Razorpay Key ID
   - `RAZORPAY_KEY_ID` = Your live Razorpay Key ID
   - `RAZORPAY_KEY_SECRET` = Your live Razorpay Key Secret

## Step 3: How It Works

### Payment Flow

1. **User clicks "Upgrade Now"** on the Pricing page
2. **Frontend creates an order** via `/api/subscription/create-order`
3. **Backend creates Razorpay order** and returns order ID
4. **Razorpay checkout opens** in a modal
5. **User completes payment** within Razorpay
6. **Payment verified** via `/api/subscription/verify-payment`
7. **Signature verified** using backend secret key
8. **Subscription updated** to professional plan
9. **User redirected** to profile page

### Key Endpoints

- **POST `/api/subscription/create-order`**
  - Creates a new Razorpay order
  - Returns: `{ orderId, amount, currency }`

- **POST `/api/subscription/verify-payment`**
  - Verifies payment signature
  - Upgrades subscription if verification succeeds
  - Body: `{ orderId, paymentId, signature }`

## Step 4: Testing

### Test Card Numbers

Use these test card numbers in development mode to test payments:

**Success Scenario:**
- Card Number: 4111111111111111
- Expiry: Any future date (e.g., 12/25)
- CVV: Any 3-digit number (e.g., 123)

**Failure Scenario:**
- Card Number: 4222222222222220
- Expiry: Any future date
- CVV: Any 3-digit number

### Test Payment ID Format

When testing, Razorpay will provide test payment IDs starting with `pay_` prefix and 14 alpha-numeric characters, e.g., `pay_1Aa00000000001`

## Step 5: Verify Implementation

1. Start development server: `npm run dev`
2. Navigate to the Pricing page
3. Click "Upgrade Now" button (only visible if on free plan)
4. Test with Razorpay test credentials
5. Use test card numbers provided above
6. Verify that subscription updates after payment

## Backend Implementation Details

### Razorpay Service (`api/config/razorpay.ts`)

The service provides three main functions:

```typescript
// Create an order
createRazorpayOrder(amount: number, userId: string)

// Verify payment signature (HMAC SHA256)
verifyPaymentSignature(orderId, paymentId, signature)

// Fetch payment details from Razorpay API
getPaymentDetails(paymentId)
```

### Payment Verification Flow

1. Frontend sends `orderId`, `paymentId`, and `signature` to backend
2. Backend reconstructs the message: `${orderId}|${paymentId}`
3. Creates HMAC SHA256 hash using the Key Secret
4. Compares with the signature sent by frontend
5. If matches, payment is legitimate

## Frontend Implementation

The `PricingPage.tsx` component:

1. Loads Razorpay script dynamically
2. Creates order via API
3. Opens Razorpay checkout modal
4. Handles payment response
5. Verifies signature via API
6. Updates subscription context
7. Redirects to profile

## Troubleshooting

### "Razorpay script not loaded"
- Check if VITE_RAZORPAY_KEY_ID is configured
- Verify network requests to checkout.razorpay.com are not blocked

### "Missing required payment details"
- The payment verification endpoint requires all three: orderId, paymentId, signature
- Check DevTools Network tab to see response from Razorpay

### "Invalid payment signature"
- Verify that RAZORPAY_KEY_SECRET is correctly set
- Double-check no whitespace is included in environment variables

### Payment not updating subscription
- Check browser console and Vercel logs for errors
- Verify database connection and subscription model
- Ensure userId is correctly passed to backend

## Security Best Practices

1. ✅ Keep Key Secret in backend environment variables only
2. ✅ Always verify payment signature before updating subscription
3. ✅ Never store full card details in database
4. ✅ Use HTTPS for all API communications
5. ✅ Implement proper error handling and logging
6. ✅ Set up webhook handlers for payment notifications (optional)

## Going Live

When switching from test to production:

1. Generate new live Key ID and Key Secret from Razorpay dashboard
2. Update environment variables in Vercel
3. Redeploy your application
4. Test payment flow thoroughly with actual payment
5. Razorpay will charge the account, but you can refund through dashboard if needed

## Additional Resources

- [Razorpay Documentation](https://razorpay.com/docs/)
- [Razorpay Payment Gateway API](https://razorpay.com/docs/payments/payment-gateway/)
- [Razorpay Orders API](https://razorpay.com/docs/orders/)
- [Payment Gateway Integration Guide](https://razorpay.com/docs/payments/integration-guide/)

## Support

For issues related to:
- **Razorpay Integration**: Check Razorpay documentation
- **Canvas Creator**: Contact development team
- **Support Issues**: Check GitHub issues or contact maintainers
