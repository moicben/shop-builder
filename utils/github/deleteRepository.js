import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

export async function deleteRepository(repoName) {
    const token = process.env.GITHUB_TOKEN; // Ensure this is set in your environment variables
    if (!token) {
        console.error("GITHUB_TOKEN is not set in your environment.");
        process.exit(1);
    }
    
    const url = `https://api.github.com/repos/moicben/${repoName}`;
    
    try {
        const response = await axios.delete(url, {
            headers: {
                "Authorization": `token ${token}`,
                "Content-Type": "application/json"
            }
        });
        console.log("Repository deleted successfully:", response.data);
    } catch (error) {
        console.error("Failed to delete repository:", error.response ? error.response.data : error.message);
    }
}

// Example usage:
await deleteRepository('sauna-infrarouge.mano-mano.store');
await  deleteRepository('cabines-de-hammam.mano-mano.store');
await  deleteRepository('accessoires-sauna-vapeur.mano-mano.store');
await  deleteRepository('test1');