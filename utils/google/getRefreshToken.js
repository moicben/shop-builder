import { google } from 'googleapis';
import dotenv from 'dotenv';

dotenv.config();

const { GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REDIRECT_URI, GOOGLE_REFRESH_WEBMASTER } = process.env;

//console.log("REFRESH_TOKEN : ", GOOGLE_REFRESH_WEBMASTER);

const oauth2Client = new google.auth.OAuth2(
  GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET,
  GOOGLE_REDIRECT_URI
);

// Définir automatiquement le refresh token
oauth2Client.setCredentials({
  refresh_token: GOOGLE_REFRESH_WEBMASTER,
});

/**
 * Récupère automatiquement un nouveau access token grâce au refresh token.
 * @returns {Promise<string>} Le nouvel access token.
 */
export async function getAccessToken() {
  try {
    const { token } = await oauth2Client.getAccessToken();
    //console.log("Updated Access Token:", token);
    return token;
  } catch (err) {
    console.error("Error refreshing access token", err);
    throw err;
  }
}

// Appel de la fonction pour obtenir et afficher le nouveau token
//getAccessToken();