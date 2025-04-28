import axios from 'axios';

export async function deleteRepository(repoName) {
    const token = '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'
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
deleteRepository('saunas-infrarouges.mano-mano.store');
deleteRepository('cabines-de-hammam.mano-mano.store');
deleteRepository('accessoires-sauna.mano-mano.store');