// Main Application Controller
import { LogParser } from './logParser.js';
import { GameState } from './gameState.js';
import { CardMapper } from './cardMapper.js';
import { UI } from './ui.js';
import { PlaybackController } from './playbackController.js';
import { SoundManager } from './soundManager.js';

class App {
    constructor() {
        this.parser = new LogParser();
        this.gameState = null;
        this.cardMapper = new CardMapper();
        this.cardMapper = new CardMapper();
        this.ui = new UI(this.cardMapper);
        this.soundManager = new SoundManager();
        this.playbackController = null;

        this.initEventListeners();
    }

    async init() {
        console.log('PTCGL Log Replay App initialized');

        // Load card database
        await this.cardMapper.loadCardDatabase();

        // Show load screen
        this.showScreen('load-screen');
    }

    initEventListeners() {
        // Load Screen
        const fileSelectBtn = document.getElementById('file-select-btn');
        const fileInput = document.getElementById('file-input');

        fileSelectBtn?.addEventListener('click', () => {
            fileInput.click();
        });

        fileInput?.addEventListener('change', (e) => {
            this.handleFileSelect(e);
        });

        // Error Screen
        const btnBackToLoad = document.getElementById('btn-back-to-load');
        btnBackToLoad?.addEventListener('click', () => {
            this.showScreen('load-screen');
        });

        // Play Screen - New Log Button
        const btnNewLog = document.getElementById('btn-new-log');
        btnNewLog?.addEventListener('click', () => {
            if (confirm('現在の再生を終了しますか？')) {
                this.showScreen('load-screen');
                if (this.playbackController) {
                    this.playbackController.stop();
                }
            }
        });

        // Card Detail Popup
        const popupClose = document.getElementById('popup-close');
        const popup = document.getElementById('card-detail-popup');

        popupClose?.addEventListener('click', () => {
            popup.classList.remove('active');
        });

        popup?.addEventListener('click', (e) => {
            if (e.target === popup) {
                popup.classList.remove('active');
            }
        });

        // ESC key to close popup
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                popup?.classList.remove('active');
            }
        });
    }

    async handleFileSelect(event) {
        const file = event.target.files[0];
        if (!file) return;

        try {
            // Show loading
            const loadingOverlay = document.getElementById('loading-overlay');
            loadingOverlay?.classList.remove('hidden');

            // Read file
            const content = await this.readFile(file);

            // Parse log
            const parseResult = this.parser.parse(content);

            if (!parseResult.success) {
                throw new Error(parseResult.error || 'ログファイルの解析に失敗しました');
            }

            // Create game state
            this.gameState = new GameState(parseResult.data);

            // Hide loading
            loadingOverlay?.classList.add('hidden');

            // Show play screen
            this.showScreen('play-screen');

            // Initialize playback controller
            this.playbackController = new PlaybackController(
                this.gameState,
                this.ui,
                this.cardMapper,
                this.soundManager
            );

            // Render initial state
            await this.ui.renderGameState(this.gameState, this.cardMapper);

        } catch (error) {
            console.log('Error loading file:', error);
            this.showError(error.message);
        }
    }

    readFile(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target.result);
            reader.onerror = (e) => reject(new Error('ファイルの読み込みに失敗しました'));
            reader.readAsText(file);
        });
    }

    showScreen(screenId) {
        const screens = document.querySelectorAll('.screen');
        screens.forEach(screen => {
            screen.classList.remove('active');
        });

        const targetScreen = document.getElementById(screenId);
        if (targetScreen) {
            targetScreen.classList.add('active');
        }
    }

    showError(message) {
        const loadingOverlay = document.getElementById('loading-overlay');
        loadingOverlay?.classList.add('hidden');

        const errorMessage = document.getElementById('error-message');
        if (errorMessage) {
            errorMessage.innerHTML = `<p>${message}</p>`;
        }

        this.showScreen('error-screen');
    }
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    const app = new App();
    app.init();
    window.app = app; // Expose for testing
});

export { App };
