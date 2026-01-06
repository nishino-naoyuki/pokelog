// UI Rendering Module
// Handles rendering game state to the DOM

import { MessageTranslator } from './messageTranslator.js';

class UI {
    constructor(cardMapper) {
        this.translator = new MessageTranslator();
        this.cardMapper = cardMapper;
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

        // Visual Turn Indicator (Glow)
        const p1Active = document.getElementById('player-active');
        const p2Active = document.getElementById('opponent-active');

        if (p1Active && p2Active) {
            if (gameState.activePlayer === 'player1') {
                p1Active.classList.add('turn-active');
                p2Active.classList.remove('turn-active');
            } else {
                p1Active.classList.remove('turn-active');
                p2Active.classList.add('turn-active');
            }
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

        // ① 先に「カードのDOM」を全部作る（この段階では container にまだ追加しない）
        const cardPromises = hand.map(card => {
            console.log('Rendering hand card:', card);
            return this.createHandCard(card, cardMapper);
        });

        const cardEls = await Promise.all(cardPromises);

        // ② できあがったカードを「一気に置き換え」る
        //    → 古い要素は全部消えて、新しい要素に差し替え（空の状態は画面に出ない）
        container.replaceChildren(...cardEls);
    }

    async renderStadium(stadium, cardMapper) {
        const container = document.getElementById('stadium-card');
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

        if (pokemon.specialConditions.length > 0) {
            const conditions = document.createElement('div');
            conditions.className = 'special-conditions';
            pokemon.specialConditions.forEach(condition => {
                const icon = this.getConditionIcon(condition);
                conditions.textContent += icon;
            });
            card.appendChild(conditions);
        }

        // Knocked Out Effect
        if (pokemon.isKnockedOut) {
            card.classList.add('knocked-out');
            const koOverlay = document.createElement('div');
            koOverlay.className = 'knockout-overlay';
            koOverlay.textContent = 'きぜつ'; // Request: Japanese
            card.appendChild(koOverlay);
        }

        // Energy display
        if (pokemon.energies.length > 0) {
            const energyDisplay = document.createElement('div');
            energyDisplay.className = 'energy-display';
            pokemon.energies.forEach(energy => {
                const icon = this.getEnergyIcon(energy.name);
                energyDisplay.innerHTML += icon;
            });
            card.appendChild(energyDisplay);
        }

        if (pokemon.tools.length > 0) {
            // Visualizing the tool BEHIND the pokemon card
            // We'll create a container or place it absolutely within the card
            // Request: "See tool name and image slightly". Z-Order lowest.

            pokemon.tools.forEach((tool, index) => {
                const toolEl = document.createElement('div');
                toolEl.className = 'attached-tool';
                toolEl.style.zIndex = '-1'; // Behind

                // Offset to make it visible
                // Shift right/down or top/left?
                // Example: slightly to the left and top
                toolEl.style.top = '-15px';
                toolEl.style.left = '-15px';
                toolEl.style.transform = `rotate(-5deg)`;

                const img = document.createElement('img');
                // Use placeholder initially or empty
                img.src = '';

                toolEl.appendChild(img);
                card.appendChild(toolEl);

                // Fetch image async
                cardMapper.getCardImage(tool.name).then(src => {
                    img.src = src;
                }).catch(err => {
                    console.warn('Failed to load tool image:', tool.name);
                });
            });
        }

        // Check for new active status for animation (logic needs to drive this class)
        // For now, PlaybackController might need to trigger specific animations
        // BUT, we can check if this is the "new active" based on a flag or previous state?
        // Simpler: Trigger animation explicitly via methods like showAttackEffect.

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

        // Update stack visualization
        const stackId = elementId.replace('count', 'stack');
        const stackEl = document.getElementById(stackId);
        if (stackEl) {
            stackEl.innerHTML = '';
            for (let i = 0; i < count; i++) {
                const cardIcon = document.createElement('div');
                cardIcon.className = 'prize-card-icon';
                stackEl.appendChild(cardIcon);
            }
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

    showPlayedCard(cardName, cardMapper) {
        // This will be called by PlaybackController
        // We can use EffectsRenderer for this, but since UI has access to cardMapper, maybe UI handles image fetching
        // Let's assume UI delegates to a new method which creates the overlay
        this.renderPlayedCardOverlay(cardName, cardMapper);
    }

    async renderPlayedCardOverlay(cardName, cardMapper) {
        // Create overlay
        const overlay = document.createElement('div');
        overlay.className = 'played-card-overlay';

        const img = document.createElement('img');
        img.className = 'played-card-image';
        img.src = await cardMapper.getCardImage(cardName);

        const label = document.createElement('div');
        label.className = 'played-card-label';
        label.textContent = cardName;

        overlay.appendChild(img);
        overlay.appendChild(label);
        document.body.appendChild(overlay);

        // Remove after animation
        setTimeout(() => {
            overlay.remove();
        }, 2500);
    }

    showAttackEffect(sourceEl, targetEl, type = 'normal') {
        if (!targetEl) return;

        // Simple flash and shake
        targetEl.style.transition = 'filter 0.1s, transform 0.1s';
        targetEl.style.filter = 'brightness(2) sepia(1) hue-rotate(-50deg) saturate(5)'; // Flash Red
        targetEl.style.transform = 'translate(5px, 0)';

        setTimeout(() => {
            targetEl.style.transform = 'translate(-5px, 0)';
        }, 50);

        setTimeout(() => {
            targetEl.style.transform = 'translate(5px, 0)';
        }, 100);

        setTimeout(() => {
            targetEl.style.transform = 'translate(0, 0)';
            targetEl.style.filter = 'none';
        }, 150);

        // Damage Number
        const damageEl = document.createElement('div');
        damageEl.className = 'damage-animation';
        damageEl.textContent = type === 'strong' ? '!!!' : '!';
        // Reuse damage counter style but larger
        damageEl.style.cssText = `
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            font-size: 64px;
            font-weight: bold;
            color: #FF0000;
            text-shadow: 2px 2px 0 #FFF;
            z-index: 100;
            pointer-events: none;
            animation: fadeUp 1s ease-out forwards;
        `;

        // Add keyframes if not exists
        if (!document.getElementById('anim-style')) {
            const style = document.createElement('style');
            style.id = 'anim-style';
            style.textContent = `
                @keyframes fadeUp {
                    0% { opacity: 1; transform: translate(-50%, -50%); }
                    100% { opacity: 0; transform: translate(-50%, -150%); }
                }
            `;
            document.head.appendChild(style);
        }

        targetEl.appendChild(damageEl);

        setTimeout(() => {
            damageEl.remove();
        }, 1000);
    }

    showTrashEffect(sourceEl, type = 'discard') {
        const overlay = document.querySelector('.played-card-overlay-js');
        const sourceCheck = sourceEl || overlay;
        if (!sourceCheck) return;

        const rect = sourceEl ? sourceEl.getBoundingClientRect() : (overlay ? overlay.querySelector('img').getBoundingClientRect() : { top: 0, left: 0, width: 0, height: 0 });
        const clone = sourceEl ? sourceEl.cloneNode(true) : overlay.querySelector('img').cloneNode(true);

        // Style the clone for animation start
        clone.style.cssText = `
            position: fixed;
            top: ${rect.top}px;
            left: ${rect.left}px;
            width: ${rect.width}px;
            height: ${rect.height}px;
            z-index: 4000;
            pointer-events: none;
            transition: none;
        `;

        // Get target (Discard Pile)
        const isPlayer = sourceEl.closest('.player-area') || sourceEl.id.includes('player') || sourceEl.classList.contains('player-hand');
        // If source is null or generic, try to determine from state or default to player?
        // Actually logParser knows player.

        // Find discard pile element
        // We need to look for 'discard-pile' class inside 'player-area' or 'opponent-area'
        const discardPile = isPlayer
            ? document.querySelector('.self-area .discard-pile')
            : document.querySelector('.opponent-area .discard-pile');

        if (discardPile) {
            const targetRect = discardPile.getBoundingClientRect();

            // Calculate destination CSS variables for the keyframe animation
            // The animation keyframe uses translate(var(--tx), var(--ty)) relative to initial position
            // Initial: top/left are fixed.
            // transform: translate(-50%, -50%) is used for centering.
            // Wait, showPlayedCard centers it using fixed 50% 50%.

            // If source was 'showPlayedCard' overlay, it's at fixed top:50%, left:50%
            // and has translate(-50%, -50%).

            // Let's assume this is called on the 'played-card-overlay' element?
            // playbackController.js calls: this.ui.showTrashEffect(handEl, 'discard');
            // Wait, it passes 'handEl' (the whole hand container?). That's wrong.
            // It should pass the specific card, or we simulate from center.

            // Refactored approach:
            // 1. If we have a played card overlay, animate THAT to trash.
            // 2. If generic discard, animate from source to trash.

            const overlay = document.querySelector('.played-card-overlay');
            const targetEl = overlay || clone;

            if (overlay) {
                // If there's an overlay, we animate IT to the trash
                // Overlay is fixed 50% 50%.
                const startX = window.innerWidth / 2;
                const startY = window.innerHeight / 2;

                const endX = targetRect.left + targetRect.width / 2;
                const endY = targetRect.top + targetRect.height / 2;

                const deltaX = endX - startX;
                const deltaY = endY - startY;

                targetEl.style.setProperty('--tx', `${deltaX}px`);
                targetEl.style.setProperty('--ty', `${deltaY}px`);

                targetEl.classList.remove('played-card-overlay'); // Remove old animation
                void targetEl.offsetWidth; // Trigger reflow
                targetEl.classList.add('animate-fly-trash');

                // Cleanup after animation
                setTimeout(() => {
                    targetEl.remove();
                }, 1000); // Match animation duration

                return; // Done
            }
        }

        // Fallback for non-overlay discard (e.g. from hand directly)
        // Not implementing detailed hand-to-trash for now as user asked specifically for "Played Card -> Trash"
        if (clone && sourceEl !== document.body) {
            // Generic discard fallback
            // We want to move it to trash
            const targetRect = discardPile ? discardPile.getBoundingClientRect() : { top: 0, left: 0, width: 0, height: 0 };

            // Calculate destination
            const startX = rect.left + rect.width / 2;
            const startY = rect.top + rect.height / 2;
            const endX = targetRect.left + targetRect.width / 2;
            const endY = targetRect.top + targetRect.height / 2;

            const deltaX = endX - startX;
            const deltaY = endY - startY;

            document.body.appendChild(clone);

            clone.style.transition = 'transform 0.5s ease-in, opacity 0.5s ease-in';
            // Scale down as it goes to trash
            requestAnimationFrame(() => {
                clone.style.transform = `translate(${deltaX}px, ${deltaY}px) scale(0.2)`;
                clone.style.opacity = '0.5';
            });

            setTimeout(() => clone.remove(), 500);
        }
    }

    animateDraw(playerKey, data) {
        const isPlayer = playerKey === 'player1'; // Assuming player1 is Self
        const deckEl = isPlayer
            ? document.querySelector('.self-area .deck-pile')
            : document.querySelector('.opponent-area .deck-pile');

        const handEl = isPlayer
            ? document.getElementById('player-hand')
            : document.querySelector('.opponent-area'); // Opponent hand is hidden/virtual usually? 

        if (!deckEl || !handEl) return;

        const deckRect = deckEl.getBoundingClientRect();
        const handRect = handEl.getBoundingClientRect();

        // Check if data is array (specific cards) or number
        let count = 0;
        let cardNames = [];

        if (Array.isArray(data)) {
            count = data.length;
            cardNames = data;
        } else {
            count = data;
        }

        for (let i = 0; i < count; i++) {
            const cardName = cardNames[i];
            const isNamedCard = cardName && cardName !== 'Unknown Card';

            // Don't show individual messages - we'll show all at once after loop

            const card = document.createElement('div');
            card.className = 'animate-fly-draw';

            // Start position (Deck)
            card.style.top = `${deckRect.top}px`;
            card.style.left = `${deckRect.left}px`;

            // If named card, show the image
            if (isNamedCard) {
                const img = document.createElement('img');
                img.className = 'card-image';

                // Fetch image async
                this.cardMapper.getCardImage(cardName).then(src => {
                    img.src = src;
                });
                card.appendChild(img);

                // Make it look like a real card
                card.classList.add('pokemon-card', 'small');
                card.style.position = 'fixed'; // Override class defaults if needed
                card.style.margin = '0';
                card.style.zIndex = '3000'; // Make sure it's on top
            }

            // Calculate midpoint (arc effect) and endpoint
            // Randomize slightly for multiple cards
            const offset = (i - count / 2) * 120; // Increased offset for better visibility
            const endX = (handRect.left + handRect.width / 2 - deckRect.left) + offset;
            const endY = (handRect.top + handRect.height / 2 - deckRect.top);

            const midX = endX / 2;
            const midY = endY - 100; // Arc up

            card.style.setProperty('--mid-x', `${midX}px`);
            card.style.setProperty('--mid-y', `${midY}px`);
            card.style.setProperty('--end-x', `${endX}px`);
            card.style.setProperty('--end-y', `${endY}px`);

            // Stagger animations
            card.style.animationDelay = `${i * 150}ms`;

            document.body.appendChild(card);

            setTimeout(() => {
                card.remove();
            }, 1200 + (i * 150));
        }

        // Show all cards in center message after animation starts
        if (cardNames.length > 0) {
            const namedCards = cardNames.filter(c => c && c !== 'Unknown Card');
            if (namedCards.length > 0) {
                this.showCenterMessage(
                    namedCards.length === 1
                        ? `${namedCards[0]}を手札に加えた！`
                        : `${namedCards.length}枚のカードを手札に加えた！`,
                    2500,
                    namedCards
                );
            }
        }
    }

    animateDiscard(playerKey, cardName) {
        const isPlayer = playerKey === 'player1';
        const deckEl = isPlayer
            ? document.getElementById('player-hand')
            : document.querySelector('.opponent-area'); // Opponent hand

        const discardPile = isPlayer
            ? document.querySelector('.self-area .discard-pile')
            : document.querySelector('.opponent-area .discard-pile');

        if (!deckEl || !discardPile) return;

        const startRect = deckEl.getBoundingClientRect();
        const endRect = discardPile.getBoundingClientRect();

        const card = document.createElement('div');
        // Setup initial position (roughly center of hand)
        card.style.position = 'fixed';
        card.style.top = `${startRect.top + startRect.height / 2 - 60}px`; // Centered vertically roughly
        card.style.left = `${startRect.left + startRect.width / 2 - 40}px`; // Centered horizontally roughly
        card.style.width = '80px'; // Small card size
        card.style.zIndex = '4000';
        card.style.transition = 'all 0.8s ease-in-out';

        // Add Image
        const img = document.createElement('img');
        img.className = 'card-image';
        img.style.width = '100%';
        img.style.height = 'auto';
        img.style.borderRadius = '4px';
        img.style.boxShadow = '0 2px 5px rgba(0,0,0,0.3)';

        this.cardMapper.getCardImage(cardName).then(src => {
            img.src = src;
        });
        card.appendChild(img);

        document.body.appendChild(card);

        // Animate
        requestAnimationFrame(() => {
            card.style.top = `${endRect.top}px`;
            card.style.left = `${endRect.left}px`;
            card.style.transform = 'scale(0.5) rotate(180deg)';
            card.style.opacity = '0.5';
        });

        // Cleanup
        setTimeout(() => {
            card.remove();
        }, 800);

        // Show text message for discard
        this.showCenterMessage(`${cardName}をトラッシュした`, 1000); // Shorter duration for discard text?
    }

    showPlayedCard(cardName, cardMapper) {
        // Create full screen overlay
        const overlay = document.createElement('div');
        overlay.className = 'played-card-overlay-js'; // Renamed to avoid CSS conflict
        overlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 5000;
            pointer-events: none;
        `;

        const img = document.createElement('img');
        img.className = 'played-card-image';
        img.style.cssText = `
            width: 300px; /* Larger size */
            height: auto;
            border-radius: 15px;
            box-shadow: 0 0 50px rgba(0,0,0,0.8);
            transform: scale(0.5);
            opacity: 0;
            transition: all 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275);
        `;

        // Load image
        cardMapper.getCardImage(cardName).then(src => {
            img.src = src;
            // Animate In
            requestAnimationFrame(() => {
                img.style.transform = 'scale(1)';
                img.style.opacity = '1';
            });
        });

        overlay.appendChild(img);
        document.body.appendChild(overlay);

        // Note: We don't remove it here immediately because showTrashEffect might use it
        // But we should have a fallback cleanup just in case
        setTimeout(() => {
            if (document.body.contains(overlay)) {
                overlay.style.opacity = '0';
                setTimeout(() => overlay.remove(), 500);
            }
        }, 3000);
    }

    showCenterMessage(text, duration = 2000, cardName = null) {
        const overlay = document.createElement('div');
        overlay.className = 'center-message-overlay';

        // Container for layout
        const container = document.createElement('div');
        container.style.cssText = `
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 20px;
        `;

        // Handle single card or multiple cards
        const cardNames = Array.isArray(cardName) ? cardName : (cardName ? [cardName] : []);

        if (cardNames.length > 0) {
            const cardsContainer = document.createElement('div');
            cardsContainer.className = 'center-message-cards';
            cardsContainer.style.cssText = `
                display: flex;
                gap: 15px;
                justify-content: center;
                align-items: center;
                flex-wrap: wrap;
            `;

            cardNames.forEach((card, index) => {
                const img = document.createElement('img');
                img.className = 'center-message-card';
                // Scale down if showing multiple cards
                const cardWidth = cardNames.length > 1 ? 150 : 200;
                img.style.cssText = `
                    width: ${cardWidth}px;
                    height: auto;
                    border-radius: 10px;
                    box-shadow: 0 10px 30px rgba(0,0,0,0.5);
                    transform: scale(0.8);
                    transition: transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
                    opacity: 0;
                `;

                this.cardMapper.getCardImage(card).then(src => {
                    img.src = src;
                    // Stagger animation for multiple cards
                    setTimeout(() => {
                        requestAnimationFrame(() => {
                            img.style.transform = 'scale(1)';
                            img.style.opacity = '1';
                        });
                    }, index * 100);
                });
                cardsContainer.appendChild(img);
            });

            container.appendChild(cardsContainer);
        }

        const textEl = document.createElement('div');
        textEl.textContent = text;
        container.appendChild(textEl);

        overlay.appendChild(container);

        // Add basic styles directly if not in CSS yet, or rely on class
        overlay.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: rgba(0, 0, 0, 0.85);
            color: #fff;
            padding: 30px 50px;
            border-radius: 15px;
            font-size: 24px;
            font-weight: bold;
            z-index: 5000;
            pointer-events: none;
            opacity: 0;
            transition: opacity 0.3s ease-in-out;
            box-shadow: 0 0 40px rgba(255, 255, 255, 0.1);
            border: 2px solid rgba(255, 255, 255, 0.3);
            text-align: center;
            white-space: nowrap;
        `;

        document.body.appendChild(overlay);

        // Animate in
        requestAnimationFrame(() => {
            overlay.style.opacity = '1';
        });

        // Animate out and remove
        setTimeout(() => {
            overlay.style.opacity = '0';
            setTimeout(() => {
                overlay.remove();
            }, 300);
        }, duration);
    }

    animateUse(playerKey, cardName, abilityName = null) {
        console.log(`[UI] animateUse called: ${cardName} used ${abilityName || cardName}`);
        const message = abilityName ? `${abilityName}を使用した！` : `${cardName}を使用した！`;
        this.showCenterMessage(message, 1500, cardName);
    }

    animatePlayToBench(playerKey, cardName) {
        this.showCenterMessage(`${cardName}をベンチに出した`, 1500, cardName);
    }

    animateAttach(playerKey, cardName, targetName) {
        this.showCenterMessage(`${targetName}に${cardName}を付けた`, 1500, cardName);
        // Also trigger fly animation if appropriate
        this.animateCardFly(playerKey, cardName, targetName, 'tool');
    }

    animateEvolve(playerKey, fromCard, toCard) {
        return new Promise((resolve) => {
            const isPlayer = playerKey === 'player1';
            const prefix = isPlayer ? 'player' : 'opponent';

            console.log(`[Evolution Animation] Starting: ${fromCard} -> ${toCard} (${prefix})`);
            // カード検索
            const activeContainer = document.getElementById(`${prefix}-active`);
            let targetEl = activeContainer?.querySelector(`.pokemon-card[data-card-name="${fromCard}"]`);

            if (!targetEl) {
                const benchContainer = document.getElementById(`${prefix}-bench`);
                targetEl = benchContainer?.querySelector(`.pokemon-card[data-card-name="${fromCard}"]`);
                if (targetEl) {
                    console.log(`[Evolution Animation] Found card on bench: ${fromCard}`);
                }
            } else {
                console.log(`[Evolution Animation] Found card on active: ${fromCard}`);
            }

            if (targetEl) {
                // 進化オーバーレイテキストを作成
                const evolutionOverlay = document.createElement('div');
                evolutionOverlay.className = 'evolution-overlay';
                evolutionOverlay.textContent = '進化';
                evolutionOverlay.style.cssText = `
                position: absolute;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                font-size: 48px;
                font-weight: 900;
                color: gold;
                text-shadow: 
                    2px 2px 4px rgba(0,0,0,0.8),
                    0 0 10px rgba(255,215,0,0.8),
                    0 0 20px rgba(255,215,0,0.6);
                z-index: 100;
                pointer-events: none;
                animation: evolution-text-pulse 1.5s ease-in-out;
            `;

                targetEl.appendChild(evolutionOverlay);
                targetEl.classList.add('animate-evolution-flash');

                console.log(`[Evolution Animation] Animation started for ${fromCard}`);

                setTimeout(() => {
                    evolutionOverlay.remove();
                    targetEl.classList.remove('animate-evolution-flash');
                    console.log(`[Evolution Animation] Animation completed for ${fromCard} -> ${toCard}`);
                    resolve();
                }, 1500);
            } else {
                console.warn(`[Evolution Animation] Could not find card to evolve: ${fromCard} (${prefix})`);
                // カードが見つからなくてもresolve（処理を止めない）
                resolve();
            }
        });
    }

    animateStadium(playerKey, cardName) {
        this.showCenterMessage(`${cardName}を出した`, 2000, cardName);

        // Add glow effect to stadium card slot
        const stadiumSlot = document.getElementById('stadium-card');
        if (stadiumSlot) {
            stadiumSlot.classList.add('stadium-glow');
            setTimeout(() => {
                stadiumSlot.classList.remove('stadium-glow');
            }, 1000);
        }
    }

    animateShuffle(playerKey) {
        const isPlayer = playerKey === 'player1';
        const deckEl = isPlayer
            ? document.querySelector('.self-area .card-back')  // Target the card back visual
            : document.querySelector('.opponent-area .card-back');

        if (deckEl) {
            // Remove class to reset if needed
            deckEl.classList.remove('animate-shuffle');
            void deckEl.offsetWidth; // Trigger reflow
            deckEl.classList.add('animate-shuffle');

            // Add floating cards effect
            const container = deckEl.parentElement;
            if (container) {
                for (let i = 0; i < 3; i++) {
                    const floater = document.createElement('div');
                    floater.className = 'shuffle-effect-card';
                    floater.style.animationDelay = `${i * 0.1}s`;
                    deckEl.appendChild(floater);
                    setTimeout(() => floater.remove(), 1500);
                }
            }
        }
    }

    animateActiveMove(playerKey) {
        const isPlayer = playerKey === 'player1';
        const activeEl = isPlayer
            ? document.querySelector('#player-active .pokemon-card')
            : document.querySelector('#opponent-active .pokemon-card');

        if (activeEl) {
            activeEl.classList.add('animate-move-to-active');
            setTimeout(() => {
                activeEl.classList.remove('animate-move-to-active');
            }, 600);
        }
    }

    showKnockoutEffect(playerKey, pokemonName) {
        const isPlayer = playerKey === 'player1';
        const prefix = isPlayer ? 'player' : 'opponent';

        // Find the pokemon card element. 
        // It might be in active or bench.
        // We search both.
        const activeContainer = document.getElementById(`${prefix}-active`);
        let targetCard = null;

        // Check active
        if (activeContainer) {
            const card = activeContainer.querySelector(`.pokemon-card[data-card-name="${pokemonName}"]`);
            if (card) targetCard = card;
        }

        // Check bench if not found
        if (!targetCard) {
            const benchContainer = document.getElementById(`${prefix}-bench`);
            if (benchContainer) {
                const card = benchContainer.querySelector(`.pokemon-card[data-card-name="${pokemonName}"]`);
                if (card) targetCard = card;
            }
        }

        if (targetCard) {
            // Clone it for the ghost effect
            const rect = targetCard.getBoundingClientRect();
            const clone = targetCard.cloneNode(true);

            clone.style.position = 'fixed';
            clone.style.top = `${rect.top}px`;
            clone.style.left = `${rect.left}px`;
            clone.style.width = `${rect.width}px`;
            clone.style.height = `${rect.height}px`;
            clone.style.margin = '0';
            clone.style.zIndex = '1000';
            clone.classList.remove('large', 'small'); // Remove naming classes that might affect layout
            // Scale is handled by width/height above? 
            // Original card has class .large or .small which sets width/height.
            // We set explicit pixels so it matches exactly.

            // Add knockout style
            clone.classList.add('knocked-out');

            // Ensure overlay exists (if not already there)
            if (!clone.querySelector('.knockout-overlay')) {
                const koOverlay = document.createElement('div');
                koOverlay.className = 'knockout-overlay';
                koOverlay.textContent = 'きぜつ';
                clone.appendChild(koOverlay);
            }

            document.body.appendChild(clone);

            // Remove after animation (1s defined in CSS)
            setTimeout(() => {
                clone.remove();
            }, 1500);
        }
    }


    animateEnergyAttach(playerKey, cardName, targetName) {
        this.animateCardFly(playerKey, cardName, targetName, 'energy');
    }

    animateToolAttach(playerKey, cardName, targetName) {
        this.animateCardFly(playerKey, cardName, targetName, 'tool');
    }

    animateCardFly(playerKey, cardName, targetName, type) {
        const isPlayer = playerKey === 'player1';
        const deckArea = isPlayer ? document.getElementById('player-hand') : document.querySelector('.opponent-area'); // Opponent hand virtual

        // Find target element
        const prefix = isPlayer ? 'player' : 'opponent';
        const activeContainer = document.getElementById(`${prefix}-active`);
        let targetEl = null;

        // Try Active
        const activeCard = activeContainer?.querySelector('.pokemon-card');
        if (activeCard && activeCard.dataset.cardName === targetName) {
            targetEl = activeCard;
        }

        // Try Bench
        if (!targetEl) {
            const benchContainer = document.getElementById(`${prefix}-bench`);
            const benchCard = benchContainer?.querySelector(`.pokemon-card[data-card-name="${targetName}"]`);
            if (benchCard) targetEl = benchCard;

            // Fallback: Check active again if name match fails but target string implies active
            // (We rely on logParser passing targetName correctly)
            if (!targetEl && activeCard && type === 'energy') {
                // For energy, sometimes target name parsing is fuzzy
                // Allow fallback to active if only one choice basically
            }
        }

        if (deckArea && targetEl) {
            const startRect = deckArea.getBoundingClientRect(); // Rough center of hand
            const endRect = targetEl.getBoundingClientRect();

            const flyer = document.createElement('div');
            flyer.className = 'fly-card-animation';
            if (type === 'energy') flyer.classList.add('fly-energy');
            if (type === 'tool') flyer.classList.add('fly-tool');

            // Set start pos (center of hand)
            flyer.style.left = `${startRect.left + startRect.width / 2}px`;
            flyer.style.top = `${startRect.top}px`;

            document.body.appendChild(flyer);

            // Animate
            requestAnimationFrame(() => {
                flyer.style.transform = `translate(${endRect.left - (startRect.left + startRect.width / 2)}px, ${endRect.top - startRect.top}px) scale(0.5)`;
                flyer.style.opacity = '0';
            });

            setTimeout(() => flyer.remove(), 600);
        }
    }

    animateSwap(playerKey, newActiveName) {
        return new Promise((resolve) => {
            const isPlayer = playerKey === 'player1';
            const prefix = isPlayer ? 'player' : 'opponent';

            const activeContainer = document.getElementById(`${prefix}-active`);
            const benchContainer = document.getElementById(`${prefix}-bench`);

            const oldActiveCard = activeContainer?.querySelector('.pokemon-card');
            const newActiveCard = benchContainer?.querySelector(`.pokemon-card[data-card-name="${newActiveName}"]`);

            if (oldActiveCard && newActiveCard) {
                // Get rects
                const oldRect = oldActiveCard.getBoundingClientRect();
                const newRect = newActiveCard.getBoundingClientRect();

                // Create clones
                const oldClone = oldActiveCard.cloneNode(true);
                const newClone = newActiveCard.cloneNode(true);

                // Hide originals
                oldActiveCard.style.opacity = '0';
                newActiveCard.style.opacity = '0';

                // Setup Clones
                [oldClone, newClone].forEach(c => {
                    c.style.position = 'fixed';
                    c.style.margin = '0';
                    c.style.zIndex = '1000';
                    c.style.transition = 'transform 0.6s ease-in-out, width 0.6s ease-in-out, height 0.6s ease-in-out';
                    c.classList.remove('large', 'small');
                });

                // Set initial positions and sizes explicitly
                oldClone.style.top = `${oldRect.top}px`;
                oldClone.style.left = `${oldRect.left}px`;
                oldClone.style.width = `${oldRect.width}px`;
                oldClone.style.height = `${oldRect.height}px`;

                newClone.style.top = `${newRect.top}px`;
                newClone.style.left = `${newRect.left}px`;
                newClone.style.width = `${newRect.width}px`;
                newClone.style.height = `${newRect.height}px`;

                document.body.appendChild(oldClone);
                document.body.appendChild(newClone);

                // Animate
                requestAnimationFrame(() => {
                    // Force reflow
                    void oldClone.offsetWidth;
                    void newClone.offsetWidth;

                    // Calculate translation
                    // Old -> New Position
                    const xDestOld = newRect.left - oldRect.left;
                    const yDestOld = newRect.top - oldRect.top;

                    // New -> Old Position
                    const xDestNew = oldRect.left - newRect.left;
                    const yDestNew = oldRect.top - newRect.top;

                    // Apply Transform & Size Change
                    oldClone.style.transform = `translate(${xDestOld}px, ${yDestOld}px)`;
                    oldClone.style.width = `${newRect.width}px`;
                    oldClone.style.height = `${newRect.height}px`;

                    newClone.style.transform = `translate(${xDestNew}px, ${yDestNew}px)`;
                    newClone.style.width = `${oldRect.width}px`;
                    newClone.style.height = `${oldRect.height}px`;
                });

                setTimeout(() => {
                    oldClone.remove();
                    newClone.remove();
                    // Don't restore opacity here because the state update (render) will happen immediately after resolve
                    resolve();
                }, 700); // 600ms transition + buffer

            } else if (oldActiveCard) {
                // Fallback: Just animate old active retreating if new one not found (rare)
                const oldRect = oldActiveCard.getBoundingClientRect();
                const oldClone = oldActiveCard.cloneNode(true);

                oldActiveCard.style.opacity = '0';

                oldClone.style.position = 'fixed';
                oldClone.style.zIndex = '1000';
                oldClone.style.transition = 'transform 0.6s ease-in-out, opacity 0.6s';
                oldClone.style.top = `${oldRect.top}px`;
                oldClone.style.left = `${oldRect.left}px`;
                oldClone.style.width = `${oldRect.width}px`;
                oldClone.style.height = `${oldRect.height}px`;

                document.body.appendChild(oldClone);

                requestAnimationFrame(() => {
                    // Move to specific position or just fade out/shrink? 
                    // Let's move towards bench area roughly
                    const benchRect = benchContainer ? benchContainer.getBoundingClientRect() : { top: oldRect.top + 100, left: oldRect.left };

                    oldClone.style.transform = `translate(${benchRect.left - oldRect.left}px, ${benchRect.top - oldRect.top}px) scale(0.5)`;
                    oldClone.style.opacity = '0';
                });

                setTimeout(() => {
                    oldClone.remove();
                    resolve();
                }, 700);
            } else {
                resolve(); // Nothing to animate
            }
        });
    }

    showTurnIndicator(turnNumber, playerName) {
        // Remove existing indicator if any
        const existing = document.querySelector('.turn-indicator');
        if (existing) existing.remove();

        const indicator = document.createElement('div');
        indicator.className = 'turn-indicator';

        const turnTitle = document.createElement('h2');
        turnTitle.textContent = `${turnNumber}ターン目`;

        const turnPlayer = document.createElement('p');
        turnPlayer.textContent = `${playerName} のターン`;

        indicator.appendChild(turnTitle);
        indicator.appendChild(turnPlayer);

        document.body.appendChild(indicator);

        // CSS animation handles fade in/out
        setTimeout(() => {
            indicator.remove();
        }, 3000);
    }

    getEnergyIcon(energyName) {
        let type = 'colorless';
        let symbol = 'C';
        let icon = null;
        const name = energyName.toLowerCase();

        // Specific emojis/icons requested by user
        if (name.includes('fire')) { type = 'fire'; symbol = '🔥'; }
        else if (name.includes('water')) { type = 'water'; symbol = '💧'; }
        else if (name.includes('grass')) { type = 'grass'; symbol = '🌿'; }
        else if (name.includes('lightning') || name.includes('electric')) { type = 'lightning'; symbol = '⚡'; }
        else if (name.includes('psychic')) { type = 'psychic'; symbol = '👁️'; } // Or purple ball
        else if (name.includes('fighting')) { type = 'fighting'; symbol = '✊'; }
        else if (name.includes('dark')) { type = 'darkness'; symbol = '👿'; }
        else if (name.includes('metal')) { type = 'metal'; symbol = '⚙️'; }
        else if (name.includes('fairy')) { type = 'fairy'; symbol = '✨'; }
        else if (name.includes('dragon')) { type = 'dragon'; symbol = '🐲'; }
        else {
            // Special energy - use first letter
            symbol = energyName[0].toUpperCase();
        }

        // Use symbol directly if no specific styled span needed, OR keep span for background color
        // User asked for specific icons. Let's return the emoji inside the colored span for visibility?
        // Or just the emoji? User said "Fire -> Fire (Red)". 
        // If I use emoji, color is fixed. If I use span background, I can color it.
        // "Fire Energy -> Fire (Red)" -> 🔥 is Red.
        // "Water Energy -> Water Drop (Blue)" -> 💧 is Blue.
        // "Psychic -> Purple Eye" -> 👁️ is ... eye colored. 
        // Let's combine: Icon + Background Color class.
        return `<span class="energy-icon type-${type}">${symbol}</span>`;
    }

    highlightPokemon(playerKey, pokemonName) {
        const isPlayer = playerKey === 'player1';
        const prefix = isPlayer ? 'player' : 'opponent';

        let targetCard = null;

        // Check active
        const activeContainer = document.getElementById(`${prefix}-active`);
        if (activeContainer) {
            const card = activeContainer.querySelector(`.pokemon-card[data-card-name="${pokemonName}"]`);
            if (card) targetCard = card;
            else if (activeContainer.querySelector('.pokemon-card')) {
                // Fallback to active card if standard logic fails (commonly correct for attacks)
                const card = activeContainer.querySelector('.pokemon-card');
                if (card) targetCard = card;
            }
        }

        // Check bench if not found
        if (!targetCard) {
            const benchContainer = document.getElementById(`${prefix}-bench`);
            if (benchContainer) {
                const card = benchContainer.querySelector(`.pokemon-card[data-card-name="${pokemonName}"]`);
                if (card) targetCard = card;
            }
        }

        if (targetCard) {
            targetCard.classList.remove('action-highlight');
            void targetCard.offsetWidth; // Trigger reflow
            targetCard.classList.add('action-highlight');
        }
    }

    announceMove(moveName, playerKey) {
        const overlay = document.createElement('div');
        overlay.className = 'move-announcement-overlay';

        const text = document.createElement('div');
        text.className = 'move-announcement-text';
        text.textContent = moveName;

        overlay.appendChild(text);
        document.body.appendChild(overlay);

        // Remove after animation (2.0s)
        setTimeout(() => {
            overlay.remove();
        }, 2000);
    }
}

export { UI };
