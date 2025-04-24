export function chooseRandomProxy(proxies) {
    if (!Array.isArray(proxies) || proxies.length === 0) {
        throw new Error('La liste de proxys est vide ou invalide.');
    }
    const randomIndex = Math.floor(Math.random() * proxies.length);
    return proxies[randomIndex];
}