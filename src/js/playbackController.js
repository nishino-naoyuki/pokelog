// Playback Controller Module
// Manages playback of actions (auto-play, step navigation)

class PlaybackController {
    constructor(gameState, ui, cardMapper, soundManager) {
        this.gameState = gameState;
        this.ui = ui;
        this.cardMapper = cardMapper;
        this.soundManager = soundManager;
        this.isPlaying = false;
        this.playbackSpeed = 1.0;
        this.playbackTimer = null;

        this.initControls();
        this.lastTurnNumber = 0;
        this.lastActivePlayer = '';
        // Don't render here - let app.js handle initial render
    }

    initControls() {
        // Playback buttons
        document.getElementById('btn-first')?.addEventListener('click', () => this.goToFirst());
        document.getElementById('btn-prev')?.addEventListener('click', () => this.stepBackward());
        document.getElementById('btn-play')?.addEventListener('click', () => this.play());
        document.getElementById('btn-pause')?.addEventListener('click', () => this.pause());
        document.getElementById('btn-next')?.addEventListener('click', () => this.stepForward());
        document.getElementById('btn-last')?.addEventListener('click', () => this.goToLast());

        // Speed control
        const speedSlider = document.getElementById('speed-slider');
        const speedDisplay = document.getElementById('speed-display');

        speedSlider?.addEventListener('input', (e) => {
            this.playbackSpeed = parseFloat(e.target.value);
            if (speedDisplay) {
                speedDisplay.textContent = `${this.playbackSpeed}x`;
            }

            // Restart playback with new speed if currently playing
            if (this.isPlaying) {
                this.pause();
                this.play();
            }
        });
    }

    async stepForward() {
        if (!this.gameState.hasNextAction()) {
            console.log('No more actions');
            this.pause();
            return;
        }

        // インデックスをインクリメント
        this.gameState.currentActionIndex++;

        // 現在のアクションを取得（インクリメント後）
        const action = this.gameState.getCurrentAction();
        const isPlayer = action.player === 'player1';

        console.log(`[Playback] Step Forward - Index: ${this.gameState.currentActionIndex}, Type: ${action.type}, Player: ${action.player}`);

        // --- Turn Indicator Logic ---
        // Check if turn/player changed from last state
        if (this.gameState.turnNumber !== this.lastTurnNumber || this.gameState.activePlayer !== this.lastActivePlayer) {
            const currentPlayerName = this.gameState.players[this.gameState.activePlayer].name;
            this.ui.showTurnIndicator(this.gameState.turnNumber, currentPlayerName);

            this.lastTurnNumber = this.gameState.turnNumber;
            this.lastActivePlayer = this.gameState.activePlayer;
        }

        // Check next action for pre-execution        
        // --- Pre-render Animations (trigger before DOM update for smooth transitions) ---

        // Knockout: show effect on dying pokemon before it's removed
        const nextAction = this.gameState.actions[this.gameState.currentActionIndex + 1];
        if (nextAction && nextAction.type === 'knockout') {
            this.ui.showKnockoutEffect(nextAction.player, nextAction.data.pokemonName);
        }

        // Check if THIS action involves movement/swap, so we can animate existing elements

        if (action.type === 'switch_active' || action.type === 'retreat') {
            await this.ui.animateSwap(isPlayer ? 'player1' : 'player2', action.data.pokemonName);
        } else if (action.type === 'play_pokemon_active') {
            this.ui.animateActiveMove(isPlayer ? 'player1' : 'player2');

        } else if (action.type === 'discard_from_pokemon') {
            // Animate from specific pokemon
            const prefix = isPlayer ? 'player' : 'opponent';
            const activeContainer = document.getElementById(`${prefix}-active`);
            const benchContainer = document.getElementById(`${prefix}-bench`);

            let targetCard = activeContainer?.querySelector(`.pokemon-card[data-card-name="${action.data.pokemonName}"]`);

            if (!targetCard && activeContainer) {
                targetCard = benchContainer?.querySelector(`.pokemon-card[data-card-name="${action.data.pokemonName}"]`);
            }
            if (!targetCard && activeContainer && activeContainer.querySelector('.pokemon-card') && action.data.pokemonName === this.gameState.players[isPlayer ? 'player1' : 'player2'].activePokemon?.card?.name) {
                // Fallback to active if name implies it
                targetCard = activeContainer.querySelector('.pokemon-card');
            }

            if (targetCard) {
                // Animate from that card to trash
                this.ui.showTrashEffect(targetCard, 'discard');
            }
        } else if (action.type === 'discard') {
            // Animate discard
            if (isPlayer && action.data.cards && action.data.cards.length > 0) {
                action.data.cards.forEach((cardName, index) => {
                    setTimeout(() => {
                        this.ui.animateDiscard(isPlayer ? 'player1' : 'player2', cardName);
                    }, index * 200); // Stagger by 200ms
                });
            } else if (isPlayer) {
                // Fallback for generic discard logic if needed
                this.ui.showTrashEffect(document.getElementById('player-hand'), 'discard');
            }
        } else if (action.type === 'evolve') {
            // 進化: 状態更新前にアニメーション実行
            console.log(`[Playback] Evolution - From: ${action.data.from}, To: ${action.data.to}`);
            this.soundManager.playEvolve(); // 効果音再生
            await this.ui.animateEvolve(isPlayer ? 'player1' : 'player2', action.data.from, action.data.to);
        }

        // --- Execute Action & Render ---
        // applyAction()を直接呼び出し（executeNextAction()は使わない）
        this.gameState.applyAction(action);
        await this.renderCurrentState();
        this.addActionLog(action);

        // --- Post-render Animations (effects that need updated DOM or simple overlays) ---

        if (action.type === 'draw') {
            console.log("action drew action.data=" + action.data);
            if (action.data.count) {
                this.soundManager.playDraw(); // 効果音再生
                this.ui.animateDraw(isPlayer ? 'player1' : 'player2', action.data.count);
            } else if (action.data.cards) {
                this.soundManager.playDraw(); // 効果音再生
                this.ui.animateDraw(isPlayer ? 'player1' : 'player2', action.data.cards);
            }
        }

        if (action.type === 'shuffle_deck') {
            this.soundManager.playShuffle(); // 効果音再生
            this.ui.animateShuffle(isPlayer ? 'player1' : 'player2');
        }

        if (action.type === 'attach_energy') {
            // Use generic attach animation for energy too if desired, or keep specific if later needed
            this.ui.animateAttach(isPlayer ? 'player1' : 'player2', action.data.cardName, action.data.target);
        }

        if (action.type === 'attach_tool') {
            this.ui.animateAttach(isPlayer ? 'player1' : 'player2', action.data.cardName, action.data.target);
        }

        if (action.type === 'play_pokemon_bench') {
            this.ui.animatePlayToBench(isPlayer ? 'player1' : 'player2', action.data.pokemonName);
        }

        // 進化は既にPre-renderセクションで処理済み

        if (action.type === 'play_stadium') {
            this.ui.animateStadium(isPlayer ? 'player1' : 'player2', action.data.cardName);
        }

        if (action.type === 'play_card') {
            this.soundManager.playPlayed(); // 効果音再生
            this.ui.showPlayedCard(action.data.cardName, this.cardMapper);

            // Trash effect
            // UI will find opacity layer and animate it
            // Delay slightly to let the user see the card
            setTimeout(() => {
                this.ui.showTrashEffect(null, 'discard');
            }, 1500); // Wait for popIn (15%) + hold (25%->75%) ~ 1.5s
        }

        if (action.type === 'knockout') {
            // For knockout, the player field in action is the one who lost the pokemon
            // ... (keep existing comment/logic if any, currently empty in view)
            this.soundManager.playKnockout(); // 効果音再生
        }

        // Show effect for attack
        if (action.type === 'use_attack') {
            console.log(`[Playback] use_attack action detected: ${action.data.pokemonName} used ${action.data.attackName}`);

            // New Visual Effects
            // 1. Highlight the user
            this.ui.highlightPokemon(isPlayer ? 'player1' : 'player2', action.data.pokemonName);

            // 2. Announce the move/ability name
            // Use attackName if available, else standard text?
            // "used Startler" -> attackName="Startler"
            if (action.data.attackName) {
                console.log(`[Playback] Calling animateUse for: ${action.data.attackName}`);
                // If it's an Ability (often indicated by specific card usage context, but here generic attack log)
                // logParser distinguishes 'used [Ability]'? 
                // For now treat all attacks/abilities same for visual announcement
                this.ui.animateUse(isPlayer ? 'player1' : 'player2', action.data.pokemonName, action.data.attackName);

                await new Promise(r => setTimeout(r, 1000));
            } else {
                console.warn(`[Playback] No attackName found for use_attack action`);
            }

            const sourceId = isPlayer ? 'player-active' : 'opponent-active';
            const targetId = isPlayer ? 'opponent-active' : 'player-active';

            const sourceEl = document.getElementById(sourceId)?.querySelector('.pokemon-card');
            const targetEl = document.getElementById(targetId)?.querySelector('.pokemon-card');

            if (sourceEl && targetEl) {
                if (action.data.damage && action.data.damage > 0) {
                    this.soundManager.playDamage(); // ダメージ効果音再生
                }

                const type = (action.data.damage || 0) >= 100 ? 'strong' : 'normal';
                if (this.ui.showAttackEffect) {
                    this.ui.showAttackEffect(sourceEl, targetEl, type);
                }
            }
        }
    }

    async stepBackward() {
        if (!this.gameState.hasPreviousAction()) {
            console.log('At beginning');
            return;
        }

        // For simplicity, rebuild from start
        await this.rebuildToIndex(this.gameState.currentActionIndex - 1);
    }

    goToFirst() {
        this.rebuildToIndex(0);
    }

    async goToLast() {
        while (this.gameState.hasNextAction()) {
            await this.stepForward();
        }
    }

    play() {
        if (this.isPlaying) return;

        this.isPlaying = true;
        this.updateButtonStates();

        const interval = 2000 / this.playbackSpeed; // Base interval is 2 seconds

        this.playbackTimer = setInterval(() => {
            if (!this.gameState.hasNextAction()) {
                this.pause();
                return;
            }

            this.stepForward();
        }, interval);
    }

    pause() {
        this.isPlaying = false;
        this.updateButtonStates();

        if (this.playbackTimer) {
            clearInterval(this.playbackTimer);
            this.playbackTimer = null;
        }
    }

    stop() {
        this.pause();
        this.goToFirst();
    }

    updateButtonStates() {
        const playBtn = document.getElementById('btn-play');
        const pauseBtn = document.getElementById('btn-pause');

        if (playBtn && pauseBtn) {
            if (this.isPlaying) {
                playBtn.style.opacity = '0.5';
                pauseBtn.style.opacity = '1';
            } else {
                playBtn.style.opacity = '1';
                pauseBtn.style.opacity = '0.5';
            }
        }
    }

    async renderCurrentState() {
        await this.ui.renderGameState(this.gameState, this.cardMapper);
    }

    addActionLog(action) {
        if (!action) return;

        const playerName = this.gameState.players[action.player].name;
        const message = this.ui.translator.translate(action, playerName);

        this.ui.addLogMessage(message.text, message.type);
    }

    async rebuildToIndex(targetIndex) {
        // Clear log
        this.ui.clearLog();

        // Reset to beginning
        this.gameState.reset();

        // Re-execute actions up to target
        for (let i = 0; i < targetIndex; i++) {
            const action = this.gameState.executeNextAction();
            this.addActionLog(action);
        }

        await this.renderCurrentState();
    }
}
export { PlaybackController };
