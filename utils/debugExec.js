import { spawn } from 'child_process';

console.log("Test avec spawn natif...");

const child = spawn('npm', ['--version'], { stdio: 'inherit' });

child.on('error', (error) => {
    console.error("Erreur avec spawn natif:", error);
});

child.on('close', (code) => {
    console.log(`Processus terminé avec le code ${code}`);
});