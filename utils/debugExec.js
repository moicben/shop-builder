import spawnNpm from 'spawn-npm';

// Commande à tester : "npm --version"
const args = ['--version'];
const options = { stdio: 'inherit' };

spawnNpm(args, options, (error) => {
    if (error) {
        console.error("Erreur lors de l'exécution de spawn-npm:", error);
    } else {
        console.log("spawn-npm exécuté avec succès");
    }
});