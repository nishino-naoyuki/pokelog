// Card Database Generator
// Reads log file and generates pokemon_cards.json using Pokemon TCG API

const fs = require('fs');
const path = require('path');

// Pokemon TCG API endpoint
const API_BASE = 'https://api.pokemontcg.io/v2/cards';

// Extract unique card names from log file
function extractCardNames(logContent) {
    const cardNames = new Set();
    const lines = logContent.split('\n');

    // Patterns to match card names
    const patterns = [
        /played (.+?) to (the Active Spot|the Bench|the Stadium spot)/,
        /evolved (.+?) to (.+?) (?:on|in)/,
        /drew (.+?)\./,
        /discarded (.+?)\./,
        /attached (.+?) to/,
        /• (.+?)(?:,|$)/
    ];

    lines.forEach(line => {
        patterns.forEach(pattern => {
            const match = line.match(pattern);
            if (match) {
                // Get the captured card name
                const cardName = match[1] || match[2];
                if (cardName && !cardName.includes('their') && !cardName.includes('card')) {
                    cardNames.add(cardName.trim());
                }
            }
        });
    });

    return Array.from(cardNames);
}

// Search card from Pokemon TCG API
async function searchCard(cardName) {
    try {
        // Clean card name for search
        const searchName = cardName.replace(' ex', '').trim();
        const query = `name:"${searchName}"`;
        const url = `${API_BASE}?q=${encodeURIComponent(query)}`;

        console.log(`Searching for: ${cardName}...`);

        const response = await fetch(url);
        const data = await response.json();

        if (data.data && data.data.length > 0) {
            // Find exact match or best match
            let bestMatch = data.data[0];

            // Try to find exact match including "ex"
            if (cardName.includes(' ex')) {
                const exactMatch = data.data.find(card =>
                    card.name.toLowerCase() === cardName.toLowerCase()
                );
                if (exactMatch) {
                    bestMatch = exactMatch;
                }
            }

            return {
                name: cardName,
                imageUrl: bestMatch.images.small || bestMatch.images.large
            };
        } else {
            console.warn(`No results for: ${cardName}`);
            return null;
        }
    } catch (error) {
        console.error(`Error searching for ${cardName}:`, error.message);
        return null;
    }
}

// Main function
async function generateCardDatabase() {
    console.log('=== Pokemon Card Database Generator ===\n');

    // Read log file
    const logPath = path.join(__dirname, '..', 'doc', 'logsample', 'ptcgl log.txt');
    console.log(`Reading log file: ${logPath}`);
    const logContent = fs.readFileSync(logPath, 'utf-8');

    // Extract card names
    console.log('\nExtracting card names...');
    const cardNames = extractCardNames(logContent);
    console.log(`Found ${cardNames.length} unique cards\n`);

    // Fetch card data from API
    console.log('Fetching card data from Pokemon TCG API...\n');
    const cards = [];

    for (const cardName of cardNames) {
        const cardData = await searchCard(cardName);
        if (cardData) {
            cards.push(cardData);
        }
        // Rate limiting - wait 100ms between requests
        await new Promise(resolve => setTimeout(resolve, 100));
    }

    // Sort cards by name
    cards.sort((a, b) => a.name.localeCompare(b.name));

    // Write to JSON file
    const outputPath = path.join(__dirname, '..', 'data', 'pokemon_cards.json');
    console.log(`\nWriting ${cards.length} cards to: ${outputPath}`);
    fs.writeFileSync(outputPath, JSON.stringify(cards, null, 2));

    console.log('\n=== Complete! ===');
    console.log(`Successfully generated database with ${cards.length} cards`);
}

// Run if called directly
if (require.main === module) {
    generateCardDatabase().catch(console.error);
}

module.exports = { extractCardNames, searchCard, generateCardDatabase };
