import { google } from 'googleapis';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

dotenv.config();

const { GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REDIRECT_URI, GOOGLE_REFRESH_TOKEN_WEBMASTER, GOOGLE_REFRESH_TOKEN_VERIFICATION} = process.env;

console.log('Initializing OAuth2 client...');
console.log('REFRESH TOKEN_VERIFICATION:', GOOGLE_REFRESH_TOKEN_WEBMASTER);


//https://www.googleapis.com/auth/webmasters
const oauth2Websmaster = new google.auth.OAuth2(
  GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET,
  GOOGLE_REDIRECT_URI
);


//https://www.googleapis.com/auth/siteverification
const oauth2Verify = new google.auth.OAuth2(
  GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET,
  GOOGLE_REDIRECT_URI
); 



oauth2Websmaster.setCredentials({ refresh_token: GOOGLE_REFRESH_TOKEN_WEBMASTER });
oauth2Verify.setCredentials({ refresh_token: GOOGLE_REFRESH_TOKEN_VERIFICATION });


const webmasters = google.webmasters({
  version: 'v3',
  auth: oauth2Websmaster
});

const siteVerification = google.siteVerification({
  version: 'v1',
  auth: oauth2Verify
});

async function verifySite(siteUrl) {
  try {
    console.log(`Requesting site verification token for: ${siteUrl}`);
    const res = await siteVerification.webResource.getToken({
      requestBody: {
        site: {
          type: 'INET_DOMAIN',
          identifier: siteUrl
        },
        verificationMethod: 'FILE'
      }
    });

    const token = res.data.token;
    console.log(`Verification token received: ${token}`);

    // Save the token file to the root directory of your site
    const tokenFilePath = path.join(__dirname, 'public', token);
    fs.writeFileSync(tokenFilePath, 'google-site-verification: ' + token);
    console.log(`Verification token file saved to: ${tokenFilePath}`);

    console.log(`Verifying site ownership for: ${siteUrl}`);
    await siteVerification.webResource.insert({
      requestBody: {
        site: {
          type: 'INET_DOMAIN',
          identifier: siteUrl
        },
        verificationMethod: 'FILE'
      }
    });
    console.log(`Site ownership verified: ${siteUrl}`);
  } catch (error) {
    console.error('Error verifying site ownership:', error.message);
    console.error(error);
  }
}

export async function indexShop(domain) {

  const siteUrl = `https://${domain}`;
  const sitemapUrl = `${siteUrl}/sitemap.xml`;

  try {
    console.log(`Adding site to Google Search Console: ${siteUrl}`);
    // Ajouter le site à Google Search Console
    await webmasters.sites.add({ siteUrl });
    console.log(`Site added to Google Search Console: ${siteUrl}`);

    // Vérifier la propriété du site
    await verifySite(siteUrl);

    console.log(`Submitting sitemap: ${sitemapUrl}`);
    // Envoyer le sitemap à Google Search Console
    await webmasters.sitemaps.submit({
      siteUrl,
      feedpath: sitemapUrl
    });
    console.log(`Sitemap submitted: ${sitemapUrl}`);
  } catch (error) {
    console.error('Error adding site or submitting sitemap:', error.message);
    console.error(error);
  }
}



