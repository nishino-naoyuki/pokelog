// Effects Renderer Module
// Renders visual effects for attacks, knockouts, etc.

class EffectsRenderer {
    constructor() {
        this.activeEffects = [];
    }

    showAttackEffect(sourceElement, targetElement, attackType = 'normal') {
        // Create a simple flash effect on the target
        if (!targetElement) return;

        const originalFilter = targetElement.style.filter;

        // Flash red for damage
        targetElement.style.filter = 'brightness(1.5) saturate(2)';
        targetElement.style.transition = 'filter 0.2s';

        setTimeout(() => {
            targetElement.style.filter = originalFilter;
        }, 200);

        // Show damage animation
        this.showDamageNumber(targetElement, attackType);
    }

    showDamageNumber(targetElement, attackType) {
        if (!targetElement) return;

        const damageEl = document.createElement('div');
        damageEl.className = 'damage-animation';
        damageEl.textContent = attackType === 'strong' ? '!!!' : '!';
        damageEl.style.cssText = `
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            font-size: 48px;
            font-weight: bold;
            color: #F44336;
            text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.5);
            animation: damageFloat 1s ease-out forwards;
            pointer-events: none;
            z-index: 1000;
        `;

        targetElement.style.position = 'relative';
        targetElement.appendChild(damageEl);

        setTimeout(() => {
            damageEl.remove();
        }, 1000);
    }

    showKnockoutEffect(pokemonElement) {
        if (!pokemonElement) return;

        pokemonElement.style.transition = 'all 0.5s';
        pokemonElement.style.opacity = '0.3';
        pokemonElement.style.transform = 'scale(0.8)';

        setTimeout(() => {
            pokemonElement.style.opacity = '0';
            setTimeout(() => {
                pokemonElement.remove();
            }, 300);
        }, 500);
    }

    showPrizeCardEffect(prizeElement, handElement) {
        if (!prizeElement || !handElement) return;

        // Animate prize card moving to hand
        const prizeRect = prizeElement.getBoundingClientRect();
        const handRect = handElement.getBoundingClientRect();

        const cardClone = prizeElement.cloneNode(true);
        cardClone.style.cssText = `
            position: fixed;
            top: ${prizeRect.top}px;
            left: ${prizeRect.left}px;
            width: ${prizeRect.width}px;
            height: ${prizeRect.height}px;
            z-index: 2000;
            transition: all 0.8s ease-in-out;
            pointer-events: none;
        `;

        document.body.appendChild(cardClone);

        setTimeout(() => {
            cardClone.style.top = `${handRect.top}px`;
            cardClone.style.left = `${handRect.left}px`;
            cardClone.style.opacity = '0';
        }, 50);

        setTimeout(() => {
            cardClone.remove();
        }, 850);
    }
}

// Add CSS animation for damage float
const style = document.createElement('style');
style.textContent = `
    @keyframes damageFloat {
        0% {
            opacity: 1;
            transform: translate(-50%, -50%) scale(1);
        }
        100% {
            opacity: 0;
            transform: translate(-50%, -150%) scale(1.5);
        }
    }
`;
document.head.appendChild(style);

export { EffectsRenderer };
