import spawnNpm from 'spawn-npm';

console.log("Début du test spawn-npm...");

const args = ['npm --version'];
const options = { stdio: 'inherit' };

spawnNpm(args, options, (error) => {
    if (error) {
        console.error("Erreur lors de l'exécution de spawn-npm:", error);
    } else {
        console.log("spawn-npm exécuté avec succès");
    }
    console.log("Fin du callback spawnNpm.");
});