class SoundManager {
    constructor() {
        this.isMuted = false;

        // 音声ファイルのパス設定
        const basePath = 'assets/sound/';

        this.sounds = {
            draw: new Audio(basePath + 'draw.mp3'),
            shuffle: new Audio(basePath + 'shuffle.mp3'),
            damage: new Audio(basePath + 'damage.mp3'),
            knockout: new Audio(basePath + 'knockout.mp3'),
            play: new Audio(basePath + 'play.mp3'),
            evolve: new Audio(basePath + 'evolve.mp3')
        };

        // 読み込みエラーハンドリング
        Object.values(this.sounds).forEach(audio => {
            audio.addEventListener('error', (e) => {
                console.warn(`Sound load failed: ${audio.src}`);
            });
        });
    }

    playSound(type, speed) {
        if (this.isMuted) return;

        const sound = this.sounds[type];
        if (sound) {
            // 連続再生できるように再生位置をリセット
            sound.currentTime = 0;
            sound.playbackRate = speed;

            sound.play().catch(e => {
                console.warn(`Failed to play sound: ${type}`, e);
            });
        }
    }

    // ドロー音
    playDraw() {
        this.playSound('draw', 1.0);
    }

    // プレイ音
    playPlayed() {
        this.playSound('play', 1.0);
    }
    // シャッフル音
    playShuffle() {
        this.playSound('shuffle', 2.5);
    }

    // ダメージ音
    playDamage() {
        this.playSound('damage', 1.0);
    }

    // きぜつ音
    playKnockout() {
        this.playSound('knockout', 1.0);
    }

    // 進化音 [NEW]
    playEvolve() {
        this.playSound('evolve', 1.0);
    }

    toggleMute() {
        this.isMuted = !this.isMuted;
        return this.isMuted;
    }
}

export { SoundManager };
