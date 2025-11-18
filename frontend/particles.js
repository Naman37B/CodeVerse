(function () {
  const canvas = document.getElementById("particleCanvas");
  if (!canvas) return;

  const ctx = canvas.getContext("2d");
  let W = innerWidth,
    H = innerHeight;
  let particles = [];
  const count = 120;
  let mouse = { x: W / 2, y: H / 2 };

  function resize() {
    W = innerWidth;
    H = innerHeight;
    canvas.width = W;
    canvas.height = H;
    particles = [];

    for (let i = 0; i < count; i++) {
      particles.push({
        x: Math.random() * W,
        y: Math.random() * H,
        z: Math.random() * 1.5 + 0.5,
        r: Math.random() * 1.5 + 0.5,
        vx: (Math.random() - 0.5) * 0.4,
        vy: (Math.random() - 0.5) * 0.4,
      });
    }
  }
  resize();

  window.addEventListener("resize", resize);
  document.addEventListener("mousemove", (e) => {
    mouse.x = e.clientX;
    mouse.y = e.clientY;
  });

  function draw() {
    ctx.clearRect(0, 0, W, H);

    for (const p of particles) {
      const dx = (mouse.x - W / 2) * 0.0005 * p.z;
      const dy = (mouse.y - H / 2) * 0.0005 * p.z;

      p.x += p.vx + dx;
      p.y += p.vy + dy;

      if (p.x < 0) p.x = W;
      if (p.x > W) p.x = 0;
      if (p.y < 0) p.y = H;
      if (p.y > H) p.y = 0;

      const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, 8);
      g.addColorStop(0, "rgba(147,197,253,0.9)");
      g.addColorStop(1, "rgba(96,165,250,0)");

      ctx.fillStyle = g;

      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r * 2.2, 0, Math.PI * 2);
      ctx.fill();
    }

    requestAnimationFrame(draw);
  }

  draw();
})();
