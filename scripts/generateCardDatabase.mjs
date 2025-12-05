// Card Database Generator - TCGdex API Version
// Superior API with better card search and reliability

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const API_BASE = 'https://api.tcgdex.net/v2/en';

// Retry fetch
async function fetchWithRetry(url, retries = 3) {
    for (let i = 0; i < retries; i++) {
        try {
            const response = await fetch(url);
            if (response.ok) return response;
            if (i < retries - 1) await new Promise(r => setTimeout(r, 1000 * (i + 1)));
        } catch (error) {
            if (i === retries - 1) throw error;
        }
    }
    throw new Error('All retries failed');
}

// Extract Pokemon card names from log
function extractPokemonCards(logContent) {
    const cards = new Set();
    const lines = logContent.split('\n');

    lines.forEach(line => {
        // Pokemon played
        const played = line.match(/played (.+?) to (?:the Active Spot|the Bench)/);
        if (played) cards.add(played[1].trim());

        // Pokemon evolved
        const evolved = line.match(/evolved .+? to (.+?) (?:on|in)/);
        if (evolved) cards.add(evolved[1].trim());
    });

    return Array.from(cards).sort();
}

// Extract Trainer/Item cards from log
function extractTrainerCards(logContent) {
    const cards = new Set();
    const lines = logContent.split('\n');

    // Common trainer/item patterns
    const trainerNames = [
        'Ultra Ball', 'Nest Ball', 'Counter Catcher', 'Rare Candy',
        'Boss\'s Orders', 'Arven', 'Iono', 'Brock\'s Scouting',
        'Lillie\'s Determination', 'Lana\'s Aid', 'Pal Pad',
        'Buddy-Buddy Poffin', 'Night Stretcher', 'Precious Trolley',
        'Pokégear 3.0', 'Technical Machine: Evolution',
        'Vitality Band', 'Brave Bangle'
    ];

    lines.forEach(line => {
        trainerNames.forEach(name => {
            if (line.includes(name)) {
                cards.add(name);
            }
        });

        // Stadium cards
        const stadium = line.match(/played (.+?) to the Stadium spot/);
        if (stadium) cards.add(stadium[1].trim());
    });

    return Array.from(cards).sort();
}

// Extract Energy cards
function extractEnergyCards(logContent) {
    const cards = new Set();
    const lines = logContent.split('\n');

    lines.forEach(line => {
        const match = line.match(/attached (.+Energy) to/);
        if (match) {
            const energy = match[1].trim();
            // Only special energy (not Basic X Energy)
            if (!energy.startsWith('Basic ')) {
                cards.add(energy);
            }
        }
    });

    return Array.from(cards).sort();
}

// Search card using TCGdex API
async function searchCard(cardName) {
    try {
        // Search by name
        const searchUrl = `${API_BASE}/cards?name=${encodeURIComponent(cardName)}`;
        const response = await fetchWithRetry(searchUrl);
        const data = await response.json();

        if (data && data.length > 0) {
            // Find best match
            let bestMatch = data[0];

            // Prefer exact name match (case-insensitive)
            const exactMatch = data.find(card =>
                card.name.toLowerCase() === cardName.toLowerCase()
            );
            if (exactMatch) bestMatch = exactMatch;

            // Get full card details
            const cardUrl = `${API_BASE}/cards/${bestMatch.id}`;
            const cardResponse = await fetchWithRetry(cardUrl);
            const cardData = await cardResponse.json();

            console.log(`  ✅ ${cardData.name} (${cardData.set.name})`);

            return {
                name: cardName,
                imageUrl: cardData.image + '/high.webp' // High quality image
            };
        } else {
            console.log(`  ⚠️  Not found`);
            return null;
        }
    } catch (error) {
        console.log(`  ❌ Error: ${error.message}`);
        return null;
    }
}

// Main
async function main() {
    console.log('╔═══════════════════════════════════════════╗');
    console.log('║   TCGdex Card Database Generator v3.0    ║');
    console.log('╚═══════════════════════════════════════════╝\n');

    // Read log
    const logPath = path.join(__dirname, '..', 'doc', 'logsample', 'ptcgl log.txt');
    console.log(`📖 Reading: ${logPath}\n`);
    const logContent = fs.readFileSync(logPath, 'utf-8');

    // Extract all card types
    console.log('🔍 Extracting cards...');
    const pokemonCards = extractPokemonCards(logContent);
    const trainerCards = extractTrainerCards(logContent);
    const energyCards = extractEnergyCards(logContent);

    const allCards = [
        ...pokemonCards,
        ...trainerCards,
        ...energyCards
    ];

    console.log(`   Pokemon: ${pokemonCards.length}`);
    console.log(`   Trainer/Item: ${trainerCards.length}`);
    console.log(`   Energy: ${energyCards.length}`);
    console.log(`   Total: ${allCards.length}\n`);

    // Fetch from API
    console.log('📡 Fetching from TCGdex API...\n');
    const cards = [];

    for (let i = 0; i < allCards.length; i++) {
        const cardName = allCards[i];
        console.log(`[${i + 1}/${allCards.length}] ${cardName}`);

        const cardData = await searchCard(cardName);
        if (cardData) {
            cards.push(cardData);
        }

        // Rate limiting
        await new Promise(r => setTimeout(r, 100));
    }

    // Save
    const outputPath = path.join(__dirname, '..', 'data', 'pokemon_cards.json');
    console.log(`\n💾 Saving to: ${outputPath}`);
    fs.writeFileSync(outputPath, JSON.stringify(cards, null, 2));

    console.log('\n╔═══════════════════════════════════════════╗');
    console.log(`║  ✅ Complete! ${cards.length}/${allCards.length} cards saved          ║`);
    console.log('╚═══════════════════════════════════════════╝\n');

    // Show missing
    if (cards.length < allCards.length) {
        console.log('⚠️  Missing cards:');
        const foundNames = new Set(cards.map(c => c.name));
        allCards.filter(n => !foundNames.has(n)).forEach(n => {
            console.log(`   - ${n}`);
        });
    }
}

main().catch(console.error);
