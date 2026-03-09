if (!document.getElementById('ks-elf-animations')) {
    const style = document.createElement('style');
    style.id = 'ks-elf-animations';
    style.innerHTML = `
        @keyframes ks-laser-fade { 0% { opacity: 1; filter: brightness(2); } 100% { opacity: 0; filter: brightness(1); height: 1px; } }
        @keyframes ks-wind-dash { 0% { transform: translate(-50%, -50%) scale(1) rotate(0deg); opacity: 0.8; filter: blur(2px); } 100% { transform: translate(-50%, -50%) scale(2.5) rotate(180deg); opacity: 0; filter: blur(10px); } }
        @keyframes ks-aoe-zone { 0% { transform: translate(-50%, -50%) scale(0.1); opacity: 0.8; } 10% { transform: translate(-50%, -50%) scale(1); opacity: 1; } 90% { transform: translate(-50%, -50%) scale(1); opacity: 1; } 100% { transform: translate(-50%, -50%) scale(1); opacity: 0; } }
        @keyframes ks-arrow-drop { 0% { transform: translateY(-150px) scaleY(2); opacity: 0; } 20% { opacity: 1; } 80% { transform: translateY(0px) scaleY(1); opacity: 1; } 100% { transform: translateY(0px) scaleY(0.2); opacity: 0; } }
        @keyframes ks-heal-float { 0% { transform: translateY(10px) scale(0.5); opacity: 0; } 50% { opacity: 1; transform: translateY(-20px) scale(1.2); } 100% { transform: translateY(-60px) scale(0.5); opacity: 0; } }
        @keyframes ks-fairy-ball-spawn { 0% { scale: 0.2; opacity: 0; } 100% { scale: 1; opacity: 1; } }
    `;
    document.head.appendChild(style);
}

window.triggerElfRangedAttackFX = function(startX, startY, endX, endY) {
    const map = document.getElementById('worldMap'); if(!map) return;

    const ball = document.createElement('div');
    ball.style.position = 'absolute';
    ball.style.width = '12px'; ball.style.height = '12px';
    ball.style.background = 'radial-gradient(circle, #fff 10%, #4caf50 60%, transparent 90%)';
    ball.style.borderRadius = '50%';
    ball.style.boxShadow = '0 0 10px #00ff88, 0 0 5px #fff';
    ball.style.pointerEvents = 'none';
    ball.style.zIndex = '9001'; 
    ball.style.transform = 'translate(-50%, -50%)'; 

    let travelTime = 150;
    ball.animate([
        { left: startX + 'px', top: startY + 'px' },
        { left: endX + 'px', top: endY + 'px' }
    ], { duration: travelTime, easing: 'linear', fill: 'forwards' });

    map.appendChild(ball);

    for(let i=0; i<3; i++) {
        setTimeout(() => {
            const part = document.createElement('div');
            part.style.position = 'absolute'; part.style.left = startX + 'px'; part.style.top = startY + 'px';
            part.style.width = '4px'; part.style.height = '4px';
            part.style.background = '#88ffbb'; part.style.borderRadius = '50%'; part.style.pointerEvents = 'none';
            part.style.transform = 'translate(-50%, -50%)';
            part.animate([
                { transform: `translate(-50%, -50%)`, opacity: 1 },
                { transform: `translate(calc(-50% + ${ (Math.random()-0.5)*20 }px), calc(-50% + ${ (Math.random()-0.5)*20 }px))`, opacity: 0 }
            ], { duration: 250, easing: 'ease-out' });
            map.appendChild(part);
            setTimeout(() => part.remove(), 250);
        }, i*30);
    }

    setTimeout(() => {
        ball.remove(); 

        const impact = document.createElement('div');
        impact.style.position = 'absolute'; impact.style.left = endX + 'px'; impact.style.top = endY + 'px';
        impact.style.width = '25px'; impact.style.height = '25px';
        impact.style.background = 'radial-gradient(circle, #fff 10%, #00ff88 60%, transparent 80%)';
        impact.style.borderRadius = '50%'; impact.style.transform = 'translate(-50%, -50%)';
        impact.style.pointerEvents = 'none'; impact.style.zIndex = '9002';
        impact.animate([ { transform: 'translate(-50%, -50%) scale(0.1)', opacity: 1 }, { transform: 'translate(-50%, -50%) scale(1.3)', opacity: 0 } ], { duration: 200, easing: 'ease-out' });
        map.appendChild(impact);
        setTimeout(() => impact.remove(), 200);

        for(let i=0; i<4; i++) {
            const trail = document.createElement('div');
            trail.style.position = 'absolute'; trail.style.left = endX + 'px'; trail.style.top = endY + 'px';
            trail.style.width = '3px'; trail.style.height = '3px'; trail.style.background = '#aeea00'; trail.style.borderRadius = '50%'; trail.style.pointerEvents = 'none';
            trail.animate([{ transform: `translate(-50%, -50%) scale(1.5)`, opacity: 0.8 }, { transform: `translate(calc(-50% + ${(Math.random()-0.5)*15}px), calc(-50% + ${(Math.random()-0.5)*15}px)) scale(0)`, opacity: 0 }], { duration: 300 });
            map.appendChild(trail);
            setTimeout(() => trail.remove(), 300);
        }
    }, travelTime);
};

window.playElfFX = function(x, y, skillName, targetX, targetY) {
    const elfSkills = ['True Shot', 'Wind Dash', 'Arrow Rain', 'Nature Sanctuary'];
    if (!elfSkills.includes(skillName)) return false; 

    const map = document.getElementById('worldMap'); if(!map) return false;

    let tX = targetX || (window.lastSkillTarget ? window.lastSkillTarget.x : x);
    let tY = targetY || (window.lastSkillTarget ? window.lastSkillTarget.y : y);

    const fx = document.createElement('div');
    fx.style.position = 'absolute';
    fx.style.pointerEvents = 'none';
    fx.style.zIndex = '9000'; 

    if (skillName === 'True Shot') {
        fx.style.left = x + 'px'; fx.style.top = y + 'px';
        let dist = Math.hypot(tY - y, tX - x);
        let angle = Math.atan2(tY - y, tX - x) * (180 / Math.PI);
        fx.style.width = dist + 'px'; fx.style.height = '4px';
        fx.style.background = '#aeea00';
        fx.style.boxShadow = '0 0 15px #4caf50, 0 0 5px #fff';
        fx.style.transformOrigin = '0 50%'; 
        fx.style.transform = `translate(0, -50%) rotate(${angle}deg)`;
        fx.style.animation = 'ks-laser-fade 0.3s ease-out forwards';
        
        const explosion = document.createElement('div');
        explosion.style.position = 'absolute';
        explosion.style.left = tX + 'px'; explosion.style.top = tY + 'px';
        explosion.style.width = '40px'; explosion.style.height = '40px';
        explosion.style.background = 'radial-gradient(circle, #fff 0%, #4caf50 60%, transparent 100%)';
        explosion.style.borderRadius = '50%';
        explosion.style.transform = 'translate(-50%, -50%)';
        explosion.style.pointerEvents = 'none';
        explosion.style.zIndex = '9001';
        explosion.animate([ { transform: 'translate(-50%, -50%) scale(0.5)', opacity: 1 }, { transform: 'translate(-50%, -50%) scale(2)', opacity: 0 } ], { duration: 300, easing: 'ease-out' });
        map.appendChild(explosion);
        setTimeout(() => explosion.remove(), 300);
        map.appendChild(fx);
        setTimeout(() => fx.remove(), 300);
    }
    else if (skillName === 'Wind Dash') {
        fx.style.left = x + 'px'; fx.style.top = y + 'px';
        fx.style.width = '100px'; fx.style.height = '100px';
        fx.style.border = '6px solid #b2dfdb';
        fx.style.borderTopColor = 'transparent';
        fx.style.borderBottomColor = 'transparent';
        fx.style.borderRadius = '50%';
        fx.style.animation = 'ks-wind-dash 0.4s ease-out forwards';
        map.appendChild(fx);
        setTimeout(() => fx.remove(), 400);
    }
    else if (skillName === 'Arrow Rain') {
        fx.style.left = x + 'px'; fx.style.top = y + 'px';
        fx.style.width = '440px'; fx.style.height = '440px';
        fx.style.border = '2px dashed rgba(0, 191, 255, 0.4)';
        fx.style.background = 'radial-gradient(circle, rgba(0, 191, 255, 0.1) 0%, transparent 70%)';
        fx.style.borderRadius = '50%';
        fx.style.animation = 'ks-aoe-zone 4s linear forwards';
        
        let dropInterval = setInterval(() => {
            if(!document.getElementById('worldMap').contains(fx)) { clearInterval(dropInterval); return; }
            const ping = document.createElement('div');
            ping.style.position = 'absolute';
            let r = Math.random() * 200; let t = Math.random() * 2 * Math.PI;
            ping.style.left = `calc(50% + ${Math.cos(t)*r}px)`;
            ping.style.top = `calc(50% + ${Math.sin(t)*r}px)`;
            ping.style.width = '2px'; ping.style.height = '35px';
            ping.style.background = '#00bfff';
            ping.style.boxShadow = '0 0 8px #00bfff, 0 0 2px #fff';
            ping.style.animation = 'ks-arrow-drop 0.3s ease-in forwards';
            fx.appendChild(ping);
            setTimeout(() => { if(ping.parentNode) ping.remove(); }, 300);
        }, 60);

        map.appendChild(fx);
        setTimeout(() => fx.remove(), 4000);
    }
    else if (skillName === 'Nature Sanctuary') {
        const cursorNode = document.getElementById('cursor-container');
        if(!cursorNode) return false;
        fx.style.left = '22.5px'; fx.style.top = '22.5px';
        fx.style.transform = 'translate(-50%, -50%)';
        fx.style.width = '400px'; fx.style.height = '400px';
        fx.style.border = '2px solid rgba(0, 230, 118, 0.5)';
        fx.style.background = 'radial-gradient(circle, rgba(0, 230, 118, 0.15) 0%, transparent 80%)';
        fx.style.borderRadius = '50%';
        fx.style.animation = 'ks-aoe-zone 5s linear forwards'; 
        
        let healInterval = setInterval(() => {
            if(!cursorNode.contains(fx)) { clearInterval(healInterval); return; }
            const particle = document.createElement('div');
            particle.style.position = 'absolute';
            particle.style.width = '6px'; particle.style.height = '6px';
            particle.style.background = '#ff2a2a';
            particle.style.borderRadius = '50%';
            particle.style.boxShadow = '0 0 8px #ff2a2a, 0 0 4px #fff';
            let r = Math.random() * 180; let t = Math.random() * 2 * Math.PI;
            particle.style.left = `calc(50% + ${Math.cos(t)*r}px)`;
            particle.style.top = `calc(50% + ${Math.sin(t)*r}px)`;
            particle.style.animation = 'ks-heal-float 1.2s ease-out forwards';
            fx.appendChild(particle);
            setTimeout(() => { if(particle.parentNode) particle.remove(); }, 1200);
        }, 150);
        cursorNode.appendChild(fx); 
        setTimeout(() => fx.remove(), 5000);
        return true; 
    }
    return true; 
};