/**
 * Single source of truth for the backend address.
 *
 * Points at the project's `functions/` Cloudflare Worker (Stripe checkout,
 * groups API). Never assemble this URL from parts — it is copied as printed
 * by the deploy command.
 */
const BACKEND_URL: string =
  (typeof process !== 'undefined' &&
    (process.env as Record<string, string | undefined>).EXPO_PUBLIC_RORK_FUNCTIONS_URL) ||
  '';

export { BACKEND_URL };
