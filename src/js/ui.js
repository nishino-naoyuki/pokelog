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
        if (!sourceEl) return;

        const rect = sourceEl.getBoundingClientRect();
        const clone = sourceEl.cloneNode(true);

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
        if (clone && sourceEl !== document.body) { // Check if valid element
            document.body.appendChild(clone);
            // Simple fade out fallback
            clone.style.transition = 'all 0.5s';
            clone.style.opacity = '0';
            clone.style.transform = 'scale(0.5)';
            setTimeout(() => clone.remove(), 500);
        }
    }

    animateDraw(playerKey, count) {
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

        for (let i = 0; i < count; i++) {
            const card = document.createElement('div');
            card.className = 'animate-fly-draw';

            // Start position (Deck)
            card.style.top = `${deckRect.top}px`;
            card.style.left = `${deckRect.left}px`;

            // Calculate midpoint (arc effect) and endpoint
            // Randomize slightly for multiple cards
            const offset = (i - count / 2) * 20;
            const endX = (handRect.left + handRect.width / 2 - deckRect.left) + offset;
            const endY = (handRect.top + handRect.height / 2 - deckRect.top);

            const midX = endX / 2;
            const midY = endY - 100; // Arc up

            card.style.setProperty('--mid-x', `${midX}px`);
            card.style.setProperty('--mid-y', `${midY}px`);
            card.style.setProperty('--end-x', `${endX}px`);
            card.style.setProperty('--end-y', `${endY}px`);

            // Stagger animations
            card.style.animationDelay = `${i * 100}ms`;

            document.body.appendChild(card);

            setTimeout(() => {
                card.remove();
            }, 1000 + (i * 100));
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
        const isPlayer = playerKey === 'player1';
        const prefix = isPlayer ? 'player' : 'opponent';

        const activeContainer = document.getElementById(`${prefix}-active`);
        const benchContainer = document.getElementById(`${prefix}-bench`);

        const oldActiveCard = activeContainer?.querySelector('.pokemon-card');
        const newActiveCard = benchContainer?.querySelector(`.pokemon-card[data-card-name="${newActiveName}"]`);

        if (oldActiveCard && newActiveCard) {
            // Create clones
            const oldRect = oldActiveCard.getBoundingClientRect();
            const newRect = newActiveCard.getBoundingClientRect();

            const oldClone = oldActiveCard.cloneNode(true);
            const newClone = newActiveCard.cloneNode(true);

            // Setup Clones
            [oldClone, newClone].forEach(c => {
                c.style.position = 'fixed';
                c.style.margin = '0';
                c.style.zIndex = '1000';
                c.style.transition = 'transform 0.6s ease-in-out';
                c.classList.remove('large', 'small');
                // We use explicit sizing, so remove class-based sizing to avoid conflicts during transition if applied
            });

            // Start Positions
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

            // Animate swap
            requestAnimationFrame(() => {
                // Old goes to New pos
                const xDestOld = newRect.left - oldRect.left;
                const yDestOld = newRect.top - oldRect.top;

                oldClone.style.transform = `translate(${xDestOld}px, ${yDestOld}px)`;
                oldClone.style.width = `${newRect.width}px`; // Shrink
                oldClone.style.height = `${newRect.height}px`;

                const xDestNew = oldRect.left - newRect.left;
                const yDestNew = oldRect.top - newRect.top;

                newClone.style.transform = `translate(${xDestNew}px, ${yDestNew}px)`;
                newClone.style.width = `${oldRect.width}px`; // Grow
                newClone.style.height = `${oldRect.height}px`;
            });

            setTimeout(() => {
                oldClone.remove();
                newClone.remove();
            }, 700);
        } else if (oldActiveCard) {
            // Fallback: If no new active card found (e.g. empty bench or parsing issue),
            // still animate the old active retreating to bench area
            const oldRect = oldActiveCard.getBoundingClientRect();
            const oldClone = oldActiveCard.cloneNode(true);

            // Setup Clone
            oldClone.style.position = 'fixed';
            oldClone.style.margin = '0';
            oldClone.style.zIndex = '1000';
            oldClone.style.transition = 'transform 0.6s ease-in-out';
            oldClone.classList.remove('large', 'small');

            oldClone.style.top = `${oldRect.top}px`;
            oldClone.style.left = `${oldRect.left}px`;
            oldClone.style.width = `${oldRect.width}px`;
            oldClone.style.height = `${oldRect.height}px`;

            document.body.appendChild(oldClone);

            // Animate to SOME bench position (first slot?)
            const firstBench = benchContainer?.firstElementChild; // .bench-slot
            if (firstBench) {
                const benchRect = firstBench.getBoundingClientRect();
                requestAnimationFrame(() => {
                    const xDest = benchRect.left - oldRect.left;
                    const yDest = benchRect.top - oldRect.top;
                    oldClone.style.transform = `translate(${xDest}px, ${yDest}px) scale(0.6)`;
                });
            }

            setTimeout(() => {
                oldClone.remove();
            }, 700);
        }
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
}

export { UI };
