import axios from 'axios';

export async function publishRepository(repoName) {
    const token = process.env.GITHUB_TOKEN
    if (!token) {
        console.error("GITHUB_TOKEN is not set in your environment.");
        process.exit(1);
    }

    const url = `https://api.github.com/repos/moicben/${repoName}/pages`;
    const payload = {
        source: {
            branch: "main",
            path: "/"
        },
        cname: `${repoName}`,
        https_enforced: true
    };

    try {
        const response = await axios.post(url, payload, {
            headers: {
                "Authorization": `token ${token}`,
                "Accept": "application/vnd.github+json",
                "Content-Type": "application/json"
            }
        });
        console.log("GitHub Pages activated successfully:", response.data);
    } catch (error) {
        console.error("Failed to activate GitHub Pages:",
            error.response ? error.response.data : error.message);
    }
}

// Example usage:
// Replace 'test1' with your repository name.
//publishRepository('test1');