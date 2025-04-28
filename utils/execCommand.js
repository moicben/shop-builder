import { execSync } from 'child_process';

export async function execCommand(command, options = {}) {
    //console.log(`Executing: ${command}`);
    try {
        execSync(command, { stdio: 'inherit', ...options });
    } catch (error) {
        console.error(`Error executing command: ${command}`);
        process.exit(1);
    }
}