/**
 * Définit la liste des boutiques à créer.
 * @returns {Object[]} - Liste des boutiques avec leurs informations.
 */
export async function newShops() {
  console.log("Étape 1 : Liste des nouvelles boutiques à créer :");

  const shops = [
    { language: "US2", currency: "€", country: "United States2", address: "1600 Pennsylvania Ave NW, Washington, DC, USA" },
    // { language: "DE", currency: "€", country: "Germany", address: "Pariser Platz, 10117 Berlin, Germany" },
    // { language: "IT", currency: "€", country: "Italy", address: "Piazza Venezia, 00186 Rome, Italy" },
    // { language: "ES", currency: "€", country: "Spain", address: "Plaza Mayor, 28012 Madrid, Spain" },
    // { language: "NL", currency: "€", country: "Netherlands", address: "Dam Square, 1012 NP Amsterdam, Netherlands" },
    // { language: "SE", currency: "€", country: "Sweden", address: "Sergels torg, 111 57 Stockholm, Sweden" },
    // { language: "NO", currency: "€", country: "Norway", address: "Karl Johans gate, 0154 Oslo, Norway" },
    // { language: "DK", currency: "€", country: "Denmark", address: "Rådhuspladsen, 1550 Copenhagen, Denmark" },
    // { language: "FI", currency: "€", country: "Finland", address: "Mannerheimintie, 00100 Helsinki, Finland" },
    // { language: "PT", currency: "€", country: "Portugal", address: "Praça do Comércio, 1100-148 Lisbon, Portugal" },
    // { language: "BE", currency: "€", country: "Belgium", address: "Grand Place, 1000 Brussels, Belgium" },
    // { language: "AT", currency: "€", country: "Austria", address: "Stephansplatz, 1010 Vienna, Austria" },
    // { language: "IE", currency: "€", country: "Ireland", address: "O'Connell Street, Dublin, Ireland" },
    // { language: "GR", currency: "€", country: "Greece", address: "Syntagma Square, Athens, Greece" },
    // { language: "HU", currency: "€", country: "Hungary", address: "Heroes' Square, Budapest, Hungary" },
    // { language: "CZ", currency: "€", country: "Czech Republic", address: "Old Town Square, Prague, Czech Republic" },
    // { language: "SK", currency: "€", country: "Slovakia", address: "Bratislava Castle, Bratislava, Slovakia" },
    // { language: "RO", currency: "€", country: "Romania", address: "Palace of Parliament, Bucharest, Romania" },
    // { language: "BG", currency: "€", country: "Bulgaria", address: "Alexander Nevsky Cathedral, Sofia, Bulgaria" },
    // { language: "HR", currency: "€", country: "Croatia", address: "Ban Jelačić Square, Zagreb, Croatia" },
    // { language: "SI", currency: "€", country: "Slovenia", address: "Prešeren Square, Ljubljana, Slovenia" },
    // { language: "LV", currency: "€", country: "Latvia", address: "Riga Cathedral, Riga, Latvia" },
    // { language: "LT", currency: "€", country: "Lithuania", address: "Vilnius Cathedral, Vilnius, Lithuania" },
    // { language: "EE", currency: "€", country: "Estonia", address: "Tallinn Old Town, Tallinn, Estonia" }, 
  ].map(shop => ({
    name: `Christopeit ${shop.language}`,
    domain: `${shop.language}.christopeit-sport.shop`,
    language: shop.language,
    currency: shop.currency,
    country: shop.country,
    address: shop.address,
    phone: "+44 7446 162 797",
  }));

  console.log("Boutiques définies :", shops);
  return shops;
}