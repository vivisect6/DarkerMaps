#!/usr/bin/env node
/**
 * Generate contributor data for DarkerMaps
 *
 * This script runs during the GitHub Actions build to:
 * 1. Fetch code contributors from GitHub API
 * 2. Extract location contributors from git history
 * 3. Output JSON files for Jekyll to consume
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Configuration
const REPO_OWNER = 'vivisect6';
const REPO_NAME = 'DarkerMaps';
const LOCATIONS_DIR = path.join(__dirname, '..', '_data', 'locations');
const OUTPUT_DIR = path.join(__dirname, '..', '_data');

/**
 * Fetch code contributors from GitHub API
 */
async function fetchCodeContributors() {
    const token = process.env.GITHUB_TOKEN;
    const url = `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contributors`;

    const headers = {
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'DarkerMaps-Build'
    };

    if (token) {
        headers['Authorization'] = `token ${token}`;
    }

    try {
        const response = await fetch(url, { headers });

        if (!response.ok) {
            console.warn(`GitHub API returned ${response.status}, using empty contributors list`);
            return [];
        }

        const contributors = await response.json();

        return contributors.map(c => ({
            username: c.login,
            avatar: c.avatar_url,
            profile: c.html_url,
            contributions: c.contributions
        }));
    } catch (error) {
        console.warn('Failed to fetch contributors from GitHub API:', error.message);
        return [];
    }
}

/**
 * Parse a YAML file to extract location IDs
 */
function extractLocationIds(filePath) {
    const content = fs.readFileSync(filePath, 'utf8');
    const ids = [];

    // Simple regex to extract location IDs from YAML
    const idRegex = /^\s*-\s*id:\s*["']?([^"'\n]+)["']?/gm;
    let match;

    while ((match = idRegex.exec(content)) !== null) {
        ids.push(match[1].trim());
    }

    return ids;
}

/**
 * Get the git author who added a specific line to a file
 * Uses git log to find the commit that added the location
 */
function getLocationContributor(filePath, locationId) {
    try {
        // Use git log to find commits that added this location ID
        // -S finds commits where the string was added or removed
        // --diff-filter=A would only show when file was added, but we want line additions
        const cmd = `git log -1 --format="%an|%ae" -S "id: \\"${locationId}\\"" -- "${filePath}"`;
        const result = execSync(cmd, { encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] }).trim();

        if (result) {
            const [name, email] = result.split('|');
            // Extract GitHub username from noreply email if possible
            const githubMatch = email.match(/(\d+\+)?([^@]+)@users\.noreply\.github\.com/);
            const username = githubMatch ? githubMatch[2] : name;
            return username;
        }

        // Fallback: try without quotes around the ID
        const cmd2 = `git log -1 --format="%an|%ae" -S "id: ${locationId}" -- "${filePath}"`;
        const result2 = execSync(cmd2, { encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] }).trim();

        if (result2) {
            const [name, email] = result2.split('|');
            const githubMatch = email.match(/(\d+\+)?([^@]+)@users\.noreply\.github\.com/);
            const username = githubMatch ? githubMatch[2] : name;
            return username;
        }
    } catch (error) {
        // Git command failed, return null
    }

    return null;
}

/**
 * Extract location contributors from git history
 */
function extractLocationContributors() {
    const contributors = {};

    if (!fs.existsSync(LOCATIONS_DIR)) {
        console.warn('Locations directory not found:', LOCATIONS_DIR);
        return contributors;
    }

    const files = fs.readdirSync(LOCATIONS_DIR).filter(f => f.endsWith('.yml'));

    for (const file of files) {
        const filePath = path.join(LOCATIONS_DIR, file);
        const locationIds = extractLocationIds(filePath);

        for (const id of locationIds) {
            const contributor = getLocationContributor(filePath, id);
            if (contributor) {
                contributors[id] = contributor;
            }
        }
    }

    return contributors;
}

/**
 * Main execution
 */
async function main() {
    console.log('Generating contributor data...');

    // Ensure output directory exists
    if (!fs.existsSync(OUTPUT_DIR)) {
        fs.mkdirSync(OUTPUT_DIR, { recursive: true });
    }

    // Fetch code contributors from GitHub
    console.log('Fetching code contributors from GitHub API...');
    const codeContributors = await fetchCodeContributors();
    console.log(`Found ${codeContributors.length} code contributors`);

    // Write code contributors
    const codeContributorsPath = path.join(OUTPUT_DIR, 'code_contributors.json');
    fs.writeFileSync(codeContributorsPath, JSON.stringify(codeContributors, null, 2));
    console.log(`Wrote ${codeContributorsPath}`);

    // Extract location contributors from git history
    console.log('Extracting location contributors from git history...');
    const locationContributors = extractLocationContributors();
    console.log(`Found contributors for ${Object.keys(locationContributors).length} locations`);

    // Write location contributors
    const locationContributorsPath = path.join(OUTPUT_DIR, 'location_contributors.json');
    fs.writeFileSync(locationContributorsPath, JSON.stringify(locationContributors, null, 2));
    console.log(`Wrote ${locationContributorsPath}`);

    console.log('Done!');
}

main().catch(error => {
    console.error('Error generating contributor data:', error);
    process.exit(1);
});
