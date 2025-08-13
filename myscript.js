
/* Neural-network style animated background on canvas
   Controls you can tweak:
     - NODE_DENSITY: lower => fewer nodes
     - MAX_DIST: connection distance
     - SPEED: node drift multiplier
*/
(function () {
    const canvas = document.getElementById('bgCanvas');
    if (!canvas || !canvas.getContext) return;
    const ctx = canvas.getContext('2d');
    let W = 0, H = 0, DPR = Math.max(1, window.devicePixelRatio || 1);

    // CONFIG
    const NODE_DENSITY = 20000; // pixels per node (bigger => fewer nodes)
    const MAX_DIST = 160;       // max distance to draw a line
    const SPEED = 0.25;         // movement speed multiplier
    const LINE_WIDTH = 0.9;     // base line width

    let nodes = [];

    function resize() {
        W = Math.max(document.documentElement.clientWidth, window.innerWidth || 0);
        H = Math.max(document.documentElement.clientHeight, window.innerHeight || 0);
        canvas.width = Math.floor(W * DPR);
        canvas.height = Math.floor(H * DPR);
        canvas.style.width = W + 'px';
        canvas.style.height = H + 'px';
        ctx.setTransform(DPR, 0, 0, DPR, 0, 0);

        const targetCount = Math.max(18, Math.floor((W * H) / NODE_DENSITY));
        // adjust number of nodes
        while (nodes.length < targetCount) nodes.push(createNode());
        while (nodes.length > targetCount) nodes.pop();
    }

    function createNode() {
        return {
            x: Math.random() * W,
            y: Math.random() * H,
            vx: (Math.random() - 0.5) * SPEED,
            vy: (Math.random() - 0.5) * SPEED,
            r: 0.5 + Math.random() * 1.2
        };
    }

    function step() {
        ctx.clearRect(0, 0, W, H);

        // subtle background overlay for depth
        // ctx.fillStyle = 'rgba(10,12,15,0.2)'; ctx.fillRect(0,0,W,H);

        // move nodes
        for (let i = 0; i < nodes.length; i++) {
            const n = nodes[i];
            n.x += n.vx;
            n.y += n.vy;

            // wrap around edges for smoothness
            if (n.x < -20) n.x = W + 20;
            if (n.x > W + 20) n.x = -20;
            if (n.y < -20) n.y = H + 20;
            if (n.y > H + 20) n.y = -20;
        }

        // draw connections
        ctx.lineWidth = LINE_WIDTH;
        ctx.lineCap = 'round';
        ctx.globalCompositeOperation = 'lighter';

        for (let i = 0; i < nodes.length; i++) {
            const a = nodes[i];
            for (let j = i + 1; j < nodes.length; j++) {
                const b = nodes[j];
                const dx = a.x - b.x;
                const dy = a.y - b.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (dist > MAX_DIST) continue;
                const alpha = 1 - (dist / MAX_DIST);
                ctx.strokeStyle = `rgba(255,255,255,${0.08 + 0.9 * alpha})`;
                ctx.beginPath();
                ctx.moveTo(a.x, a.y);
                ctx.lineTo(b.x, b.y);
                ctx.stroke();
            }
        }

        // draw nodes as tiny glowing dots
        for (let i = 0; i < nodes.length; i++) {
            const n = nodes[i];
            ctx.beginPath();
            ctx.fillStyle = 'rgba(255,255,255,0.9)';
            ctx.shadowColor = 'rgba(255,255,255,0.8)';
            ctx.shadowBlur = 6;
            ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2);
            ctx.fill();
            ctx.shadowBlur = 0;
        }

        ctx.globalCompositeOperation = 'source-over';
        requestAnimationFrame(step);
    }

    // gentle autospeed variation to feel "alive"
    let lastUpdate = performance.now();
    function randomizeVelocities() {
        const now = performance.now();
        if (now - lastUpdate > 2500) {
            lastUpdate = now;
            for (const n of nodes) {
                // small smooth velocity nudges
                n.vx += (Math.random() - 0.5) * 0.12;
                n.vy += (Math.random() - 0.5) * 0.12;
                // clamp speed
                n.vx = Math.max(-1.2, Math.min(1.2, n.vx));
                n.vy = Math.max(-1.2, Math.min(1.2, n.vy));
            }
        }
        requestAnimationFrame(randomizeVelocities);
    }

    // handle focus/visibility to save CPU
    let running = true;
    document.addEventListener('visibilitychange', () => { running = !document.hidden; });

    // resize handler
    window.addEventListener('resize', () => { resize(); });

    // init
    resize();
    requestAnimationFrame(step);
    requestAnimationFrame(randomizeVelocities);

    // expose config for easy tweaking from console
    window._neuralBG = { nodes, resize, config: { NODE_DENSITY, MAX_DIST, SPEED, LINE_WIDTH } };
})();