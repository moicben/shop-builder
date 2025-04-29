import { exec, spawn } from 'child_process';
import spawnNpm from 'spawn-npm';
import path from 'path';

export function execCommand(command, options = {}) {
    // Log the command and the working directory used
    console.log(`Running command: "${command}" in cwd: "${options.cwd || process.cwd()}"`);
    
    // Merge environment variables
    options.env = { ...process.env, ...options.env };

    return new Promise((resolve, reject) => {
        if (command.startsWith("npm")) {
            // Extraction des arguments pour npm (ex: "npm run build" => ["run", "build"])
            const args = command.split(" ").slice(1);
            console.log(`npm args: [${args.join(', ')}] with cwd: "${options.cwd}"`);
            
            if (process.platform === 'win32') {
                // Sous Windows, utiliser spawn-npm pour résoudre npm.cmd
                spawnNpm(args, options, (error) => {
                    if (error) {
                        console.error(`Error executing command: "${command}" in cwd: "${options.cwd}"`, error);
                        return reject(error);
                    }
                    console.log(`Command executed: "${command}"`);
                    resolve();
                });
            } else {
                // Sur Linux, utiliser spawn natif
                const child = spawn('npm', args, { stdio: options.stdio || 'inherit', ...options });
                child.on('error', (error) => {
                    console.error(`Error executing command: "${command}" in cwd: "${options.cwd}"`, error);
                    return reject(error);
                });
                child.on('close', (code) => {
                    if (code !== 0) {
                        console.error(`Command "${command}" exited with code ${code}`);
                        return reject(new Error(`Command failed with code ${code}`));
                    }
                    console.log(`Command executed: "${command}"`);
                    resolve();
                });
            }
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