import axios from 'axios';
import { google } from 'googleapis';
import dotenv from 'dotenv';

dotenv.config();

const { GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REDIRECT_URI, GOOGLE_REFRESH_TOKEN_WEBMASTER } = process.env;
const SCOPES = ['https://www.googleapis.com/auth/webmasters'];

// Création du client OAuth2 pour Search Console
const oauth2Client = new google.auth.OAuth2(
  GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET,
  GOOGLE_REDIRECT_URI
);

oauth2Client.setCredentials({ refresh_token: GOOGLE_REFRESH_TOKEN_WEBMASTER });

const webmasters = google.webmasters({
  version: 'v3',
  auth: oauth2Client
});

async function addSite() {
  // Remplacez par l'URL complète de votre site (inclure le protocole)
  const siteUrl = 'https://test6.christopeit.fr';
  
  console.log('OAuth2 client initialized. Obtaining access token...');
  
  try {

    console.log(`Adding site to Google Search Console: ${siteUrl}`);
    // Ajouter le site à Google Search Console
    await webmasters.sites.add({ siteUrl });
    console.log(`Site added to Google Search Console: ${siteUrl}`);

    
  } catch (error) {
    console.error('Erreur lors de la récupération de l\'access token :', error.response ? error.response.data : error.message);
  }
}

addSite();