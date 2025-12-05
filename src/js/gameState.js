// Game State Management
// Data structures and state management for the game

class GameState {
    constructor(parseData) {
        this.players = {
            player1: new PlayerState(parseData.player1Name || 'Player1'),
            player2: new PlayerState(parseData.player2Name || 'Player2')
        };

        this.activePlayer = 'player1';
        this.turnNumber = 1;
        this.stadium = null;
        this.actions = parseData.actions || [];
        this.currentActionIndex = 0;
        this.isGameOver = false;
        this.winner = null;

        // Initialize from setup data if available
        if (parseData.setup) {
            this.initializeFromSetup(parseData.setup);
        }
    }

    initializeFromSetup(setup) {
        // Initialize player states from setup data
        if (setup.player1) {
            this.players.player1.initializeFromSetup(setup.player1);
        }
        if (setup.player2) {
            this.players.player2.initializeFromSetup(setup.player2);
        }
    }

    getCurrentAction() {
        return this.actions[this.currentActionIndex];
    }

    hasNextAction() {
        return this.currentActionIndex < this.actions.length - 1;
    }

    hasPreviousAction() {
        return this.currentActionIndex > 0;
    }

    executeNextAction() {
        if (!this.hasNextAction()) return null;

        this.currentActionIndex++;
        const action = this.getCurrentAction();
        this.applyAction(action);
        return action;
    }

    executePreviousAction() {
        if (!this.hasPreviousAction()) return null;

        const action = this.getCurrentAction();
        this.revertAction(action);
        this.currentActionIndex--;
        return this.getCurrentAction();
    }

    applyAction(action) {
        if (!action) return;

        const player = this.players[action.player];
        const opponent = this.players[action.player === 'player1' ? 'player2' : 'player1'];

        switch (action.type) {
            case 'draw':
                this.handleDraw(player, action.data);
                break;
            case 'play_pokemon_active':
                this.handlePlayPokemonActive(player, action.data);
                break;
            case 'play_pokemon_bench':
                this.handlePlayPokemonBench(player, action.data);
                break;
            case 'switch_active':
                this.handleSwitchActive(player, action.data);
                break;
            case 'play_card':
                this.handlePlayCard(player, action.data);
                break;
            case 'attach_energy':
                this.handleAttachEnergy(player, action.data);
                break;
            case 'use_attack':
                this.handleUseAttack(player, opponent, action.data);
                break;
            case 'damage':
                this.handleDamage(opponent, action.data);
                break;
            case 'knockout':
                this.handleKnockout(opponent, action.data);
                break;
            case 'take_prize':
                this.handleTakePrize(player, action.data);
                break;
            case 'turn_end':
                this.handleTurnEnd();
                break;
        }
    }

    handlePlayPokemonActive(player, data) {
        const pokemon = new Pokemon(new Card(data.pokemonName, 'pokemon'));
        player.activePokemon = pokemon;
        console.log(`${player.name} played ${data.pokemonName} to Active`);
    }

    handlePlayPokemonBench(player, data) {
        const pokemon = new Pokemon(new Card(data.pokemonName, 'pokemon'));
        player.bench.push(pokemon);
        console.log(`${player.name} played ${data.pokemonName} to Bench (${player.bench.length} Pokemon)`);
    }

    handleSwitchActive(player, data) {
        // Find Pokemon on bench by name
        const benchIndex = player.bench.findIndex(p => p.card.name === data.pokemonName);
        if (benchIndex >= 0) {
            const oldActive = player.activePokemon;
            const newActive = player.bench[benchIndex];

            // Swap
            player.activePokemon = newActive;
            player.bench.splice(benchIndex, 1);

            if (oldActive) {
                player.bench.push(oldActive);
            }

            console.log(`${player.name} switched ${data.pokemonName} to Active`);
        } else {
            // Pokemon not found on bench, might be new active
            player.activePokemon = new Pokemon(new Card(data.pokemonName, 'pokemon'));
            console.log(`${player.name} set ${data.pokemonName} as Active (new)`);
        }
    }

    revertAction(action) {
        // For simplicity, we'll rebuild state from scratch
        // This is inefficient but ensures correctness
        // A better approach would be to implement proper undo for each action type
        console.warn('Undo functionality is simplified - rebuilding state');
    }

    handleDraw(player, data) {
        if (data.cards) {
            data.cards.forEach(cardName => {
                player.hand.push(new Card(cardName, 'unknown'));
            });
        } else if (data.count) {
            for (let i = 0; i < data.count; i++) {
                player.hand.push(new Card('Unknown Card', 'unknown'));
            }
        }
    }

    handlePlayCard(player, data) {
        // Remove from hand and apply card effect
        const cardIndex = player.hand.findIndex(c => c.name === data.cardName);
        if (cardIndex >= 0) {
            player.hand.splice(cardIndex, 1);
        }
    }

    handleAttachEnergy(player, data) {
        // Parse target to find correct pokemon
        const targetLower = data.target.toLowerCase();
        let targetPokemon = null;

        if (targetLower.includes('active spot')) {
            targetPokemon = player.activePokemon;
        } else if (targetLower.includes('bench')) {
            // Find pokemon on bench by name
            const pokemonName = data.target.split(' ')[0];
            targetPokemon = player.bench.find(p => p.card.name === pokemonName);
        } else {
            // Try to find by name in active or bench
            const pokemonName = data.target.split(' ')[0];
            if (player.activePokemon && player.activePokemon.card.name === pokemonName) {
                targetPokemon = player.activePokemon;
            } else {
                targetPokemon = player.bench.find(p => p.card.name === pokemonName);
            }
        }

        if (targetPokemon) {
            targetPokemon.energies.push(new Card(data.energyType, 'energy'));
        }
    }

    handleUseAttack(player, opponent, data) {
        // Apply damage from attack if damage is specified
        if (data.damage && data.damage > 0) {
            // Parse target to find which pokemon to damage
            const targetLower = (data.target || '').toLowerCase();

            if (targetLower.includes('active') || !data.target) {
                // Damage to opponent's active pokemon
                if (opponent.activePokemon) {
                    opponent.activePokemon.damage += data.damage;
                    console.log(`Applied ${data.damage} damage to ${opponent.name}'s ${opponent.activePokemon.card.name}`);
                }
            }
        }
    }

    handleDamage(player, data) {
        const pokemon = data.target === 'active' ? player.activePokemon : player.bench[data.benchIndex];
        if (pokemon) {
            pokemon.damage += data.amount;
        }
    }

    handleKnockout(player, data) {
        const pokemonName = data.pokemonName;

        // Check active pokemon
        if (player.activePokemon && player.activePokemon.card.name === pokemonName) {
            console.log(`Knocking out ${player.name}'s ${pokemonName} (active)`);
            player.activePokemon.knockout();
            player.discardPile.push(player.activePokemon.card);
            player.activePokemon = null;
            return;
        }

        // Check bench
        const benchIndex = player.bench.findIndex(p => p.card.name === pokemonName);
        if (benchIndex >= 0) {
            console.log(`Knocking out ${player.name}'s ${pokemonName} (bench)`);
            const pokemon = player.bench[benchIndex];
            pokemon.knockout();
            player.discardPile.push(pokemon.card);
            player.bench.splice(benchIndex, 1);
        }
    }

    handleTakePrize(player, data) {
        const count = data.count || 1;
        for (let i = 0; i < count && player.prizeCount > 0; i++) {
            player.prizeCount--;
            // Add prize card to hand (usually unknown)
            player.hand.push(new Card('Prize Card', 'unknown'));
        }

        console.log(`${player.name} took ${count} prize(s), ${player.prizeCount} remaining`);

        if (player.prizeCount === 0) {
            this.isGameOver = true;
            this.winner = player.name;
        }
    }

    handleTurnEnd() {
        this.activePlayer = this.activePlayer === 'player1' ? 'player2' : 'player1';
        if (this.activePlayer === 'player1') {
            this.turnNumber++;
        }
    }
}

class PlayerState {
    constructor(name) {
        this.name = name;
        this.deck = 60; // Starting deck size (estimate)
        this.hand = [];
        this.handCount = 0; // For opponent
        this.prizeCount = 6;
        this.prizeCards = [];
        this.activePokemon = null;
        this.bench = [];
        this.discardPile = [];
        this.lostZone = [];
        this.vstarUsed = false;
    }

    initializeFromSetup(setupData) {
        // Initialize from setup data
        if (setupData.activePokemon) {
            this.activePokemon = new Pokemon(new Card(setupData.activePokemon, 'pokemon'));
        }
        if (setupData.bench) {
            this.bench = setupData.bench.map(name => new Pokemon(new Card(name, 'pokemon')));
        }
        if (setupData.hand) {
            this.hand = setupData.hand.map(name => new Card(name, 'unknown'));
        }
    }
}

class Pokemon {
    constructor(card) {
        this.card = card;
        this.hp = 100; // Default, should be loaded from card data
        this.maxHp = 100;
        this.damage = 0;
        this.energies = [];
        this.tools = [];
        this.specialConditions = [];
        this.evolutionStage = 0;
        this.isKnockedOut = false;
    }

    knockout() {
        this.isKnockedOut = true;
    }

    getRemainingHp() {
        return Math.max(0, this.hp - this.damage);
    }
}

class Card {
    constructor(name, type) {
        this.name = name;
        this.type = type; // 'pokemon', 'trainer', 'energy', 'unknown'
        this.imageUrl = '';
    }
}

class Action {
    constructor(type, player, data, timestamp) {
        this.type = type;
        this.player = player; // 'player1' or 'player2'
        this.data = data;
        this.timestamp = timestamp;
    }
}

export { GameState, PlayerState, Pokemon, Card, Action };
