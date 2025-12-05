// UI Rendering Module
// Handles rendering game state to the DOM

import { MessageTranslator } from './messageTranslator.js';

class UI {
    constructor() {
        this.translator = new MessageTranslator();
        this.logContentEl = document.getElementById('log-content');
        // Assuming these elements exist or will be initialized elsewhere if needed by the new renderGameState logic
        this.turnNumberEl = document.getElementById('turn-number'); // Added based on snippet
        this.activePlayerEl = document.getElementById('active-player-indicator'); // Added based on snippet
    }

    async renderGameState(gameState, cardMapper) {
        console.log('Rendering game state:', gameState);
        console.log('Player1 active:', gameState.players.player1.activePokemon);
        console.log('Player1 bench:', gameState.players.player1.bench);
        console.log('Player2 active:', gameState.players.player2.activePokemon);
        console.log('Player2 bench:', gameState.players.player2.bench);

        // Update turn number
        if (this.turnNumberEl) {
            this.turnNumberEl.textContent = `ターン ${gameState.turnNumber}`;
        }

        // Render players
        await this.renderPlayer(gameState.players.player1, 'player', cardMapper);
        await this.renderPlayer(gameState.players.player2, 'opponent', cardMapper);

        // Render stadium
        await this.renderStadium(gameState.stadium, cardMapper);

        // Update active player indicator
        if (this.activePlayerEl) {
            const activeLabel = gameState.activePlayer === 'player1' ? 'プレイヤー1' : 'プレイヤー2';
            this.activePlayerEl.textContent = `${activeLabel}のターン`;
        }
    }

    updateTurnDisplay(gameState) {
        const turnInfo = document.getElementById('turn-info');
        if (turnInfo) {
            const activePlayerName = gameState.players[gameState.activePlayer].name;
            turnInfo.textContent = `Turn # ${gameState.turnNumber} - ${activePlayerName}'s Turn`;
        }
    }

    async renderPlayer(player, role, cardMapper) {
        // role is 'player' or 'opponent'
        const prefix = role === 'player' ? 'player' : 'opponent';

        // Render active Pokemon
        await this.renderActivePokemon(player.activePokemon, `${prefix}-active`, cardMapper);

        // Render bench
        await this.renderBench(player.bench, `${prefix}-bench`, cardMapper);

        // Render hand (for player only, opponent shows card backs)
        if (role === 'player') {
            await this.renderHand(player.hand, 'player-hand', cardMapper);
        }

        // Update discard pile count
        this.updateDiscardCount(player.discardPile.length, `${prefix}-discard-count`);

        // Update prize count
        this.updatePrizeCount(player.prizeCount, `${prefix}-prize-count`);
    }

    async renderActivePokemon(pokemon, containerId, cardMapper) {
        const container = document.getElementById(containerId);
        console.log('Rendering active pokemon in', containerId, ':', pokemon);
        if (!container) {
            console.error('Container not found:', containerId);
            return;
        }

        container.innerHTML = '';

        if (pokemon) {
            const card = await this.createPokemonCard(pokemon, 'large', cardMapper);
            container.appendChild(card);
        } else {
            console.log('No pokemon to render in', containerId);
        }
    }

    async renderBench(bench, containerId, cardMapper) {
        const container = document.getElementById(containerId);
        if (!container) return;

        container.innerHTML = '';

        for (const pokemon of bench) {
            const card = await this.createPokemonCard(pokemon, 'small', cardMapper);
            container.appendChild(card);
        }
    }

    async renderHand(hand, containerId, cardMapper) {
        const container = document.getElementById(containerId);
        if (!container) return;

        container.innerHTML = '';

        for (const card of hand) {
            const cardEl = await this.createHandCard(card, cardMapper);
            container.appendChild(cardEl);
        }
    }

    async renderStadium(stadium, cardMapper) {
        const container = document.getElementById('stadium');
        if (!container) return;

        container.innerHTML = '';

        if (stadium) {
            const cardEl = document.createElement('div');
            cardEl.className = 'stadium-card';
            const img = document.createElement('img');
            img.className = 'card-image';
            img.src = await cardMapper.getCardImage(stadium.name);
            img.alt = stadium.name;
            cardEl.appendChild(img);
            container.appendChild(cardEl);
        }
    }

    async createPokemonCard(pokemon, size, cardMapper) {
        const card = document.createElement('div');
        card.className = `pokemon-card ${size}`;
        card.dataset.cardName = pokemon.card.name;

        // Card image
        const img = document.createElement('img');
        img.className = 'card-image';
        img.src = await cardMapper.getCardImage(pokemon.card.name);
        img.alt = pokemon.card.name;
        card.appendChild(img);

        // Damage counter
        if (pokemon.damage > 0) {
            const damageCounter = document.createElement('div');
            damageCounter.className = 'damage-counter';
            damageCounter.textContent = pokemon.damage;
            card.appendChild(damageCounter);
        }

        // Special conditions
        if (pokemon.specialConditions.length > 0) {
            const conditions = document.createElement('div');
            conditions.className = 'special-conditions';
            pokemon.specialConditions.forEach(condition => {
                const icon = this.getConditionIcon(condition);
                conditions.textContent += icon;
            });
            card.appendChild(conditions);
        }

        // Energy display
        if (pokemon.energies.length > 0) {
            const energyDisplay = document.createElement('div');
            energyDisplay.className = 'energy-display';
            pokemon.energies.forEach(energy => {
                const icon = this.getEnergyIcon(energy.name);
                energyDisplay.textContent += icon;
            });
            card.appendChild(energyDisplay);
        }

        // Tool display
        if (pokemon.tools.length > 0) {
            const toolDisplay = document.createElement('div');
            toolDisplay.className = 'tool-display';
            toolDisplay.textContent = '🔧';
            card.appendChild(toolDisplay);
        }

        // Click handler for detail popup
        card.addEventListener('click', () => {
            this.showCardDetail(pokemon.card, cardMapper);
        });

        return card;
    }

    async createHandCard(card, cardMapper) {
        const cardEl = document.createElement('div');
        cardEl.className = 'pokemon-card small';
        cardEl.dataset.cardName = card.name;

        const img = document.createElement('img');
        img.className = 'card-image';
        img.src = await cardMapper.getCardImage(card.name);
        img.alt = card.name;

        cardEl.appendChild(img);

        // Click handler
        cardEl.addEventListener('click', () => {
            this.showCardDetail(card, cardMapper);
        });

        return cardEl;
    }

    async showCardDetail(card, cardMapper) {
        const popup = document.getElementById('card-detail-popup');
        const img = document.getElementById('card-detail-image');
        const name = document.getElementById('card-detail-name');
        const hp = document.getElementById('card-detail-hp');

        if (popup && img && name) {
            img.src = await cardMapper.getCardImage(card.name);
            name.textContent = card.name;
            hp.textContent = 'HP: -'; // Would need card database for actual HP

            popup.classList.add('active');
        }
    }

    updateDiscardCount(count, elementId) {
        const el = document.getElementById(elementId);
        if (el) {
            el.textContent = `(${count})`;
        }
    }

    updatePrizeCount(count, elementId) {
        const el = document.getElementById(elementId);
        if (el) {
            el.textContent = count;
        }
    }

    addLogMessage(message, type = 'normal') {
        if (!this.logContentEl) return;

        const messageEl = document.createElement('div');
        messageEl.className = `log-message ${type}`;
        messageEl.textContent = `> ${message}`;

        this.logContentEl.appendChild(messageEl);

        // Auto-scroll to bottom
        this.logContentEl.scrollTop = this.logContentEl.scrollHeight;
    }

    clearLog() {
        if (this.logContentEl) {
            this.logContentEl.innerHTML = '';
        }
    }

    getConditionIcon(condition) {
        const icons = {
            'poisoned': '☠️',
            'burned': '🔥',
            'asleep': '💤',
            'paralyzed': '⚡',
            'confused': '❓'
        };
        return icons[condition] || '?';
    }

    getEnergyIcon(energyName) {
        if (energyName.includes('Fire')) return '🔥';
        if (energyName.includes('Water')) return '💧';
        if (energyName.includes('Grass')) return '🌿';
        if (energyName.includes('Electric') || energyName.includes('Lightning')) return '⚡';
        if (energyName.includes('Psychic')) return '🔮';
        if (energyName.includes('Fighting')) return '✊';
        if (energyName.includes('Dark')) return '🌙';
        if (energyName.includes('Metal')) return '⚙️';
        if (energyName.includes('Fairy')) return '🧚';
        if (energyName.includes('Dragon')) return '🐉';
        if (energyName.includes('Colorless')) return '⚪';
        return '⭐'; // Default for unknown or special energy
    }
}

export { UI };
