import { exec } from 'child_process';
import spawnNpm from 'spawn-npm';

export function execCommand(command, options = {}) {
    return new Promise((resolve, reject) => {
        if (command.startsWith("npm")) {
            // Extraction des arguments pour npm (ex: "npm run build" => ["run", "build"])
            const args = command.split(" ").slice(1);
            // spawn-npm gère la résolution de l'exécutable sur Windows
            spawnNpm(args, options, (error) => {
                if (error) {
                    console.error(`Error executing command: ${command}`, error);
                    return reject(error);
                }
                resolve();
            });
        } else {
            // Pour les autres commandes, on utilise la commande classique via exec
            exec(command, options, (error, stdout, stderr) => {
                if (error) {
                    console.error(`Error executing command: ${command}`, error);
                    return reject(error);
                }
                if (stdout) {
                    console.log(stdout);
                }
                if (stderr) {
                    console.error(stderr);
                }
                resolve();
            });
        }
    });
}