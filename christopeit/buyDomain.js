import dotenv from "dotenv";
dotenv.config();

export async function buyDomain(shop, vercelDnsInfo) {
  const godaddyApiKey = process.env.GODADDY_KEY;
  const godaddyApiSecret = process.env.GODADDY_SECRET;
  if (!godaddyApiKey || !godaddyApiSecret) {
    throw new Error("Les variables GODADDY_KEY et GODADDY_SECRET doivent être définies dans l'environnement.");
  }
  
  // Forcer l'extension .shop si nécessaire
  let domain = shop.domain;
  if (!domain.endsWith(".shop")) {
    domain = domain.replace(/\.com$/, ".shop");
  }
  
  const now = new Date().toISOString();
  
  // Construction du payload incluant une section pour le paiement
  const purchasePayload = {
    consent: {
      agreementKeys: [
        "DNRA"
      ],
      agreedBy: "Carbone Development",
      agreedAt: now
    },
    contactAdmin: {
      addressMailing: {
        address1: "123 Main St",
        address2: "",
        city: "City",
        country: "US",
        postalCode: "00000",
        state: "CA", // Replace with a valid state code
      },
      email: "admin@example.com",
      fax: "+1.4805058877", // numéro valide
      jobTitle: "Manager",
      nameFirst: "John",
      nameLast: "Doe",
      nameMiddle: "",
      organization: "MyCompany",
      phone: "+1.4805058877"
    },
    contactBilling: {},      // Sera assigné plus bas
    contactRegistrant: {},   // Sera assigné plus bas
    contactTech: {},         // Sera assigné plus bas
    domain: domain,
    // Pour nameServers, on utilise vercelDnsInfo.cname si défini, sinon une valeur par défaut
    nameServers: [vercelDnsInfo.cname || "ns1.godaddy.com"],
    period: 1,
    privacy: false,
    renewAuto: true,
  };
  
  // Affectation des mêmes informations pour tous les contacts
  purchasePayload.contactBilling = { ...purchasePayload.contactAdmin };
  purchasePayload.contactRegistrant = { ...purchasePayload.contactAdmin };
  purchasePayload.contactTech = { ...purchasePayload.contactAdmin };

  console.log("Payload d'achat de domaine:", purchasePayload);

  // Appel à l'API GoDaddy pour acheter le domaine
  const purchaseResponse = await fetch(`https://api.godaddy.com/v1/domains/purchase`, {
    method: "POST",
    headers: {
      "Authorization": `sso-key ${godaddyApiKey}:${godaddyApiSecret}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(purchasePayload)
  });
  
  const purchaseResult = await purchaseResponse.json();

  if (!purchaseResponse.ok) {
      const errorCode = purchaseResult.code ? ` (Code: ${purchaseResult.code})` : "";
      throw new Error(JSON.stringify({
        message: `Erreur lors de l'achat du domaine ${domain}`,
        code: purchaseResult.code || null,
        details: purchaseResult.message || null,
        statusText: purchaseResponse.statusText,
        status: purchaseResponse.status,
        fields: purchaseResult.fields || null,
      }, null, 2));
  }
  console.log(`Domaine ${domain} acheté avec succès.`);
  
  // Configuration des enregistrements DNS pour connecter le domaine à Vercel
  const dnsRecordsPayload = [
    {
      type: "CNAME",
      name: "@",
      data: vercelDnsInfo.cname,
      ttl: 600
    },
    {
      type: "CNAME",
      name: "www",
      data: vercelDnsInfo.cname,
      ttl: 600
    }
  ];
  
  const dnsResponse = await fetch(`https://api.godaddy.com/v1/domains/${domain}/records`, {
    method: "PUT",
    headers: {
      "Authorization": `sso-key ${godaddyApiKey}:${godaddyApiSecret}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(dnsRecordsPayload)
  });
  if (!dnsResponse.ok) {
    const dnsResult = await dnsResponse.json();
    throw new Error(`Erreur lors de la mise à jour des DNS pour ${domain}: ${dnsResult.message || dnsResponse.statusText}`);
  }
  console.log(`Enregistrements DNS mis à jour pour le domaine ${domain}.`);
  
  return {
    domain,
    dnsRecords: dnsRecordsPayload
  };
}


const shop = {
  domain: "christopeit-usa.shop"
};
const vercelDnsInfo = {
  cname: "cname.vercel-dns.com"
};
buyDomain(shop, vercelDnsInfo)
  .then(result => console.log("Résultat de l'achat et de la configuration du domaine:", result))
  .catch(error => console.error("Erreur:", error));
