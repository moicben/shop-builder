import { spawn } from 'child_process';

export function execCommand(command, options = {}) {
    return new Promise((resolve, reject) => {
        // Sépare la commande et ses arguments
        const args = command.split(' ');
        const cmd = args.shift();
        const child = spawn(cmd, args, { stdio: 'inherit', ...options });

        child.on('error', (error) => {
            console.error(`Error executing command: ${command}`, error);
            reject(error);
        });

        child.on('close', (code) => {
            if (code !== 0) {
                console.error(`Error executing command: ${command} (code ${code})`);
                return reject(new Error(`Command failed with code ${code}`));
            }
            resolve();
        });
    });
}