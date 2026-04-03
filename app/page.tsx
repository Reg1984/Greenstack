"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

const PASSWORD = "greenstack2026";

function GlassCube() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);
  const timeRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    let w: number, h: number;

    const resize = () => {
      w = canvas.width = canvas.offsetWidth * window.devicePixelRatio;
      h = canvas.height = canvas.offsetHeight * window.devicePixelRatio;
    };
    resize();
    window.addEventListener("resize", resize);

    const project = (x: number, y: number, z: number, rx: number, ry: number) => {
      const cosX = Math.cos(rx), sinX = Math.sin(rx);
      const cosY = Math.cos(ry), sinY = Math.sin(ry);
      const y1 = y * cosX - z * sinX;
      const z1 = y * sinX + z * cosX;
      const x1 = x * cosY + z1 * sinY;
      const z2 = -x * sinY + z1 * cosY;
      const fov = 600;
      const scale = fov / (fov + z2 + 300);
      return { x: x1 * scale + w / 2, y: y1 * scale + h / 2, z: z2 };
    };

    const drawFace = (pts: { x: number; y: number }[], color: string, alpha: number) => {
      ctx.beginPath();
      ctx.moveTo(pts[0].x, pts[0].y);
      for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y);
      ctx.closePath();
      ctx.fillStyle = color;
      ctx.globalAlpha = alpha;
      ctx.fill();
      ctx.globalAlpha = 1;
      ctx.strokeStyle = "rgba(255,255,255,0.15)";
      ctx.lineWidth = 1.5 * window.devicePixelRatio;
      ctx.stroke();
    };

    const animate = () => {
      timeRef.current += 0.006;
      const t = timeRef.current;
      ctx.clearRect(0, 0, w, h);

      const rx = t * 0.4;
      const ry = t * 0.6;
      const S = Math.min(w, h) * 0.22;

      const verts = [
        [-S, -S, -S], [S, -S, -S], [S, S, -S], [-S, S, -S],
        [-S, -S, S], [S, -S, S], [S, S, S], [-S, S, S],
      ].map(([x, y, z]) => project(x, y, z, rx, ry));

      const faces = [
        { idx: [0, 1, 2, 3], hue: 160 + Math.sin(t) * 40 },
        { idx: [4, 5, 6, 7], hue: 200 + Math.sin(t + 1) * 40 },
        { idx: [0, 1, 5, 4], hue: 140 + Math.sin(t + 2) * 40 },
        { idx: [2, 3, 7, 6], hue: 180 + Math.sin(t + 3) * 40 },
        { idx: [0, 3, 7, 4], hue: 120 + Math.sin(t + 4) * 40 },
        { idx: [1, 2, 6, 5], hue: 220 + Math.sin(t + 5) * 40 },
      ];

      const avgZ = faces
        .map((f) => ({ ...f, z: f.idx.reduce((s, i) => s + verts[i].z, 0) / 4 }))
        .sort((a, b) => a.z - b.z);

      avgZ.forEach(({ idx, hue, z }) => {
        const pts = idx.map((i) => verts[i]);
        const lightness = Math.round(50 + (z / S) * 15);
        drawFace(pts, `hsla(${Math.round(hue)},70%,${lightness}%,1)`, 0.18 + Math.sin(t) * 0.05);
      });

      const grad = ctx.createLinearGradient(0, h * 0.3, w, h * 0.7);
      grad.addColorStop(0, "transparent");
      grad.addColorStop(0.3, `hsla(${160 + Math.sin(t) * 30}, 80%, 60%, 0.06)`);
      grad.addColorStop(0.5, `hsla(${200 + Math.sin(t + 1) * 30}, 80%, 70%, 0.08)`);
      grad.addColorStop(0.7, `hsla(${240 + Math.sin(t + 2) * 30}, 80%, 60%, 0.06)`);
      grad.addColorStop(1, "transparent");
      ctx.globalAlpha = 1;
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);

      animRef.current = requestAnimationFrame(animate);
    };

    animate();
    return () => {
      cancelAnimationFrame(animRef.current);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none" }}
    />
  );
}

function StarField() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    let w: number, h: number;
    let stars: { x: number; y: number; r: number; o: number; speed: number }[] = [];

    const resize = () => {
      w = canvas.width = canvas.offsetWidth * window.devicePixelRatio;
      h = canvas.height = canvas.offsetHeight * window.devicePixelRatio;
      stars = Array.from({ length: 120 }, () => ({
        x: Math.random() * w, y: Math.random() * h,
        r: Math.random() * 1.5 + 0.3,
        o: Math.random() * 0.6 + 0.1,
        speed: Math.random() * 0.3 + 0.05,
      }));
    };
    resize();
    window.addEventListener("resize", resize);

    let t = 0;
    let raf: number;
    const animate = () => {
      t += 0.01;
      ctx.clearRect(0, 0, w, h);
      stars.forEach((s) => {
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r * window.devicePixelRatio, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255,255,255,${s.o * (0.5 + 0.5 * Math.sin(t * s.speed * 10))})`;
        ctx.fill();
      });
      raf = requestAnimationFrame(animate);
    };
    animate();
    return () => { cancelAnimationFrame(raf); window.removeEventListener("resize", resize); };
  }, []);

  return (
    <canvas ref={canvasRef} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none" }} />
  );
}

export default function GreenStackLanding() {
  const router = useRouter();
  const [pw, setPw] = useState("");
  const [error, setError] = useState(false);
  const [shake, setShake] = useState(false);
  const [loading, setLoading] = useState(false);
  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    setTimeout(() => setRevealed(true), 100);
    const stored = sessionStorage.getItem("gs_auth");
    if (stored === "true") router.push("/dashboard");
  }, [router]);

  const handleLogin = () => {
    setLoading(true);
    setTimeout(() => {
      if (pw === PASSWORD) {
        sessionStorage.setItem("gs_auth", "true");
        router.push("/dashboard");
      } else {
        setError(true);
        setShake(true);
        setPw("");
        setTimeout(() => { setShake(false); setError(false); }, 600);
        setLoading(false);
      }
    }, 800);
  };

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleLogin();
  };

  return (
    <div style={{
      minHeight: "100vh",
      background: "radial-gradient(ellipse at 20% 50%, #0a1a0f 0%, #030808 50%, #050510 100%)",
      display: "flex", flexDirection: "column",
      fontFamily: "'Syne', sans-serif",
      overflow: "hidden", position: "relative"
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;500;600;700;800&family=DM+Mono:wght@300;400;500&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        .reveal { opacity: 0; transform: translateY(30px); transition: all 0.9s cubic-bezier(0.16,1,0.3,1); }
        .reveal.on { opacity: 1; transform: translateY(0); }
        .shake { animation: shake 0.5s ease; }
        @keyframes shake {
          0%,100% { transform: translateX(0); }
          20% { transform: translateX(-8px); }
          40% { transform: translateX(8px); }
          60% { transform: translateX(-6px); }
          80% { transform: translateX(6px); }
        }
        .glow-btn {
          background: linear-gradient(135deg, rgba(0,255,135,0.15), rgba(0,200,255,0.1));
          border: 1px solid rgba(0,255,135,0.4);
          color: #00ff87;
          padding: 14px 32px;
          font-family: 'DM Mono', monospace;
          font-size: 13px;
          letter-spacing: 2px;
          cursor: pointer;
          transition: all 0.3s ease;
          backdrop-filter: blur(10px);
        }
        .glow-btn:hover {
          background: linear-gradient(135deg, rgba(0,255,135,0.25), rgba(0,200,255,0.2));
          border-color: rgba(0,255,135,0.8);
          box-shadow: 0 0 30px rgba(0,255,135,0.3), inset 0 0 30px rgba(0,255,135,0.05);
          transform: translateY(-1px);
        }
        .glow-btn:disabled { opacity: 0.6; cursor: not-allowed; transform: none; }
        .pw-input {
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.1);
          color: #fff;
          font-family: 'DM Mono', monospace;
          font-size: 18px;
          letter-spacing: 4px;
          padding: 16px 20px;
          text-align: center;
          width: 100%;
          outline: none;
          transition: all 0.3s;
          backdrop-filter: blur(10px);
        }
        .pw-input:focus {
          border-color: rgba(0,255,135,0.5);
          box-shadow: 0 0 20px rgba(0,255,135,0.1);
          background: rgba(0,255,135,0.04);
        }
        .pw-input.error {
          border-color: rgba(255,80,80,0.6);
          box-shadow: 0 0 20px rgba(255,80,80,0.15);
        }
        .pw-input::placeholder { color: rgba(255,255,255,0.15); letter-spacing: 2px; font-size: 14px; }
        .tag {
          display: inline-block;
          border: 1px solid rgba(0,255,135,0.3);
          color: rgba(0,255,135,0.7);
          font-family: 'DM Mono', monospace;
          font-size: 10px;
          letter-spacing: 3px;
          padding: 4px 12px;
        }
        .metric {
          border-left: 1px solid rgba(0,255,135,0.2);
          padding: 8px 0 8px 20px;
        }
        .partner {
          color: rgba(255,255,255,0.25);
          font-family: 'DM Mono', monospace;
          font-size: 11px;
          letter-spacing: 3px;
          cursor: default;
          transition: color 0.3s;
        }
        .partner:hover { color: rgba(0,255,135,0.6); }
        .light-beam {
          position: absolute; top: 0; bottom: 0; width: 1px;
          background: linear-gradient(180deg, transparent, rgba(0,255,135,0.4), rgba(0,200,255,0.3), transparent);
          animation: beam 4s ease-in-out infinite;
        }
        @keyframes beam { 0%,100% { opacity: 0.3; } 50% { opacity: 0.8; } }
        .scan-line {
          position: absolute; left: 0; right: 0; height: 1px;
          background: linear-gradient(90deg, transparent, rgba(0,255,135,0.3), transparent);
          animation: scanY 6s linear infinite;
        }
        @keyframes scanY { 0% { top: 0%; opacity: 0; } 10% { opacity: 1; } 90% { opacity: 1; } 100% { top: 100%; opacity: 0; } }
        @keyframes pulse { 0%,100% { opacity: 1; } 50% { opacity: 0.4; } }
      `}</style>

      <StarField />

      <div style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
        <div className="light-beam" style={{ left: "25%" }} />
        <div className="light-beam" style={{ left: "75%", animationDelay: "2s" }} />
        <div className="scan-line" />
      </div>

      {/* Nav */}
      <nav className={`reveal ${revealed ? "on" : ""}`} style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "28px 48px", position: "relative", zIndex: 10, transitionDelay: "0.1s"
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{
            width: 36, height: 36,
            background: "linear-gradient(135deg, rgba(0,255,135,0.2), rgba(0,200,255,0.1))",
            border: "1px solid rgba(0,255,135,0.4)",
            display: "flex", alignItems: "center", justifyContent: "center",
            color: "#00ff87", fontSize: 18, fontWeight: 700
          }}>G</div>
          <div>
            <div style={{ color: "#fff", fontWeight: 700, fontSize: 15, letterSpacing: 1 }}>GREENSTACK</div>
            <div style={{ color: "rgba(0,255,135,0.5)", fontSize: 9, letterSpacing: 3, fontFamily: "'DM Mono', monospace" }}>AI PLATFORM</div>
          </div>
        </div>
        <div style={{ display: "flex", gap: 32, alignItems: "center" }}>
          {["About", "Services", "Case Studies"].map((item) => (
            <span key={item} style={{
              color: "rgba(255,255,255,0.4)", fontSize: 13, letterSpacing: 1,
              cursor: "pointer", transition: "color 0.2s", fontWeight: 500
            }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.9)")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.4)")}
            >{item}</span>
          ))}
          <button className="glow-btn" onClick={() => document.getElementById("signin-section")?.scrollIntoView({ behavior: "smooth" })}>
            GET STARTED
          </button>
        </div>
      </nav>

      {/* Hero */}
      <div style={{
        flex: 1, display: "flex", alignItems: "center",
        padding: "0 48px", position: "relative", zIndex: 10,
        gap: 80, maxWidth: 1400, margin: "0 auto", width: "100%"
      }}>
        <div style={{ flex: 1, maxWidth: 600 }}>
          <div className={`reveal ${revealed ? "on" : ""}`} style={{ transitionDelay: "0.2s", marginBottom: 24 }}>
            <span className="tag">◆ EVOLVE YOUR TENDERING</span>
          </div>
          <div className={`reveal ${revealed ? "on" : ""}`} style={{ transitionDelay: "0.35s" }}>
            <h1 style={{ fontSize: "clamp(48px, 6vw, 82px)", fontWeight: 800, lineHeight: 1.05, color: "#fff", marginBottom: 28, letterSpacing: -2 }}>
              Navigating the<br />
              <span style={{
                background: "linear-gradient(135deg, #00ff87, #00d4ff, #7c3aed)",
                WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text"
              }}>route to impactful</span><br />
              procurement
            </h1>
          </div>
          <div className={`reveal ${revealed ? "on" : ""}`} style={{ transitionDelay: "0.5s", marginBottom: 40 }}>
            <p style={{ color: "rgba(255,255,255,0.45)", fontSize: 17, lineHeight: 1.7, fontFamily: "'DM Mono', monospace", fontWeight: 300, maxWidth: 480 }}>
              Guiding organisations toward lasting environmental performance through autonomous AI strategy and measurable outcomes.
            </p>
          </div>
          <div className={`reveal ${revealed ? "on" : ""}`} style={{ transitionDelay: "0.65s", display: "flex", gap: 32, marginBottom: 48 }}>
            {[{ value: "24/7", label: "Always On" }, { value: "AI", label: "Native Delivery" }, { value: "UK", label: "Registered" }].map((m) => (
              <div key={m.label} className="metric">
                <div style={{ color: "#00ff87", fontSize: 26, fontWeight: 700, fontFamily: "'DM Mono', monospace" }}>{m.value}</div>
                <div style={{ color: "rgba(255,255,255,0.3)", fontSize: 11, letterSpacing: 2, fontFamily: "'DM Mono', monospace", marginTop: 4 }}>{m.label.toUpperCase()}</div>
              </div>
            ))}
          </div>
          <div className={`reveal ${revealed ? "on" : ""}`} style={{ transitionDelay: "0.8s" }}>
            <div style={{ color: "rgba(255,255,255,0.2)", fontSize: 10, letterSpacing: 3, fontFamily: "'DM Mono', monospace", marginBottom: 16 }}>POWERED BY</div>
            <div style={{ display: "flex", gap: 28, flexWrap: "wrap" }}>
              {["VERDANT", "TENDER SCOUT", "BID WRITER", "OUTREACH", "BROWSER AGENT", "FINANCIALS"].map((p) => (
                <span key={p} className="partner">{p}</span>
              ))}
            </div>
          </div>
        </div>

        {/* Cube */}
        <div className={`reveal ${revealed ? "on" : ""}`} style={{ transitionDelay: "0.4s", flex: 1, maxWidth: 560, aspectRatio: "1", position: "relative", minHeight: 400 }}>
          <GlassCube />
          <div style={{
            position: "absolute", top: "15%", right: "5%",
            background: "rgba(0,0,0,0.6)", border: "1px solid rgba(0,255,135,0.3)",
            backdropFilter: "blur(20px)", padding: "12px 20px", fontFamily: "'DM Mono', monospace"
          }}>
            <div style={{ color: "rgba(0,255,135,0.6)", fontSize: 9, letterSpacing: 2, marginBottom: 4 }}>AGENT STATUS</div>
            <div style={{ color: "#00ff87", fontSize: 18, fontWeight: 500 }}>VERDANT ONLINE</div>
          </div>
          <div style={{
            position: "absolute", bottom: "20%", left: "5%",
            background: "rgba(0,0,0,0.6)", border: "1px solid rgba(0,200,255,0.3)",
            backdropFilter: "blur(20px)", padding: "12px 20px", fontFamily: "'DM Mono', monospace"
          }}>
            <div style={{ color: "rgba(0,200,255,0.6)", fontSize: 9, letterSpacing: 2, marginBottom: 4 }}>SCANNING</div>
            <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
              <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#00ff87", boxShadow: "0 0 8px #00ff87", animation: "pulse 2s infinite" }} />
              <span style={{ color: "#00d4ff", fontSize: 18, fontWeight: 500 }}>LIVE TENDERS</span>
            </div>
          </div>
        </div>
      </div>

      {/* Sign in */}
      <div id="signin-section" className={`reveal ${revealed ? "on" : ""}`} style={{
        transitionDelay: "1s", position: "relative", zIndex: 10,
        padding: "80px 48px", display: "flex", flexDirection: "column", alignItems: "center",
        borderTop: "1px solid rgba(255,255,255,0.05)"
      }}>
        <div style={{
          width: "100%", maxWidth: 440,
          background: "rgba(255,255,255,0.02)",
          border: "1px solid rgba(255,255,255,0.08)",
          backdropFilter: "blur(40px)", padding: 48, position: "relative"
        }}>
          {[
            { top: -1, left: -1, borderTop: "2px solid rgba(0,255,135,0.6)", borderLeft: "2px solid rgba(0,255,135,0.6)" },
            { top: -1, right: -1, borderTop: "2px solid rgba(0,255,135,0.6)", borderRight: "2px solid rgba(0,255,135,0.6)" },
            { bottom: -1, left: -1, borderBottom: "2px solid rgba(0,255,135,0.6)", borderLeft: "2px solid rgba(0,255,135,0.6)" },
            { bottom: -1, right: -1, borderBottom: "2px solid rgba(0,255,135,0.6)", borderRight: "2px solid rgba(0,255,135,0.6)" },
          ].map((style, i) => (
            <div key={i} style={{ position: "absolute", width: 20, height: 20, ...style }} />
          ))}

          <div style={{ textAlign: "center", marginBottom: 36 }}>
            <div style={{ color: "rgba(0,255,135,0.5)", fontSize: 10, letterSpacing: 4, fontFamily: "'DM Mono', monospace", marginBottom: 12 }}>SECURE ACCESS</div>
            <div style={{ color: "#fff", fontSize: 22, fontWeight: 700, letterSpacing: -0.5 }}>Command Centre</div>
            <div style={{ color: "rgba(255,255,255,0.25)", fontSize: 12, fontFamily: "'DM Mono', monospace", marginTop: 8 }}>Enter access key to continue</div>
          </div>

          <div className={shake ? "shake" : ""}>
            <input
              className={`pw-input${error ? " error" : ""}`}
              type="password"
              placeholder="· · · · · · · · · ·"
              value={pw}
              onChange={(e) => { setPw(e.target.value); setError(false); }}
              onKeyDown={handleKey}
              autoFocus
            />
          </div>

          {error && (
            <div style={{ color: "rgba(255,80,80,0.8)", fontSize: 11, letterSpacing: 2, fontFamily: "'DM Mono', monospace", textAlign: "center", marginTop: 12 }}>
              ACCESS DENIED
            </div>
          )}

          <button className="glow-btn" onClick={handleLogin} disabled={loading} style={{ width: "100%", marginTop: 24, textAlign: "center" }}>
            {loading ? "AUTHENTICATING..." : "ENTER PLATFORM →"}
          </button>

          <div style={{ textAlign: "center", marginTop: 24, color: "rgba(255,255,255,0.15)", fontSize: 10, fontFamily: "'DM Mono', monospace", letterSpacing: 2 }}>
            GREENSTACK AI · RESTRICTED ACCESS
          </div>
        </div>
      </div>
    </div>
  );
}
