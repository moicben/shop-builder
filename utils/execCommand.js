import { exec } from 'child_process';
import spawnNpm from 'spawn-npm';
import path from 'path';

export function execCommand(command, options = {}) {
    // Log the command and the working directory used
    console.log(`Running command: "${command}" in cwd: "${options.cwd || process.cwd()}"`);
    
    // Merge the environment variables if not already passed
    options.env = { ...process.env, ...options.env };

    return new Promise((resolve, reject) => {
        if (command.startsWith("npm")) {
            // Extraction des arguments pour npm (ex: "npm run build" => ["run", "build"])
            const args = command.split(" ").slice(1);
            // Log the arguments and cwd before spawning
            console.log(`spawn-npm args: [${args.join(', ')}] with cwd: "${options.cwd}"`);
            // spawn-npm gère la résolution de l'exécutable sur Windows
            spawnNpm(args, options, (error) => {
                if (error) {
                    console.error(`Error executing command: "${command}" in cwd: "${options.cwd}"`, error);
                    return reject(error);
                }
                console.log(`Command executed: "${command}"`);
                resolve();
            });
        } else {
            // Pour les autres commandes, on utilise la commande classique via exec
            exec(command, options, (error, stdout, stderr) => {
                if (error) {
                    console.error(`Error executing command: "${command}" in cwd: "${options.cwd}"`, error);
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