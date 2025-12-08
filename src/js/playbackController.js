// Playback Controller Module
// Manages playback of actions (auto-play, step navigation)

class PlaybackController {
    constructor(gameState, ui, cardMapper) {
        this.gameState = gameState;
        this.ui = ui;
        this.cardMapper = cardMapper;
        this.isPlaying = false;
        this.playbackSpeed = 1.0;
        this.playbackTimer = null;

        this.initControls();
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

        const action = this.gameState.executeNextAction();
        await this.renderCurrentState();
        this.addActionLog(action);

        const isPlayer = action.player === 'player1';

        if (action.type === 'draw') {
            if (action.data.count) {
                this.ui.animateDraw(isPlayer ? 'player1' : 'player2', action.data.count);
            } else if (action.data.cards) {
                this.ui.animateDraw(isPlayer ? 'player1' : 'player2', action.data.cards.length);
            }
        }

        if (action.type === 'play_card') {
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
            const isVictimPlayer1 = action.player === 'player1';
            const victimId = isVictimPlayer1 ? 'player-active' : 'opponent-active';
            // Logic to find exact pokemon element might be tricky if it's already removed from state?
            // But valid DOM element might still exist if we haven't re-rendered? 
            // We JUST called renderCurrentState(), so the pokemon is GONE from the DOM!
            // We need to trigger effect BEFORE rendering state? Or handle it differently.
            // If we render state, the victim is gone.

            // Actually, for knockout, we should probably show effect BEFORE rendering the state update that removes it.
            // But stepForward is standard: execute -> render.
            // Maybe we can rely on ShowTrashEffect spawning a clone of the element?
            // But the element is gone from DOM.
            // We might need to capture the element before rendering.
        }

        // Show effect for attack
        if (action.type === 'use_attack') {
            const sourceId = isPlayer ? 'player-active' : 'opponent-active';
            const targetId = isPlayer ? 'opponent-active' : 'player-active';

            const sourceEl = document.getElementById(sourceId)?.querySelector('.pokemon-card');
            const targetEl = document.getElementById(targetId)?.querySelector('.pokemon-card');

            if (sourceEl && targetEl) {
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
