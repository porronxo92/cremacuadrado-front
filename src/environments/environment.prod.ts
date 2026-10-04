export const environment = {
  production: true,
  // Public origin of this site: used for canonical/OG URLs, JSON-LD and the
  // sitemap. Today production is served from prd.cremacuadrado.com while the
  // legacy WooCommerce shop still owns cremacuadrado.com.
  // CUTOVER: set siteUrl to 'https://cremacuadrado.com' and allowIndexing to
  // true in the same PR that moves the domain to this project.
  siteUrl: 'https://prd.cremacuadrado.com',
  // false → the server sends `X-Robots-Tag: noindex, nofollow` even on the
  // production deployment (see server.ts).
  allowIndexing: false,
  // Absolute so each environment (this one, environment.staging.ts) talks to
  // its own backend directly; a relative URL + a fixed rewrite in vercel.json
  // could only ever point at one backend. Requires the backend's CORS_ORIGINS
  // to include this site's origin (allow_credentials is on).
  apiUrl: 'https://api.cremacuadrado.com/api/v1',
  // Same value as apiUrl: an absolute URL resolves from Node too, so SSR
  // doesn't need to rewrite anything (see server-api-url.interceptor.ts).
  serverApiUrl: 'https://api.cremacuadrado.com/api/v1',
  mediaUrl: '',
  siteName: 'CremaCuadrado',
  siteDescription: 'Cremas de pistacho artesanales de La Mancha',
  stripePublishableKey: 'pk_test_51POchb09uLgLqkCFajhnuOff2EjdXrZWqm8fVEiOUE7xT109Dywxg0SdrlMAyJIJ0Ns3Opm5weJ9BaiCyB2pHSMa002AuMIHly',  // Fill with your pk_live_... from Stripe Dashboard
  googleClientId: '295611820895-lufk6h45v7b3afsq9j2bntui4459lu59.apps.googleusercontent.com',  // Fill with your Google OAuth 2.0 Client ID for production domain
  // Número de WhatsApp de contacto, en formato internacional sin '+' ni espacios (ej. 34623924886)
  whatsappPhoneNumber: '34623924886',
};
