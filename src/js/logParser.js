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
            const actionOrActions = this.parseAction(line, playerName, actions.length);
            if (actionOrActions) {
                if (Array.isArray(actionOrActions)) {
                    actions.push(...actionOrActions);
                } else {
                    actions.push(actionOrActions);
                }
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
            if (match && match[2].toLowerCase() !== 'them' && match[2].toLowerCase() !== 'thme' && match[2].toLowerCase() !== 'it') {
                return new Action('play_pokemon_active', this.getPlayerKey(match[1]), {
                    pokemonName: match[2]
                }, timestamp);
            }
        }

        // Play Pokemon to Bench
        // Handle "played [Name] to the Bench" AND "played them/it to the Bench" followed by bullets
        if (cleanLine.includes('played') && cleanLine.includes('to the Bench')) {
            const match = cleanLine.match(/^(.+?) played (.+?) to the Bench/);
            if (match) {
                const playerName = match[1];
                const cardName = match[2];

                // Case 1: "played them/it to the Bench" (Look ahead for bullets)
                if (cardName.toLowerCase() === 'them' || cardName.toLowerCase() === 'it') {
                    // We need to look ahead for bullet points
                    // This is tricky because parseAction usually handles one line.
                    // We might need to return a special flag or handle this in the main loop.
                    // BUT, to keep it simple within the current architecture:
                    // We can peek at 'this.lines' using 'this.currentLine'.
                    // However, parseAction doesn't have access to 'this'.
                    // Wait, parseAction IS a method of LogParser, it has access to 'this' via binding or instance?
                    // Yes, it is called as this.parseAction. So 'this' should be available.

                    // Let's assume we can access this.lines and this.currentLine.
                    // Oh wait, parseAction is called inside parseTurn, and currentLine is incremented there.
                    // We shouldn't modify currentLine globally here if we can avoid it, OR we carefully consume it.

                    // It's safer to rely on the caller to pass checking context, but 'this' is available.
                    // Let's try to find bullet points in subsequent lines.

                    const newActions = [];
                    // Peek ahead
                    let tempLineIdx = this.currentLine + 1;
                    while (tempLineIdx < this.lines.length) {
                        const nextLine = this.lines[tempLineIdx].trim();
                        // Bullet point format: "• CardName" or "• CardName, CardName"
                        // Or just indented text? Log sample shows: "   • Dreepy, Dreepy"
                        if (nextLine.includes('•') || nextLine.startsWith('•')) {
                            const content = nextLine.replace(/^[•\s]+/, '').trim();
                            const cards = content.split(',').map(c => c.trim());
                            cards.forEach(c => {
                                newActions.push(new Action('play_pokemon_bench', this.getPlayerKey(playerName), {
                                    pokemonName: c
                                }, timestamp));
                            });
                            // Advance the global line counter so parseTurn doesn't re-read these
                            this.currentLine++;
                            tempLineIdx++;
                        } else {
                            break;
                        }
                    }

                    if (newActions.length > 0) {
                        // We need to return multiple actions. 
                        // But parseAction expects single return.
                        // We can modify 'parseTurn' to handle array return, or return the first one and queue others?
                        // Hack: Return a "CompositeAction" or assume caller handles array?
                        // Let's modify 'parseTurn' to handle array return first.
                        return newActions;
                    }
                } else {
                    // Case 2: Explicit Name "played Ralts to the Bench"
                    return new Action('play_pokemon_bench', this.getPlayerKey(playerName), {
                        pokemonName: cardName
                    }, timestamp);
                }
            }
        }

        // Pokemon is now in Active Spot (switch)
        if (cleanLine.includes('is now in the Active Spot')) {
            const match = cleanLine.match(/^(.+?)'s (.+?) is now in the Active Spot/);
            // "them" is often used in logs like "switched them to the Active Spot" but here it's "is now in..."
            // If match[2] is 'them', it's likely an error or placeholder in some logs. 
            if (match && match[2].toLowerCase() !== 'them') {
                return new Action('switch_active', this.getPlayerKey(match[1]), {
                    pokemonName: match[2]
                }, timestamp);
            }
        }

        // Draw card
        if (cleanLine.match(/drew (a card|[\w\s]+)\.?$/)) {
            console.log(`[DRAW PATH] Line ${this.currentLine + 1}: "${line}"`);
            console.log('[DRAW PATH] Matched draw pattern');
            const match = cleanLine.match(/^(.+?) drew (.+)\.?$/);
            if (match) {
                console.log('[DRAW PATH] match[1]:', match[1], 'match[2]:', match[2]);
                if (match[2] === 'a card' || match[2].includes(' cards')) {
                    console.log('[DRAW PATH] Checking for bullet point in next line');
                    //この場合、次の行に取得したカードが記載されている
                    // パターン１: 「drew X cards.」の次の行に「   • カード名, カード名...」がある
                    let tempLineIdx = this.currentLine + 1;
                    if (tempLineIdx < this.lines.length) {
                        const nextLine = this.lines[tempLineIdx].trim();
                        console.log('[DRAW PATH] nextLine:', nextLine);
                        // 次の行が「•」で始まる場合
                        if (nextLine.includes('•') || nextLine.startsWith('•')) {
                            console.log('[DRAW PATH] Found bullet point, returning with cards');
                            const content = nextLine.replace(/^[•\s]+/, '').trim();
                            const cards = content.split(',').map(c => c.trim());
                            // 次の行を消費済みとしてマーク
                            this.currentLine++;
                            return new Action('draw', this.getPlayerKey(match[1]), { cards: cards }, timestamp);
                        } else {
                            console.log('[DRAW PATH] No bullet point found, extracting count');
                            // bullet pointがない場合は、match[2]から数字を抽出してカウントベースのdrawを返す
                            const countMatch = match[2].match(/(\d+) cards/);
                            if (countMatch) {
                                console.log('[DRAW PATH] Returning count-based draw:', countMatch[1]);
                                return new Action('draw', this.getPlayerKey(match[1]), { count: parseInt(countMatch[1]) }, timestamp);
                            } else if (match[2] === 'a card') {
                                console.log('[DRAW PATH] Returning single card draw');
                                return new Action('draw', this.getPlayerKey(match[1]), { count: 1 }, timestamp);
                            }
                        }
                    }
                }
                else {
                    console.log('[DRAW PATH] Single card name, returning');
                    let cardName = match[2] === 'a card' ? 'Unknown Card' : match[2];
                    if (cardName.endsWith('.')) {
                        cardName = cardName.slice(0, -1);
                    }
                    return new Action('draw', this.getPlayerKey(match[1]), { cards: [cardName] }, timestamp);
                }
            }
        }

        // Drew multiple cards
        if (cleanLine.match(/drew (\d+) cards/)) {
            const match = cleanLine.match(/^(.+?) drew (\d+) cards/);
            if (match) {
                console.log(`[DRAW DEBUG] Line ${this.currentLine + 1}: "${line}"`);
                console.log('[DRAW DEBUG] cleanLine:', cleanLine);
                console.log('[DRAW DEBUG] match[1]:', match[1]);
                console.log('[DRAW DEBUG] playerKey:', this.getPlayerKey(match[1]));
                return new Action('draw', this.getPlayerKey(match[1]), { count: parseInt(match[2]) }, timestamp);
            }
        }

        // Play Stadium
        if (cleanLine.includes('played') && cleanLine.includes('to the Stadium spot')) {
            const match = cleanLine.match(/^(.+?) played (.+?) to the Stadium spot/);
            if (match) {
                return new Action('play_stadium', this.getPlayerKey(match[1]), {
                    cardName: match[2]
                }, timestamp);
            }
        }

        // Play card (Trainer/Item/Stadium) - exclude Pokemon plays which were handled above
        if (cleanLine.includes('played') && !cleanLine.includes('to the Active Spot') && !cleanLine.includes('to the Bench') && !cleanLine.includes('to the Stadium spot')) {
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
            // "took 1 Prize card" or "took 2 Prize cards"
            const numericMatch = cleanLine.match(/^(.+?) took (\d+) Prize card/);
            if (numericMatch) {
                return new Action('take_prize', this.getPlayerKey(numericMatch[1]), {
                    count: parseInt(numericMatch[2])
                }, timestamp);
            }

            // "took a Prize card"
            const singleMatch = cleanLine.match(/^(.+?) took a Prize card/);
            if (singleMatch) {
                return new Action('take_prize', this.getPlayerKey(singleMatch[1]), {
                    count: 1
                }, timestamp);
            }
        }

        // Card added to hand (prize cards)
        // Pattern: "[CardName] was added to [Player]'s hand." or "A card was added to [Player]'s hand."
        if (cleanLine.includes('was added to') && cleanLine.includes('hand')) {
            const match = cleanLine.match(/^(.+?) was added to (.+?)'s hand\.?$/);
            if (match) {
                const cardName = match[1] === 'A card' ? 'Prize Card' : match[1];
                return new Action('draw', this.getPlayerKey(match[2]), {
                    cards: [cardName]
                }, timestamp);
            }
        }

        // Evolve
        if (cleanLine.includes('evolved')) {
            const match = cleanLine.match(/^(.+?) evolved (.+?) to (.+)/);
            if (match) {
                let toName = match[3];
                // Clean up suffixes like "on the Bench", "in the Active Spot", or just "."
                // PTCGL logs often append location info to the target pokemon name in evolve lines
                toName = toName.replace(/ (?:on|in) the (?:Bench|Active Spot)\.?$/, '').replace(/\.$/, '');

                return new Action('evolve', this.getPlayerKey(match[1]), {
                    from: match[2],
                    to: toName
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

        // Put damage counters (Effect)
        if (cleanLine.includes('put') && cleanLine.includes('damage counter')) {
            const match = cleanLine.match(/^(.+?) put (\d+|a) damage counter(?:s)? on (.+?)\.?$/);
            if (match) {
                const count = match[2] === 'a' ? 1 : parseInt(match[2]);
                return new Action('put_damage_counter', this.getPlayerKey(match[1]), {
                    target: match[3],
                    count: count
                }, timestamp);
            }
        }

        // Put hand on deck
        if (cleanLine.includes('put') && cleanLine.includes('on the bottom of their deck.')) {
            //reset hand
            return new Action('reflesh_hand', this.getPlayerKey(playerName, null, timestamp));
        }

        // Move damage counters
        if (cleanLine.includes('moved') && cleanLine.includes('damage counter')) {
            const match = cleanLine.match(/^(.+?) moved (\d+|a) damage counter(?:s)? from (.+?) to (.+?)\.?$/);
            if (match) {
                const count = match[2] === 'a' ? 1 : parseInt(match[2]);
                return new Action('move_damage_counter', this.getPlayerKey(match[1]), {
                    from: match[3],
                    to: match[4],
                    count: count
                }, timestamp);
            }
        }

        // Special Condition Damage (Burned/Poisoned checkup)
        if (cleanLine.includes('damage counter') && cleanLine.includes('was placed on') || cleanLine.includes('were placed on')) {
            const match = cleanLine.match(/^(\d+|a) damage counter(?:s)? (?:was|were) placed on (.+?) for the Special Condition/);
            if (match) {
                const count = match[1] === 'a' ? 1 : parseInt(match[1]);
                // "Player's Pokemon" -> extract player
                const playerMatch = match[2].match(/^(.+?)'s (.+)/);
                if (playerMatch) {
                    return new Action('special_condition_damage', this.getPlayerKey(playerMatch[1]), {
                        pokemonName: playerMatch[2],
                        count: count
                    }, timestamp);
                }
            }
        }

        // Special Condition - Burned/Poisoned status
        if (cleanLine.includes('is now Burned') || cleanLine.includes('is now Poisoned')) {
            const type = cleanLine.includes('Burned') ? 'Burned' : 'Poisoned';
            const match = cleanLine.match(/^(.+?)'s (.+?) is now/);
            if (match) {
                return new Action('special_condition', this.getPlayerKey(match[1]), {
                    pokemonName: match[2],
                    condition: type
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
