// Preview / staging (rama `staging` en Vercel). Idéntico a environment.prod.ts
// salvo por el backend: apunta al API de staging (BBDD, Stripe test y correos
// de pruebas). Se selecciona en el build mediante scripts/build-vercel.mjs.
export const environment = {
  production: true,
  apiUrl: 'https://api-stg.cremacuadrado.com/api/v1',
  // Idéntico a apiUrl: al ser absoluta, el SSR no necesita reescribirla.
  serverApiUrl: 'https://api-stg.cremacuadrado.com/api/v1',
  mediaUrl: '',
  siteName: 'CremaCuadrado',
  siteDescription: 'Cremas de pistacho artesanales de La Mancha',
  stripePublishableKey: 'pk_test_51POchb09uLgLqkCFajhnuOff2EjdXrZWqm8fVEiOUE7xT109Dywxg0SdrlMAyJIJ0Ns3Opm5weJ9BaiCyB2pHSMa002AuMIHly',
  googleClientId: '295611820895-lufk6h45v7b3afsq9j2bntui4459lu59.apps.googleusercontent.com',
  // Número de WhatsApp de contacto, en formato internacional sin '+' ni espacios (ej. 34623924886)
  whatsappPhoneNumber: '34623924886',
};
