// Message Translator Module
// Converts action objects to Japanese log messages

class MessageTranslator {
    constructor() {
        this.messageTypes = {
            draw: this.translateDraw.bind(this),
            play_card: this.translatePlayCard.bind(this),
            attach_energy: this.translateAttachEnergy.bind(this),
            use_attack: this.translateUseAttack.bind(this),
            damage: this.translateDamage.bind(this),
            knockout: this.translateKnockout.bind(this),
            take_prize: this.translateTakePrize.bind(this),
            evolve: this.translateEvolve.bind(this),
            retreat: this.translateRetreat.bind(this),
            turn_end: this.translateTurnEnd.bind(this)
        };
    }

    translate(action, playerName) {
        const translator = this.messageTypes[action.type];
        if (translator) {
            return translator(action, playerName);
        }
        return { text: `不明なアクション: ${action.type}`, type: 'normal' };
    }

    translateDraw(action, playerName) {
        const data = action.data;
        if (data.cards && data.cards.length > 0) {
            const cardNames = data.cards.join('、');
            return {
                text: `${playerName} が ${cardNames} を引きました。`,
                type: 'normal'
            };
        } else if (data.count) {
            return {
                text: `${playerName} がカードを${data.count}枚引きました。`,
                type: 'normal'
            };
        }
        return {
            text: `${playerName} がカードを引きました。`,
            type: 'normal'
        };
    }

    translatePlayCard(action, playerName) {
        return {
            text: `${playerName} が ${action.data.cardName} を使用しました。`,
            type: 'normal'
        };
    }

    translateAttachEnergy(action, playerName) {
        return {
            text: `${playerName} が ${action.data.target} に ${action.data.energyType} をつけました。`,
            type: 'normal'
        };
    }

    translateUseAttack(action, playerName) {
        const data = action.data;
        return {
            text: `${playerName} の ${data.pokemonName} が「${data.attackName}」を使いました。（${data.damage}ダメージ）`,
            type: 'attack'
        };
    }

    translateDamage(action, playerName) {
        return {
            text: `${playerName} の ${action.data.target} に ${action.data.amount} ダメージ。`,
            type: 'normal'
        };
    }

    translateKnockout(action, playerName) {
        return {
            text: `${playerName} の ${action.data.pokemonName} がきぜつしました！`,
            type: 'knockout'
        };
    }

    translateTakePrize(action, playerName) {
        const count = action.data.count || 1;
        return {
            text: `${playerName} がサイドを${count}枚取りました！`,
            type: 'prize'
        };
    }

    translateEvolve(action, playerName) {
        return {
            text: `${playerName} が ${action.data.from} を ${action.data.to} に進化させました。`,
            type: 'normal'
        };
    }

    translateRetreat(action, playerName) {
        return {
            text: `${playerName} の ${action.data.pokemon} がベンチに戻りました。`,
            type: 'normal'
        };
    }

    translateTurnEnd(action, playerName) {
        return {
            text: `${playerName} のターンが終了しました。`,
            type: 'turn-end'
        };
    }
}

export { MessageTranslator };
