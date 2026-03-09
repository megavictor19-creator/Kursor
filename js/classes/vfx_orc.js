if (!document.getElementById('ks-orc-animations')) {
    const style = document.createElement('style');
    style.id = 'ks-orc-animations';
    style.innerHTML = `
        @keyframes ks-blood-slash { 0% { transform: translate(-50%, -50%) scale(0.2) rotate(-30deg); opacity: 1; } 100% { transform: translate(-50%, -50%) scale(1.8) rotate(15deg); opacity: 0; } }
        @keyframes ks-roar-wave { 0% { transform: translate(-50%, -50%) scale(0.1); opacity: 1; border-width: 15px; } 100% { transform: translate(-50%, -50%) scale(2.5); opacity: 0; border-width: 1px; } }
        @keyframes ks-earthquake { 0% { transform: translate(-50%, -50%) scale(0.5); opacity: 1; filter: brightness(1.5); } 100% { transform: translate(-50%, -50%) scale(3); opacity: 0; filter: brightness(0.5); } }
    `;
    document.head.appendChild(style);
}

window.playOrcFX = function(x, y, skillName, targetX, targetY) {
    const orcSkills = ['Heavy Strike', 'Battle Cry', 'Brutal Charge', 'Earthquake', 'Whirlwind'];
    if (!orcSkills.includes(skillName)) return false; 

    const map = document.getElementById('worldMap'); if(!map) return false;
    
    const fx = document.createElement('div');
    fx.style.position = 'absolute';
    fx.style.left = x + 'px';
    fx.style.top = y + 'px';
    fx.style.pointerEvents = 'none';
    fx.style.zIndex = '9000'; 

    if (skillName === 'Heavy Strike') {
        fx.style.width = '120px'; fx.style.height = '120px'; 
        fx.style.background = 'radial-gradient(circle, rgba(255,42,42,0.6) 0%, transparent 60%)';
        fx.style.borderTop = '8px solid #ff2a2a';
        fx.style.borderRadius = '50%';
        fx.style.animation = 'ks-blood-slash 0.3s ease-out forwards';
    }
    else if (skillName === 'Battle Cry') {
        fx.style.width = '120px'; fx.style.height = '120px';
        fx.style.border = '4px solid rgba(255, 202, 40, 0.9)';
        fx.style.borderRadius = '50%';
        fx.style.animation = 'ks-roar-wave 0.5s ease-out forwards';
    }
    else if (skillName === 'Brutal Charge') {
        fx.style.width = '80px'; fx.style.height = '80px';
        fx.style.background = 'rgba(120, 90, 60, 0.6)';
        fx.style.borderRadius = '50%';
        fx.style.filter = 'blur(6px)';
        fx.style.transition = 'transform 0.4s ease-out, opacity 0.4s';
        fx.style.transform = 'translate(-50%, -50%) scale(0.5)';
        void fx.offsetWidth;
        fx.style.transform = 'translate(-50%, -50%) scale(2.5)';
        fx.style.opacity = '0';
    }
    else if (skillName === 'Earthquake') {
        fx.style.width = '250px'; fx.style.height = '250px';
        fx.style.background = 'radial-gradient(circle, rgba(139, 69, 19, 0.9) 0%, transparent 70%)';
        fx.style.border = '3px dashed #ffae00';
        fx.style.borderRadius = '50%';
        fx.style.animation = 'ks-earthquake 0.6s ease-out forwards';
        
        for(let i=0; i<6; i++) {
            const rock = document.createElement('div');
            rock.innerText = "🪨";
            rock.style.position = "absolute";
            rock.style.left = "50%"; rock.style.top = "50%";
            let rx = (Math.random() - 0.5) * 400; let ry = (Math.random() - 0.5) * 400;
            rock.style.transition = "transform 0.6s cubic-bezier(0.1, 0.8, 0.3, 1), opacity 0.6s";
            rock.style.transform = "translate(-50%, -50%) scale(0.5)";
            fx.appendChild(rock);
            setTimeout(() => { rock.style.transform = `translate(calc(-50% + ${rx}px), calc(-50% + ${ry}px)) scale(1.8) rotate(${Math.random()*720}deg)`; rock.style.opacity = "0"; }, 50);
        }
        
        document.body.style.animation = 'none';
        void document.body.offsetWidth;
        document.body.style.animation = 'ks-crit-shake-light 0.4s ease-out';
    }
    else if (skillName === 'Whirlwind') {
        fx.style.width = '160px'; fx.style.height = '160px';
        fx.style.border = '4px solid rgba(255, 42, 42, 0.8)';
        fx.style.borderLeftColor = 'transparent';
        fx.style.borderRightColor = 'transparent';
        fx.style.borderRadius = '50%';
        fx.style.boxShadow = '0 0 20px rgba(255, 0, 0, 0.5)';
        fx.style.animation = 'ks-whirlwind 0.4s cubic-bezier(0.1, 0.8, 0.3, 1) forwards';
    }

    map.appendChild(fx);
    setTimeout(() => fx.remove(), 600);
    return true; 
};