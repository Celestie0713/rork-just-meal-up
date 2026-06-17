# Wire up real Stripe payments

## Features
- Real Stripe payment processing instead of the current simulated timer
- Users pay with card, Apple Pay, or Google Pay through Stripe's native PaymentSheet
- All cards are securely tokenized by Stripe — the app never sees raw card numbers
- Payment flow: choose a tip → PaymentSheet opens → user completes payment → invitation is sent

## Design
- **Stripe Checkout (web-based)** — Opens Stripe's hosted checkout via expo-web-browser (native) or popup window (web). Pay with card, Apple Pay, Google Pay, or Link. Stripe handles all validation, error states, and 3D Secure
- The custom modal shows the amount and a "Pay" button that launches Stripe. After payment, an orange-checkmark success screen is shown
- No native PaymentSheet needed — the checkout is entirely web-based and works in the cloud simulator

## What needs to happen
1. [x] **Set up environment variables** — Add the Stripe publishable key (client-safe) and secret key (backend-only) as project environment variables
2. [x] **Create a backend endpoint** — A new API endpoint that creates a Stripe PaymentIntent for a given amount and returns the client secret needed by PaymentSheet
3. [x] **StripeProviderWrapper (passthrough)** — No native Stripe provider needed; payment uses web-based Stripe Checkout via expo-web-browser
4. [x] **Replace the mock payment with Stripe Checkout** — When the user taps "Pay $X", call the backend to create a checkout session, then open Stripe's hosted page
5. [x] **Handle success/cancellation** — On successful payment, proceed exactly as before (create invitation, post system message, navigate to chat). If the user cancels, nothing happens
