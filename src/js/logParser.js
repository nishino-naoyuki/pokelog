// Log Parser Module
// Parses PTCGL log files and extracts game data

import { Action } from './gameState.js';

class LogParser {
    constructor() {
        this.lines = [];
        this.currentLine = 0;
    }

    parse(logContent) {
        try {
            this.lines = logContent.split('\n').map(line => line.trim());
            this.currentLine = 0;

            const result = {
                success: true,
                data: {
                    player1Name: null,
                    player2Name: null,
                    setup: {},
                    actions: []
                }
            };

            // Parse Setup section
            if (this.lines[0] === 'Setup') {
                this.currentLine = 1;
                result.data.setup = this.parseSetup();
            }

            // Parse Turns
            while (this.currentLine < this.lines.length) {
                const line = this.lines[this.currentLine];

                if (line.startsWith('Turn #')) {
                    this.parseTurn(result.data.actions);
                } else {
                    this.currentLine++;
                }
            }

            // Extract player names from actions or setup
            this.extractPlayerNames(result.data);

            return result;

        } catch (error) {
            console.error('Parse error:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    parseSetup() {
        const setup = {
            coinToss: null,
            startingPlayer: null,
            player1Name: null,
            player2Name: null,
            player1: { hand: [], activePokemon: null, bench: [] },
            player2: { hand: [], activePokemon: null, bench: [] }
        };

        while (this.currentLine < this.lines.length && !this.lines[this.currentLine].startsWith('Turn #')) {
            const line = this.lines[this.currentLine];

            // Extract coin toss
            if (line.includes('won the coin toss')) {
                const match = line.match(/^(.+?) won the coin toss/);
                if (match) setup.coinToss = match[1];
            }

            // Extract initial active and bench pokemon
            if (line.includes('played') && line.includes('to the Active Spot')) {
                const match = line.match(/^(.+?) played (.+?) to the Active Spot/);
                if (match) {
                    const playerData = this.getPlayerSetupData(setup, match[1]);
                    if (playerData) playerData.activePokemon = match[2];
                }
            }

            if (line.includes('played') && line.includes('to the Bench')) {
                const match = line.match(/^(.+?) played (.+?) to the Bench/);
                if (match) {
                    const playerData = this.getPlayerSetupData(setup, match[1]);
                    if (playerData) playerData.bench.push(match[2]);
                }
            }

            this.currentLine++;
        }

        return setup;
    }

    getPlayerSetupData(setup, playerName) {
        // Assign players to player1/player2 on first encounter
        if (!setup.player1Name) {
            setup.player1Name = playerName;
            return setup.player1;
        } else if (setup.player1Name === playerName) {
            return setup.player1;
        } else {
            if (!setup.player2Name) {
                setup.player2Name = playerName;
            }
            return setup.player2;
        }
    }

    parseTurn(actions) {
        // Parse turn header: "Turn # X - Player's Turn"
        const turnLine = this.lines[this.currentLine];
        const turnMatch = turnLine.match(/Turn # (\d+) - (.+?)'s Turn/);

        if (!turnMatch) {
            this.currentLine++;
            return;
        }

        const turnNumber = parseInt(turnMatch[1]);
        const playerName = turnMatch[2];
        this.currentLine++;

        // Parse actions until next turn or end
        while (this.currentLine < this.lines.length) {
            const line = this.lines[this.currentLine];

            // Stop if we hit next turn
            if (line.startsWith('Turn #')) {
                break;
            }

            // Empty lines
            if (line === '') {
                this.currentLine++;
                continue;
            }

            // Parse action
            const action = this.parseAction(line, playerName, actions.length);
            if (action) {
                actions.push(action);
            }

            this.currentLine++;
        }

        // Add turn end action
        actions.push(new Action('turn_end', this.getPlayerKey(playerName), { turnNumber }, actions.length));
    }

    parseAction(line, playerName, timestamp) {
        // Skip child task markers but don't skip the line
        let cleanLine = line;
        if (line.startsWith('-')) {
            cleanLine = line.substring(1).trim();
            // Don't return early - process the cleaned line
        }

        // Play Pokemon to Active Spot
        if (cleanLine.includes('played') && cleanLine.includes('to the Active Spot')) {
            const match = cleanLine.match(/^(.+?) played (.+?) to the Active Spot/);
            if (match) {
                return new Action('play_pokemon_active', this.getPlayerKey(match[1]), {
                    pokemonName: match[2]
                }, timestamp);
            }
        }

        // Play Pokemon to Bench
        if (cleanLine.includes('played') && cleanLine.includes('to the Bench')) {
            const match = cleanLine.match(/^(.+?) played (.+?) to the Bench/);
            if (match) {
                return new Action('play_pokemon_bench', this.getPlayerKey(match[1]), {
                    pokemonName: match[2]
                }, timestamp);
            }
        }

        // Pokemon is now in Active Spot (switch)
        if (cleanLine.includes('is now in the Active Spot')) {
            const match = cleanLine.match(/^(.+?)'s (.+?) is now in the Active Spot/);
            if (match) {
                return new Action('switch_active', this.getPlayerKey(match[1]), {
                    pokemonName: match[2]
                }, timestamp);
            }
        }

        // Draw card
        if (cleanLine.match(/drew (a card|[\w\s]+)\.?$/)) {
            const match = cleanLine.match(/^(.+?) drew (.+)\.?$/);
            if (match) {
                const cardName = match[2] === 'a card' ? 'Unknown Card' : match[2];
                return new Action('draw', this.getPlayerKey(match[1]), { cards: [cardName] }, timestamp);
            }
        }

        // Drew multiple cards
        if (cleanLine.match(/drew (\d+) cards/)) {
            const match = cleanLine.match(/^(.+?) drew (\d+) cards/);
            if (match) {
                return new Action('draw', this.getPlayerKey(match[1]), { count: parseInt(match[2]) }, timestamp);
            }
        }

        // Play card (Trainer/Item/Stadium) - exclude Pokemon plays which were handled above
        if (cleanLine.includes('played') && !cleanLine.includes('to the Active Spot') && !cleanLine.includes('to the Bench')) {
            const match = cleanLine.match(/^(.+?) played (.+?)\.?$/);
            if (match) {
                return new Action('play_card', this.getPlayerKey(match[1]), { cardName: match[2] }, timestamp);
            }
        }

        // Attach energy
        if (cleanLine.includes('attached') && cleanLine.includes('Energy')) {
            const match = cleanLine.match(/^(.+?) attached (.+?) to (.+)/);
            if (match) {
                return new Action('attach_energy', this.getPlayerKey(match[1]), {
                    energyType: match[2],
                    target: match[3]
                }, timestamp);
            }
        }

        // Use attack (with damage)
        if (cleanLine.includes('used') && cleanLine.includes('on') && cleanLine.includes('for') && cleanLine.includes('damage')) {
            const match = cleanLine.match(/^(.+?)'s (.+?) used (.+?) on (.+?) for (\d+) damage/);
            if (match) {
                return new Action('use_attack', this.getPlayerKey(match[1]), {
                    pokemonName: match[2],
                    attackName: match[3],
                    target: match[4],
                    damage: parseInt(match[5])
                }, timestamp);
            }
        }

        // Use attack (without explicit damage - like support moves)
        if (cleanLine.includes('used') && cleanLine.includes("'s") && !cleanLine.includes('on')) {
            const match = cleanLine.match(/^(.+?)'s (.+?) used (.+?)\.?$/);
            if (match) {
                return new Action('use_attack', this.getPlayerKey(match[1]), {
                    pokemonName: match[2],
                    attackName: match[3],
                    damage: 0
                }, timestamp);
            }
        }

        // Knockout
        if (cleanLine.includes('was Knocked Out')) {
            const match = cleanLine.match(/^(.+?)'s (.+?) was Knocked Out!/);
            if (match) {
                return new Action('knockout', this.getPlayerKey(match[1]), {
                    pokemonName: match[2]
                }, timestamp);
            }
        }

        // Take prize
        if (cleanLine.includes('took') && cleanLine.includes('Prize')) {
            const match = cleanLine.match(/^(.+?) took (\d+) Prize card/);
            if (match) {
                return new Action('take_prize', this.getPlayerKey(match[1]), {
                    count: parseInt(match[2])
                }, timestamp);
            }
        }

        // Evolve
        if (cleanLine.includes('evolved')) {
            const match = cleanLine.match(/^(.+?) evolved (.+?) to (.+)/);
            if (match) {
                return new Action('evolve', this.getPlayerKey(match[1]), {
                    from: match[2],
                    to: match[3]
                }, timestamp);
            }
        }

        // Retreat
        if (cleanLine.includes('retreated')) {
            const match = cleanLine.match(/^(.+?) retreated (.+?) to the Bench/);
            if (match) {
                return new Action('retreat', this.getPlayerKey(match[1]), {
                    pokemon: match[2]
                }, timestamp);
            }
        }

        return null;
    }

    getPlayerKey(playerName) {
        // This is simplified - in real implementation we'd track player names
        // For now, we'll use a simple mapping
        return playerName.includes('Smile') || playerName.includes('0512') ? 'player1' : 'player2';
    }

    extractPlayerNames(data) {
        // Extract from setup first
        if (data.setup.player1Name) {
            data.player1Name = data.setup.player1Name;
        }
        if (data.setup.player2Name) {
            data.player2Name = data.setup.player2Name;
        }

        // If still not found, extract from actions
        if (!data.player1Name || !data.player2Name) {
            const playerNames = new Set();

            for (let i = 0; i < this.lines.length && i < 50; i++) {
                const line = this.lines[i];
                const match = line.match(/^([^\s]+)/);
                if (match && match[1] !== 'Turn' && match[1] !== 'Setup') {
                    playerNames.add(match[1]);
                }
            }

            const names = Array.from(playerNames);
            if (!data.player1Name && names[0]) data.player1Name = names[0];
            if (!data.player2Name && names[1]) data.player2Name = names[1];
        }
    }
}

export { LogParser };
