// Card Mapping Module
// Maps card names to image URLs using the card database

class CardMapper {
    constructor() {
        this.cardDatabase = new Map();
        this.localCache = new Map();
    }

    async loadCardDatabase() {
        try {
            // 1. Load from pokemon_cards.json
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

            // 2. Load cached cards from localStorage
            try {
                const cachedCards = JSON.parse(localStorage.getItem('newCards') || '[]');
                if (Array.isArray(cachedCards)) {
                    cachedCards.forEach(card => {
                        if (card.name && card.imageUrl) {
                            this.localCache.set(card.name.toLowerCase(), card);
                        }
                    });
                    console.log(`Loaded ${this.localCache.size} cached cards from localStorage`);
                }
            } catch (e) {
                console.warn('Error loading cached cards:', e);
            }

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

        const normalizedName = cardName.toLowerCase();

        // 1. Try to get from pokemon_cards.json (cardDatabase)
        const dbCard = this.cardDatabase.get(normalizedName);
        if (dbCard && dbCard.imageUrl && !dbCard.imageUrl.includes('undefined')) {
            return dbCard.imageUrl;
        }

        // 2. Try to get from Cache (localCache)
        const cachedCard = this.localCache.get(normalizedName);
        if (cachedCard && cachedCard.imageUrl && !cachedCard.imageUrl.includes('undefined')) {
            console.log(`Found "${cardName}" in cache`);
            return cachedCard.imageUrl;
        }

        // 3. Not found in DB or Cache - Fetch from API
        console.log(`🔍 Card "${cardName}" not in database/cache, fetching from TCGdex API...`);

        try {
            const fetchedCard = await this.fetchCardFromAPI(cardName);
            if (fetchedCard && fetchedCard.imageUrl) {
                // 4. Save obtained value to Cache
                this.saveToCache(fetchedCard);

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

    saveToCache(card) {
        try {
            // Update memory cache
            this.localCache.set(card.name.toLowerCase(), card);

            // Update localStorage
            const newCards = JSON.parse(localStorage.getItem('newCards') || '[]');

            // Check if already in cache
            if (!newCards.some(c => c.name.toLowerCase() === card.name.toLowerCase())) {
                newCards.push(card);
                // Sort for tidiness
                newCards.sort((a, b) => a.name.localeCompare(b.name));

                localStorage.setItem('newCards', JSON.stringify(newCards));
                console.log(`💾 Saved "${card.name}" to localStorage cache (${newCards.length} cards total)`);
            }
        } catch (error) {
            console.warn('Could not save to localStorage:', error.message);
        }
    }

    // Kept for backward compatibility
    async saveCardToDatabase(card) {
        this.saveToCache(card);
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
