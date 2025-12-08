// Card Mapping Module
// Maps card names to image URLs using the card database

class CardMapper {
    constructor() {
        this.cardDatabase = new Map();
    }

    async loadCardDatabase() {
        try {
            const response = await fetch('../data/pokemon_cards.json');
            const data = await response.json();

            // Build map from card data
            if (Array.isArray(data)) {
                data.forEach(card => {
                    if (card.name && card.imageUrl) {
                        this.cardDatabase.set(card.name.toLowerCase(), card);
                    }
                });
            }

            console.log(`Loaded ${this.cardDatabase.size} cards from database`);
        } catch (error) {
            console.warn('Could not load card database, using placeholders:', error);
        }
    }

    async getCardImage(cardName) {
        console.log('Getting card image for:', cardName);
        if (!cardName) {
            return this.getPlaceholderImage();
        }

        // Return card back for hidden cards
        if (cardName === 'Unknown Card' || cardName === 'Prize Card' || cardName === '山札') {
            return this.getCardBackImage();
        }

        const card = this.cardDatabase.get(cardName.toLowerCase());

        if (card && card.imageUrl && !card.imageUrl.includes('undefined')) {
            return card.imageUrl;
        }

        // Card not found or has invalid URL - fetch from API
        console.log(`🔍 Card "${cardName}" not in database, fetching from TCGdex API...`);

        try {
            const fetchedCard = await this.fetchCardFromAPI(cardName);
            if (fetchedCard && fetchedCard.imageUrl) {
                // Save to local database (in-memory)
                this.cardDatabase.set(cardName.toLowerCase(), fetchedCard);

                // Save to JSON file for persistence
                await this.saveCardToDatabase(fetchedCard);

                console.log(`✅ Successfully fetched and saved "${cardName}"`);
                return fetchedCard.imageUrl;
            }
        } catch (error) {
            console.warn(`⚠️ Failed to fetch "${cardName}" from API:`, error.message);
        }

        // Fallback to placeholder if API fetch fails
        const placeholder = this.getPlaceholderImage(cardName);
        console.log('Using placeholder for', cardName);
        return placeholder;
    }

    async fetchCardFromAPI(cardName) {
        const API_BASE = 'https://api.tcgdex.net/v2/en';

        // Search by name
        const searchUrl = `${API_BASE}/cards?name=${encodeURIComponent(cardName)}`;
        const response = await fetch(searchUrl);

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }

        const data = await response.json();

        if (data && data.length > 0) {
            // Find best match
            let bestMatch = data[0];

            // Prefer exact name match
            const exactMatch = data.find(card =>
                card.name.toLowerCase() === cardName.toLowerCase()
            );
            if (exactMatch) bestMatch = exactMatch;

            // Get full card details
            const cardUrl = `${API_BASE}/cards/${bestMatch.id}`;
            const cardResponse = await fetch(cardUrl);
            const cardData = await cardResponse.json();

            return {
                name: cardName,
                imageUrl: cardData.image + '/high.webp'
            };
        }

        return null;
    }

    async saveCardToDatabase(card) {
        try {
            // Read current database
            const response = await fetch('../data/pokemon_cards.json');
            const currentData = await response.json();

            // Check if card already exists
            const exists = currentData.some(c => c.name.toLowerCase() === card.name.toLowerCase());
            if (exists) {
                console.log(`Card "${card.name}" already in database`);
                return;
            }

            // Add new card and sort alphabetically
            currentData.push(card);
            currentData.sort((a, b) => a.name.localeCompare(b.name));

            // Note: Cannot directly write to file from browser
            // Instead, we'll use localStorage as a cache
            const newCards = JSON.parse(localStorage.getItem('newCards') || '[]');
            if (!newCards.some(c => c.name === card.name)) {
                newCards.push(card);
                localStorage.setItem('newCards', JSON.stringify(newCards));
                console.log(`💾 Saved "${card.name}" to localStorage (${newCards.length} new cards total)`);
                console.log('ℹ️ Run the export script to save to pokemon_cards.json');
            }
        } catch (error) {
            console.warn('Could not save to database:', error.message);
        }
    }

    getPlaceholderImage(cardName = '') {
        // Generate SVG placeholder instead of canvas for better compatibility
        const svgWidth = 200;
        const svgHeight = 280;

        // Escape card name for SVG
        const safeCardName = cardName.replace(/[<>&"']/g, '?');

        // Split name into lines if too long
        const words = safeCardName.split(' ');
        let lines = [];
        let currentLine = '';

        words.forEach(word => {
            const testLine = currentLine ? `${currentLine} ${word}` : word;
            if (testLine.length > 15 && currentLine) {
                lines.push(currentLine);
                currentLine = word;
            } else {
                currentLine = testLine;
            }
        });
        if (currentLine) lines.push(currentLine);

        // Create text elements
        const textElements = lines.map((line, index) => {
            const y = 130 + (index * 20);
            return `<text x="100" y="${y}" text-anchor="middle" font-family="sans-serif" font-size="14" font-weight="bold" fill="#757575">${line}</text>`;
        }).join('');

        const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${svgWidth}" height="${svgHeight}">
            <rect width="100%" height="100%" fill="#E0E0E0"/>
            <rect x="2" y="2" width="196" height="276" fill="none" stroke="#9E9E9E" stroke-width="4"/>
            ${textElements}
        </svg>`;

        // Convert SVG to data URL
        const encoded = encodeURIComponent(svg);
        return `data:image/svg+xml,${encoded}`;
    }

    getCardBackImage() {
        // Return Pokemon card back image
        const canvas = document.createElement('canvas');
        canvas.width = 200;
        canvas.height = 280;
        const ctx = canvas.getContext('2d');

        // Background (blue)
        ctx.fillStyle = '#4A90E2';
        ctx.fillRect(0, 0, 200, 280);

        // Border
        ctx.strokeStyle = '#2C5AA0';
        ctx.lineWidth = 8;
        ctx.strokeRect(4, 4, 192, 272);

        // Center circle
        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath();
        ctx.arc(100, 140, 60, 0, Math.PI * 2);
        ctx.fill();

        // Text
        ctx.fillStyle = '#2C5AA0';
        ctx.font = 'bold 20px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('POKEMON', 100, 145);

        return canvas.toDataURL();
    }
}

export { CardMapper };
