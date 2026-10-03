export const environment = {
  production: true,
  apiUrl: '/api/v1',
  // Absolute backend URL used only when rendering on the server (SSR) — a
  // relative apiUrl can't be resolved from Node, it only works in-browser
  // via the Vercel rewrite in vercel.json (SSR-01). Update this if/when the
  // backend moves off Vercel (e.g. to Hostinger) — not verifiable from this
  // repo alone.
  serverApiUrl: 'https://cremacuadrado-back.vercel.app/api/v1',
  mediaUrl: '',
  siteName: 'CremaCuadrado',
  siteDescription: 'Cremas de pistacho artesanales de La Mancha',
  stripePublishableKey: 'pk_test_51POchb09uLgLqkCFajhnuOff2EjdXrZWqm8fVEiOUE7xT109Dywxg0SdrlMAyJIJ0Ns3Opm5weJ9BaiCyB2pHSMa002AuMIHly',  // Fill with your pk_live_... from Stripe Dashboard
  googleClientId: '295611820895-lufk6h45v7b3afsq9j2bntui4459lu59.apps.googleusercontent.com',  // Fill with your Google OAuth 2.0 Client ID for production domain
  // Número de WhatsApp de contacto, en formato internacional sin '+' ni espacios (ej. 34623924886)
  whatsappPhoneNumber: '34623924886',
};
