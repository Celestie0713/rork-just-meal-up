# Wire up real Stripe payments

## Features
- Real Stripe payment processing instead of the current simulated timer
- Users pay with card, Apple Pay, or Google Pay through Stripe's native PaymentSheet
- All cards are securely tokenized by Stripe — the app never sees raw card numbers
- Payment flow: choose a tip → PaymentSheet opens → user completes payment → invitation is sent

## Design
- **PaymentSheet** — Stripe's own native UI that slides up from the bottom. Clean dark-themed card input, Apple Pay button (iOS), Google Pay button (Android). Handles all validation, error states, 3D Secure, and card brand detection automatically
- The existing success screen (green checkmark + "Payment Successful") remains as an overlay after PaymentSheet confirms payment
- No visual changes to the existing custom modal — it's completely replaced by PaymentSheet

## What needs to happen
1. **Set up environment variables** — Add the Stripe publishable key (client-safe) and secret key (backend-only) as project environment variables
2. **Create a backend endpoint** — A new API endpoint that creates a Stripe PaymentIntent for a given amount and returns the client secret needed by PaymentSheet
3. **Wrap the app with StripeProvider** — The root layout needs Stripe's context so PaymentSheet works from any screen
4. **Replace the mock payment with PaymentSheet** — When the user taps "Pay $X", instead of the mocked timer, call the backend for a client secret and launch PaymentSheet
5. **Handle success/cancellation** — On successful payment, proceed exactly as before (create invitation, post system message, navigate to chat). If the user cancels, nothing happens