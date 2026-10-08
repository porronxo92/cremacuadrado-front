export const environment = {
  production: false,
  siteUrl: 'http://localhost:4200',
  allowIndexing: false,
  apiUrl: 'http://localhost:8000/api/v1',
  // Used instead of apiUrl when rendering on the server (SSR). In dev apiUrl
  // is already absolute, so this is identical — only environment.prod.ts
  // differs, where apiUrl is relative and relies on a Vercel rewrite that
  // only exists for in-browser requests.
  serverApiUrl: 'http://localhost:8000/api/v1',
  mediaUrl: 'http://localhost:8000',
  siteName: 'CremaCuadrado',
  siteDescription: 'Cremas de pistacho artesanales de La Mancha',
  stripePublishableKey: 'pk_test_51POchb09uLgLqkCFajhnuOff2EjdXrZWqm8fVEiOUE7xT109Dywxg0SdrlMAyJIJ0Ns3Opm5weJ9BaiCyB2pHSMa002AuMIHly',
  // Google OAuth: set your OAuth 2.0 Client ID from console.cloud.google.com
  // Authorized origins: http://localhost:4200 (dev) + your production domain
  googleClientId: '295611820895-lufk6h45v7b3afsq9j2bntui4459lu59.apps.googleusercontent.com',  // e.g. '123456789-abc.apps.googleusercontent.com'
  // Número de WhatsApp de contacto, en formato internacional sin '+' ni espacios (ej. 34623924886)
  whatsappPhoneNumber: '34623924886',
  // Clave pública de CARTO Basemaps (ver environment.prod.ts).
  cartoApiKey: 'cb1_4eez_1_f3e91d736a66662fab05a3b1',
};

