import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

export async function createRepository(repoName) {
    const token = process.env.GITHUB_TOKEN; // Ensure this is set in your environment variables
    if (!token) {
        console.error("GITHUB_TOKEN is not set in your environment.");
        process.exit(1);
    }
    
    const url = "https://api.github.com/user/repos";

    try {
        const response = await axios.post(url, {
            name: repoName,
            private: false
        }, {
            headers: {
                "Authorization": `token ${token}`,
                "Content-Type": "application/json"
            }
        });
        console.log("Repository created successfully:", response.data);
    } catch (error) {
        console.error("Failed to create repository:", error.response ? error.response.data : error.message);
    }
}

//createRepository("test2");