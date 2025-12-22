// Game State Management
// Data structures and state management for the game

class GameState {
    constructor(parseData) {
        this.players = {
            player1: new PlayerState(parseData.player1Name || 'Player1'),
            player2: new PlayerState(parseData.player2Name || 'Player2')
        };

        this.activePlayer = parseData.startingPlayer || 'player1';
        this.initialStartingPlayer = this.activePlayer;
        this.turnNumber = 1;
        this.stadium = null;
        this.actions = parseData.actions || [];
        this.currentActionIndex = 0;
        this.isGameOver = false;
        this.winner = null;

        // Initialize from setup data if available
        if (parseData.setup) {
            this.initialSetup = parseData.setup;
            this.initializeFromSetup(parseData.setup);
        }
        console.log("parseData.actions", parseData.actions);
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

        console.log('Applying Action:', action.type, action.data);

        switch (action.type) {
            case 'draw':
                this.handleDraw(player, action.data, action.player);
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
            case 'play_stadium':
                this.handlePlayStadium(player, action.data);
                break;
            case 'attach_energy':
                this.handleAttachEnergy(player, action.data);
                break;
            case 'attach_tool':
                this.handleAttachTool(player, action.data);
                break;
            case 'use_attack':
                this.handleUseAttack(player, opponent, action.data);
                break;
            case 'damage':
                this.handleDamage(opponent, action.data);
                break;
            case 'knockout':
                this.handleKnockout(player, action.data);
                break;
            case 'take_prize':
                this.handleTakePrize(player, action.data);
                break;
            case 'put_damage_counter':
                this.handlePutDamageCounter(player, action.data);
                break;
            case 'move_damage_counter':
                this.handleMoveDamageCounter(player, action.data);
                break;
            case 'special_condition_damage':
                this.handleSpecialConditionDamage(player, action.data);
                break;
            case 'special_condition':
                this.handleSpecialCondition(player, action.data);
                break;
            case 'evolve':
                this.handleEvolve(player, action.data);
                break;
            case 'turn_end':
                this.handleTurnEnd();
                break;
            case 'reflesh_hand':
                this.handleRefleshHand(player);
                break;
            case 'discard':
                this.handleDiscard(player, action.data);
                break;
            case 'discard_from_pokemon':
                this.handleDiscardFromPokemon(player, action.data);
                break;
            case 'shuffle_deck':
                console.log(`${player.name} shuffled their deck`);
                break;
        }
    }

    handleRefleshHand(player) {
        player.hand = [];
    }

    handlePlayPokemonActive(player, data) {
        const pokemon = new Pokemon(new Card(data.pokemonName, 'pokemon'));
        player.activePokemon = pokemon;
        console.log(`${player.name} played ${data.pokemonName} to Active`);
    }

    handlePlayPokemonBench(player, data) {
        const pokemon = new Pokemon(new Card(data.pokemonName, 'pokemon'));
        player.bench.push(pokemon);

        const cardIndex = player.hand.findIndex(c => c.name === data.pokemonName);
        if (cardIndex >= 0) {
            player.hand.splice(cardIndex, 1);
        }
    }

    handleDiscard(player, data) {
        if (data.cards) {
            data.cards.forEach(cardName => {
                // Find card in hand
                const index = player.hand.findIndex(c => c.name === cardName);
                if (index !== -1) {
                    const card = player.hand.splice(index, 1)[0];
                    player.discardPile.push(card);
                } else {
                    // If unknown or not found (e.g. from deck/dummy), just create and push
                    player.discardPile.push(new Card(cardName, 'unknown'));
                }
            });
            console.log(`${player.name} discarded ${data.cards.join(', ')}`);
        }
    }

    handleDiscardFromPokemon(player, data) {
        // Find pokemon active or bench
        let pokemon = null;
        if (player.activePokemon && player.activePokemon.card.name === data.pokemonName) {
            pokemon = player.activePokemon;
        } else {
            pokemon = player.bench.find(p => p.card.name === data.pokemonName);
        }

        if (pokemon) {
            // Check energies
            const energyIndex = pokemon.energies.findIndex(c => c.name === data.cardName);
            if (energyIndex !== -1) {
                const card = pokemon.energies.splice(energyIndex, 1)[0];
                player.discardPile.push(card);
                console.log(`Discarded energy ${data.cardName} from ${data.pokemonName}`);
                return;
            }

            // Check tools
            const toolIndex = pokemon.tools.findIndex(c => c.name === data.cardName);
            if (toolIndex !== -1) {
                const card = pokemon.tools.splice(toolIndex, 1)[0];
                player.discardPile.push(card);
                console.log(`Discarded tool ${data.cardName} from ${data.pokemonName}`);
                return;
            }

            // If not found in attached cards, it might be the pokemon itself (conceptually impossible for 'discarded from')
            // but just in case or if log name mismatch
            console.warn(`Could not find attached card ${data.cardName} on ${data.pokemonName}`);
        } else {
            console.warn(`Could not find pokemon ${data.pokemonName} for discard`);
        }
    }

    handleSwitchActive(player, data) {
        // Find Pokemon on bench by name
        const benchIndex = player.bench.findIndex(p => p.card.name === data.pokemonName);
        if (benchIndex >= 0) {
            const oldActive = player.activePokemon;
            const newActive = player.bench[benchIndex];

            // Swap
            player.activePokemon = newActive;
            player.activePokemon.setActive(true); // New method

            player.bench.splice(benchIndex, 1);

            if (oldActive) {
                oldActive.setActive(false); // New method
                player.bench.push(oldActive);
            }

            console.log(`${player.name} switched ${data.pokemonName} to Active`);
        } else {
            // Pokemon not found on bench, might be new active
            player.activePokemon = new Pokemon(new Card(data.pokemonName, 'pokemon'));
            player.activePokemon.setActive(true); // New method
            console.log(`${player.name} set ${data.pokemonName} as Active (new)`);
        }
    }

    revertAction(action) {
        // For simplicity, we'll rebuild state from scratch
        // This is inefficient but ensures correctness
        // A better approach would be to implement proper undo for each action type
        console.warn('Undo functionality is simplified - rebuilding state');
    }

    handleDraw(player, data, playerKey) {
        if (data.cards) {
            // カード名がある場合は常に追加
            data.cards.forEach(cardName => {
                player.hand.push(new Card(cardName, 'unknown'));
            });
        } else if (data.count) {
            // カード名なしの場合は、枚数分Unknown Cardを追加
            for (let i = 0; i < data.count; i++) {
                player.hand.push(new Card('Unknown Card', 'unknown'));
            }
            // お互いの手札枚数を正しく管理するため、player1/player2関係なく追加する
        }
    }

    handlePlayCard(player, data) {
        // Remove from hand and apply card effect
        const cardIndex = player.hand.findIndex(c => c.name === data.cardName);
        if (cardIndex >= 0) {
            const playedCard = player.hand.splice(cardIndex, 1)[0];
            // Add to discard pile
            player.discardPile.push(playedCard);
            console.log(`${player.name} played ${playedCard.name} (moved to discard)`);
        } else {
            // If card not found in hand (e.g. log discrepancy), still create and discard it for visual consistency
            const placeholderCard = new Card(data.cardName, 'trainer'); // Most played cards are trainers
            player.discardPile.push(placeholderCard);
            console.log(`${player.name} played ${data.cardName} (created and moved to discard)`);
        }
    }

    handlePlayStadium(player, data) {
        // Remove from hand (do NOT discard immediately)
        const cardIndex = player.hand.findIndex(c => c.name === data.cardName);
        if (cardIndex >= 0) {
            player.hand.splice(cardIndex, 1);
        }

        // Check if there is an existing stadium to discard?
        // In a full simulation, we should discard the old stadium to its owner's discard pile.
        // But for this visualizer, simply updating the board variable is sufficient for the user request.

        this.stadium = new Card(data.cardName, 'stadium');
        console.log(`${player.name} played Stadium: ${data.cardName}`);
    }

    handleAttachEnergy(player, data) {
        // Parse target to find correct pokemon
        const targetPokemon = this.findPokemonByTarget(player, data.target);

        if (targetPokemon) {
            targetPokemon.attachEnergy(new Card(data.energyType, 'energy'));
        }

        const cardIndex = player.hand.findIndex(c => c.name === data.cardName);
        if (cardIndex >= 0) {
            player.hand.splice(cardIndex, 1);
        }
    }

    handleAttachTool(player, data) {
        const targetPokemon = this.findPokemonByTarget(player, data.target);

        if (targetPokemon) {
            targetPokemon.attachTool(new Card(data.cardName, 'tool'));
        }

        const cardIndex = player.hand.findIndex(c => c.name === data.cardName);
        if (cardIndex >= 0) {
            player.hand.splice(cardIndex, 1);
        }
    }

    findPokemonByTarget(player, targetStr) {
        const targetLower = targetStr.toLowerCase();

        if (targetLower.includes('active spot')) {
            return player.activePokemon;
        } else if (targetLower.includes('bench')) {
            const pokemonName = targetStr.split(' ')[0];
            return player.bench.find(p => p.card.name === pokemonName);
        } else {
            const pokemonName = targetStr.split(' ')[0];
            if (player.activePokemon && player.activePokemon.card.name === pokemonName) {
                return player.activePokemon;
            } else {
                return player.bench.find(p => p.card.name === pokemonName);
            }
        }
    }

    handleUseAttack(player, opponent, data) {
        // Apply damage from attack if damage is specified
        if (data.damage && data.damage > 0) {
            let targetPokemon = null;
            const targetName = data.target;

            // 1. Check if target is explicitly "Active Spot" or implicitly Active (no target)
            if (!targetName || targetName.toLowerCase().includes('active')) {
                // Damage to opponent's active pokemon
                if (opponent.activePokemon) {
                    targetPokemon = opponent.activePokemon;
                }
            } else {
                // 2. Try to resolve by name
                // The target string might be "Player's PokemonName" or just "PokemonName"

                // Helper to search a player's field for a pokemon by name
                const findPokemonOnField = (p, name) => {
                    if (p.activePokemon && p.activePokemon.card.name === name) return p.activePokemon;
                    return p.bench.find(b => b.card.name === name);
                };

                // Remove owner prefix if present (e.g. "Player2's " or "Player2’s ")
                let cleanTargetName = targetName;
                if (targetName.match(/['’]s /)) {
                    const parts = targetName.split(/['’]s /);
                    // parts[0] is owner name, parts[1] is pokemon name
                    cleanTargetName = parts[1];
                }

                // First check opponent (most likely target of attack)
                targetPokemon = findPokemonOnField(opponent, cleanTargetName);

                // If not found, check self (self-damage attacks exist)
                if (!targetPokemon) {
                    targetPokemon = findPokemonOnField(player, cleanTargetName);
                }
            }

            if (targetPokemon) {
                targetPokemon.takeDamage(data.damage);
                console.log(`Applied ${data.damage} damage to ${targetPokemon.card.name} (Current Damage: ${targetPokemon.damage})`);
            } else {
                console.warn(`Could not find target for attack damage: ${targetName}`);
            }
        }
    }

    handleDamage(player, data) {
        const pokemon = data.target === 'active' ? player.activePokemon : player.bench[data.benchIndex];
        if (pokemon) {
            pokemon.takeDamage(data.amount);
        }
    }

    handleKnockout(player, data) {
        const pokemonName = data.pokemonName;

        const processKnockout = (pokemon) => {
            pokemon.knockout();
            // Discard base card
            player.discardPile.push(pokemon.card);
            // Discard energies
            if (pokemon.energies && pokemon.energies.length > 0) {
                pokemon.energies.forEach(e => player.discardPile.push(e));
            }
            // Discard tools
            if (pokemon.tools && pokemon.tools.length > 0) {
                pokemon.tools.forEach(t => player.discardPile.push(t));
            }
        };

        // Check active pokemon
        if (player.activePokemon && player.activePokemon.card.name === pokemonName) {
            console.log(`Knocking out ${player.name}'s ${pokemonName} (active)`);
            processKnockout(player.activePokemon);
            player.activePokemon = null;
            return;
        }

        // Check bench
        const benchIndex = player.bench.findIndex(p => p.card.name === pokemonName);
        if (benchIndex >= 0) {
            console.log(`Knocking out ${player.name}'s ${pokemonName} (bench)`);
            const pokemon = player.bench[benchIndex];
            processKnockout(pokemon);
            player.bench.splice(benchIndex, 1);
        }
    }

    handleTakePrize(player, data) {
        const count = data.count || 1;
        for (let i = 0; i < count && player.prizeCount > 0; i++) {
            player.prizeCount--;
            // Note: Prize cards are added to hand via separate "was added to" log entries
            // which are parsed as draw actions with actual card names
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

    // Helper to find pokemon by name/target string
    findPokemon(player, targetStr) {
        if (!targetStr) return null;
        const lower = targetStr.toLowerCase();

        // Check active
        if (player.activePokemon && (lower.includes('active') || player.activePokemon.card.name === targetStr)) {
            return player.activePokemon;
        }

        // Check bench
        return player.bench.find(p => p.card.name === targetStr) || null;
    }

    handlePutDamageCounter(player, data) {
        // Target format: "Player's Pokemon" or just "Pokemon"
        let targetOwner = player;
        let pokemonName = data.target;

        if (data.target.includes("'s ")) {
            const parts = data.target.split("'s ");
            const ownerName = parts[0];
            pokemonName = parts[1];

            if (ownerName === this.players.player1.name) targetOwner = this.players.player1;
            else if (ownerName === this.players.player2.name) targetOwner = this.players.player2;
        }

        let pokemon = this.findPokemon(targetOwner, pokemonName);

        // Fallback: If not found on inferred owner, check the other player
        if (!pokemon) {
            const otherPlayer = targetOwner === this.players.player1 ? this.players.player2 : this.players.player1;
            const otherPokemon = this.findPokemon(otherPlayer, pokemonName);
            if (otherPokemon) {
                targetOwner = otherPlayer;
                pokemon = otherPokemon;
                console.log(`Pokemon ${pokemonName} found on opponent's (${otherPlayer.name}) bench/active`);
            }
        }

        if (pokemon) {
            pokemon.takeDamage(data.count * 10);
            console.log(`Put ${data.count} counters on ${targetOwner.name}'s ${pokemon.card.name} (Total: ${pokemon.damage})`);
        } else {
            console.warn(`Could not find pokemon for put_damage_counter: ${data.target}`);
        }
    }

    handleMoveDamageCounter(player, data) {
        const resolveTarget = (targetStr) => {
            let owner = player;
            if (targetStr.includes("'s ")) {
                const parts = targetStr.split("'s ");
                const ownerName = parts[0];
                const pName = parts[1];
                if (ownerName === this.players.player1.name) owner = this.players.player1;
                else if (ownerName === this.players.player2.name) owner = this.players.player2;
                return { owner, name: pName };
            }
            return { owner, name: targetStr };
        };

        const from = resolveTarget(data.from);
        const to = resolveTarget(data.to);

        const fromPokemon = this.findPokemon(from.owner, from.name);
        const toPokemon = this.findPokemon(to.owner, to.name);

        const amount = data.count * 10;

        if (fromPokemon) fromPokemon.heal(amount);
        if (toPokemon) toPokemon.takeDamage(amount);

        console.log(`Moved ${data.count} counters from ${from.name} to ${to.name}`);
    }

    handleSpecialConditionDamage(player, data) {
        const pokemon = this.findPokemon(player, data.pokemonName);
        if (pokemon) {
            pokemon.takeDamage(data.count * 10);
        }
    }

    handleSpecialCondition(player, data) {
        const pokemon = this.findPokemon(player, data.pokemonName);
        if (pokemon) {
            pokemon.addSpecialCondition(data.condition);
        }
    }

    handleEvolve(player, data) {
        const pokemon = this.findPokemon(player, data.from);
        if (pokemon) {
            console.log(`Evolved ${player.name}'s ${data.from} to ${data.to}`);
            pokemon.evolve(data.to);

            // Consume card from hand
            const cardIndex = player.hand.findIndex(c => c.name === data.to);
            if (cardIndex >= 0) {
                player.hand.splice(cardIndex, 1);
            }
        } else {
            console.warn(`Could not find pokemon to evolve: ${data.from} -> ${data.to}`);
        }
    }

    reset() {
        this.players.player1.reset();
        this.players.player2.reset();
        this.activePlayer = this.initialStartingPlayer || 'player1';
        this.turnNumber = 1;
        this.stadium = null;
        this.currentActionIndex = 0;
        this.isGameOver = false;
        this.winner = null;

        if (this.initialSetup) {
            this.initializeFromSetup(this.initialSetup);
        }
    }
}

class PlayerState {
    constructor(name) {
        this.name = name;
        this.deck = 60;
        this.hand = [];
        this.handCount = 0;
        this.prizeCount = 6;
        this.prizeCards = [];
        this.activePokemon = null;
        this.bench = [];
        this.discardPile = [];
        this.lostZone = [];
        this.vstarUsed = false;
    }

    reset() {
        this.deck = 60;
        this.hand = [];
        this.handCount = 0;
        this.prizeCount = 6;
        this.prizeCards = [];
        this.activePokemon = null;
        this.bench = [];
        this.discardPile = [];
        this.lostZone = [];
        this.vstarUsed = false;
    }

    initializeFromSetup(setupData) {
        if (setupData.activePokemon) {
            this.activePokemon = new Pokemon(new Card(setupData.activePokemon, 'pokemon'));
            this.activePokemon.setActive(true);
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
        this.hp = 100; // Deprecated but kept for UI compatibility
        this.maxHp = 100; // Deprecated but kept for UI compatibility
        this.damage = 0;
        this.energies = [];
        this.tools = [];
        this.specialConditions = [];
        this.evolutionStage = 0;
        this.isKnockedOut = false;
        this.isActive = false; // New property
    }

    takeDamage(amount) {
        this.damage += amount;
    }

    heal(amount) {
        this.damage = Math.max(0, this.damage - amount);
    }

    attachEnergy(card) {
        this.energies.push(card);
    }

    attachTool(card) {
        this.tools.push(card);
    }

    discardAttachedCard(cardName) {
        // Find in energies
        const eIndex = this.energies.findIndex(c => c.name === cardName);
        if (eIndex !== -1) {
            return this.energies.splice(eIndex, 1)[0];
        }

        // Find in tools
        const tIndex = this.tools.findIndex(c => c.name === cardName);
        if (tIndex !== -1) {
            return this.tools.splice(tIndex, 1)[0];
        }

        return null;
    }

    evolve(newCardName) {
        this.card = new Card(newCardName, 'pokemon');
        this.evolutionStage++;
        this.specialConditions = []; // Evolution clears special conditions
    }

    addSpecialCondition(condition) {
        if (!this.specialConditions.includes(condition)) {
            this.specialConditions.push(condition);
        }
    }

    clearConditions() {
        this.specialConditions = [];
    }

    knockout() {
        this.isKnockedOut = true;
    }

    setActive(isActive) {
        this.isActive = isActive;
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
