"use client";

import { useRef, useEffect } from "react";

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
      stars = Array.from({ length: 80 }, () => ({
        x: Math.random() * w, y: Math.random() * h,
        r: Math.random() * 1.2 + 0.3,
        o: Math.random() * 0.4 + 0.1,
        speed: Math.random() * 0.3 + 0.05,
      }));
    };
    resize();
    window.addEventListener("resize", resize);
    let t = 0, raf: number;
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
  return <canvas ref={canvasRef} style={{ position: "fixed", inset: 0, width: "100%", height: "100%", pointerEvents: "none", zIndex: 0 }} />;
}

export default function CBAMPage() {
  return (
    <div style={{
      minHeight: "100vh",
      background: "radial-gradient(ellipse at 30% 40%, #0a1a0f 0%, #030808 60%, #050510 100%)",
      fontFamily: "'Syne', sans-serif",
      color: "#fff",
      position: "relative",
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;500;600;700;800&family=DM+Mono:wght@300;400;500&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        .mono { font-family: 'DM Mono', monospace; }
        .glow-btn {
          background: linear-gradient(135deg, rgba(0,255,135,0.15), rgba(0,200,255,0.1));
          border: 1px solid rgba(0,255,135,0.5);
          color: #00ff87;
          padding: 16px 40px;
          font-family: 'DM Mono', monospace;
          font-size: 13px;
          letter-spacing: 2px;
          cursor: pointer;
          transition: all 0.3s ease;
          text-decoration: none;
          display: inline-block;
        }
        .glow-btn:hover {
          background: linear-gradient(135deg, rgba(0,255,135,0.25), rgba(0,200,255,0.2));
          border-color: rgba(0,255,135,0.9);
          box-shadow: 0 0 40px rgba(0,255,135,0.25);
        }
        .card {
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.08);
          padding: 32px;
        }
        .card-green {
          background: rgba(0,255,135,0.04);
          border: 1px solid rgba(0,255,135,0.2);
          padding: 32px;
        }
        .tag {
          display: inline-block;
          border: 1px solid rgba(0,255,135,0.4);
          color: rgba(0,255,135,0.8);
          font-family: 'DM Mono', monospace;
          font-size: 10px;
          letter-spacing: 3px;
          padding: 5px 14px;
        }
        .divider {
          border: none;
          border-top: 1px solid rgba(255,255,255,0.06);
          margin: 64px 0;
        }
        .timeline-row {
          display: flex;
          gap: 16px;
          padding: 16px 0;
          border-bottom: 1px solid rgba(255,255,255,0.05);
          align-items: center;
        }
        .price-col {
          flex: 1;
          background: rgba(255,255,255,0.02);
          border: 1px solid rgba(255,255,255,0.07);
          padding: 28px;
          transition: border-color 0.3s;
        }
        .price-col:hover { border-color: rgba(0,255,135,0.3); }
        .price-col.featured {
          background: rgba(0,255,135,0.04);
          border-color: rgba(0,255,135,0.3);
        }
        @keyframes pulse { 0%,100% { opacity: 1; } 50% { opacity: 0.3; } }
      `}</style>

      <StarField />

      {/* Nav */}
      <nav style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "24px 48px", position: "relative", zIndex: 10,
        borderBottom: "1px solid rgba(255,255,255,0.04)"
      }}>
        <a href="https://www.greenstackai.co.uk" style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{
            width: 32, height: 32,
            background: "linear-gradient(135deg, rgba(0,255,135,0.2), rgba(0,200,255,0.1))",
            border: "1px solid rgba(0,255,135,0.4)",
            display: "flex", alignItems: "center", justifyContent: "center",
            color: "#00ff87", fontSize: 16, fontWeight: 700
          }}>G</div>
          <div>
            <div style={{ color: "#fff", fontWeight: 700, fontSize: 14, letterSpacing: 1 }}>GREENSTACK</div>
            <div style={{ color: "rgba(0,255,135,0.5)", fontSize: 8, letterSpacing: 3, fontFamily: "'DM Mono', monospace" }}>AI PLATFORM</div>
          </div>
        </a>
        <a href="mailto:info@greenstackai.co.uk" className="glow-btn" style={{ padding: "10px 24px", fontSize: 11 }}>
          GET IN TOUCH
        </a>
      </nav>

      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "80px 48px", position: "relative", zIndex: 10 }}>

        {/* Hero */}
        <div style={{ marginBottom: 80 }}>
          <div style={{ marginBottom: 20 }}>
            <span className="tag">◆ CBAM COMPLIANCE ADVISORY</span>
          </div>
          <h1 style={{ fontSize: "clamp(40px, 5vw, 72px)", fontWeight: 800, lineHeight: 1.05, letterSpacing: -2, marginBottom: 28 }}>
            Your EU buyers need your<br />
            <span style={{
              background: "linear-gradient(135deg, #00ff87, #00d4ff)",
              WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text"
            }}>carbon data. Now.</span>
          </h1>
          <p className="mono" style={{ color: "rgba(255,255,255,0.45)", fontSize: 16, lineHeight: 1.8, maxWidth: 620, fontWeight: 300, marginBottom: 40 }}>
            From 2026, the EU Carbon Border Adjustment Mechanism (CBAM) requires verified carbon footprints for all goods exported to Europe. Manufacturers without compliant data face tariff penalties and loss of EU contracts.
          </p>
          <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
            <a href="mailto:info@greenstackai.co.uk?subject=CBAM Free Pilot Assessment" className="glow-btn">
              CLAIM FREE PILOT ASSESSMENT →
            </a>
            <a href="mailto:info@greenstackai.co.uk?subject=CBAM Enquiry" className="glow-btn" style={{
              background: "transparent", borderColor: "rgba(255,255,255,0.15)", color: "rgba(255,255,255,0.6)"
            }}>
              SPEAK TO A SPECIALIST
            </a>
          </div>
        </div>

        {/* Timeline */}
        <div className="card" style={{ marginBottom: 80 }}>
          <div className="mono" style={{ color: "rgba(0,255,135,0.6)", fontSize: 10, letterSpacing: 3, marginBottom: 24 }}>CBAM TIMELINE — ACT NOW</div>
          {[
            { date: "2023–2025", label: "Transitional period", detail: "Reporting only — no financial penalties yet", status: "past" },
            { date: "Jan 2026", label: "Full obligations begin", detail: "Importers must purchase CBAM certificates for embedded carbon", status: "now" },
            { date: "2027+", label: "Free allowances phase out", detail: "Costs escalate dramatically — unverified exporters lose EU access", status: "future" },
          ].map((row) => (
            <div key={row.date} className="timeline-row">
              <div className="mono" style={{
                minWidth: 100, fontSize: 12,
                color: row.status === "now" ? "#00ff87" : row.status === "past" ? "rgba(255,255,255,0.3)" : "rgba(255,80,80,0.8)"
              }}>{row.date}</div>
              <div style={{ flex: 1 }}>
                <div style={{
                  fontWeight: 600, fontSize: 14,
                  color: row.status === "now" ? "#fff" : "rgba(255,255,255,0.5)"
                }}>{row.label}
                  {row.status === "now" && <span style={{ marginLeft: 10, display: "inline-block", width: 6, height: 6, borderRadius: "50%", background: "#00ff87", boxShadow: "0 0 8px #00ff87", animation: "pulse 2s infinite", verticalAlign: "middle" }} />}
                </div>
                <div className="mono" style={{ color: "rgba(255,255,255,0.3)", fontSize: 12, marginTop: 4 }}>{row.detail}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Comparison */}
        <div style={{ marginBottom: 80 }}>
          <div style={{ marginBottom: 32 }}>
            <div className="mono" style={{ color: "rgba(255,255,255,0.3)", fontSize: 10, letterSpacing: 3, marginBottom: 12 }}>WHY GREENSTACK AI</div>
            <h2 style={{ fontSize: 36, fontWeight: 700, letterSpacing: -1 }}>14 days. Not 6 months.</h2>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2 }}>
            <div className="card" style={{ borderColor: "rgba(255,255,255,0.05)" }}>
              <div className="mono" style={{ color: "rgba(255,255,255,0.3)", fontSize: 10, letterSpacing: 3, marginBottom: 20 }}>TRADITIONAL CONSULTANCY</div>
              {[
                ["Delivery time", "16–24 weeks"],
                ["Cost", "€200,000–€500,000"],
                ["On-site visits", "4–6 weeks of travel"],
                ["Carbon from consultancy itself", "High — flights, hotels"],
                ["SME accessible", "No"],
              ].map(([k, v]) => (
                <div key={k} style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                  <span className="mono" style={{ color: "rgba(255,255,255,0.4)", fontSize: 12 }}>{k}</span>
                  <span className="mono" style={{ color: "rgba(255,80,80,0.7)", fontSize: 12 }}>{v}</span>
                </div>
              ))}
            </div>
            <div className="card-green">
              <div className="mono" style={{ color: "rgba(0,255,135,0.6)", fontSize: 10, letterSpacing: 3, marginBottom: 20 }}>GREENSTACK AI</div>
              {[
                ["Delivery time", "14 working days"],
                ["Cost", "€35,000–€80,000"],
                ["On-site visits", "None — fully remote"],
                ["Carbon from consultancy itself", "Zero"],
                ["SME accessible", "Yes"],
              ].map(([k, v]) => (
                <div key={k} style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", borderBottom: "1px solid rgba(0,255,135,0.06)" }}>
                  <span className="mono" style={{ color: "rgba(255,255,255,0.4)", fontSize: 12 }}>{k}</span>
                  <span className="mono" style={{ color: "#00ff87", fontSize: 12 }}>{v}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* What you get */}
        <div style={{ marginBottom: 80 }}>
          <div style={{ marginBottom: 32 }}>
            <div className="mono" style={{ color: "rgba(255,255,255,0.3)", fontSize: 10, letterSpacing: 3, marginBottom: 12 }}>DELIVERABLES</div>
            <h2 style={{ fontSize: 36, fontWeight: 700, letterSpacing: -1 }}>Everything your EU buyers need.</h2>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 2 }}>
            {[
              { num: "01", title: "Full Carbon Footprint", desc: "Scope 1, 2 and 3 emissions — facility by facility, product by product. CBAM-compatible format." },
              { num: "02", title: "CBAM Financial Exposure", desc: "Exact tariff liability at current EU ETS carbon price. Know your number before your buyers do." },
              { num: "03", title: "Decarbonisation Roadmap", desc: "Quick wins, medium-term strategy and long-term net zero pathway with ROI modelling." },
              { num: "04", title: "Buyer-Ready Report", desc: "Publication-quality ESG report formatted for EU procurement teams and investor due diligence." },
            ].map((item) => (
              <div key={item.num} className="card">
                <div className="mono" style={{ color: "rgba(0,255,135,0.4)", fontSize: 11, marginBottom: 12 }}>{item.num}</div>
                <div style={{ fontWeight: 600, fontSize: 16, marginBottom: 10 }}>{item.title}</div>
                <div className="mono" style={{ color: "rgba(255,255,255,0.35)", fontSize: 12, lineHeight: 1.7 }}>{item.desc}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Pricing */}
        <div style={{ marginBottom: 80 }}>
          <div style={{ marginBottom: 32 }}>
            <div className="mono" style={{ color: "rgba(255,255,255,0.3)", fontSize: 10, letterSpacing: 3, marginBottom: 12 }}>PRICING</div>
            <h2 style={{ fontSize: 36, fontWeight: 700, letterSpacing: -1 }}>Transparent. Fixed. No surprises.</h2>
          </div>
          <div style={{ display: "flex", gap: 2 }}>
            {[
              { name: "Essential", price: "€35,000", scope: "Single facility · Scope 1+2 · CBAM calculation", featured: false },
              { name: "Standard", price: "€55,000", scope: "Full organisation · Scope 1+2+3 · CBAM + Roadmap", featured: true },
              { name: "Premium", price: "€80,000", scope: "Multi-site · Full inventory · CBAM + ESG report + Investor narrative", featured: false },
            ].map((p) => (
              <div key={p.name} className={p.featured ? "price-col featured" : "price-col"} style={{ position: "relative" }}>
                {p.featured && <div className="mono" style={{ position: "absolute", top: -1, left: 0, right: 0, background: "rgba(0,255,135,0.15)", borderBottom: "1px solid rgba(0,255,135,0.3)", textAlign: "center", padding: "4px 0", fontSize: 9, letterSpacing: 3, color: "#00ff87" }}>MOST POPULAR</div>}
                <div style={{ marginTop: p.featured ? 24 : 0 }}>
                  <div className="mono" style={{ color: "rgba(255,255,255,0.4)", fontSize: 11, letterSpacing: 2, marginBottom: 12 }}>{p.name.toUpperCase()}</div>
                  <div style={{ fontSize: 36, fontWeight: 700, color: p.featured ? "#00ff87" : "#fff", marginBottom: 16 }}>{p.price}</div>
                  <div className="mono" style={{ color: "rgba(255,255,255,0.35)", fontSize: 12, lineHeight: 1.7, marginBottom: 24 }}>{p.scope}</div>
                  <a href={`mailto:info@greenstackai.co.uk?subject=CBAM ${p.name} Package Enquiry`} className="glow-btn" style={{
                    display: "block", textAlign: "center", padding: "12px 16px", fontSize: 11,
                    borderColor: p.featured ? "rgba(0,255,135,0.5)" : "rgba(255,255,255,0.15)",
                    color: p.featured ? "#00ff87" : "rgba(255,255,255,0.5)",
                  }}>
                    ENQUIRE →
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Free pilot CTA */}
        <div className="card-green" style={{ textAlign: "center", padding: "64px 48px", marginBottom: 80 }}>
          <div className="mono" style={{ color: "rgba(0,255,135,0.6)", fontSize: 10, letterSpacing: 4, marginBottom: 16 }}>FREE PILOT OFFER</div>
          <h2 style={{ fontSize: 40, fontWeight: 800, letterSpacing: -1, marginBottom: 20 }}>See the report before you commit.</h2>
          <p className="mono" style={{ color: "rgba(255,255,255,0.4)", fontSize: 14, lineHeight: 1.8, maxWidth: 560, margin: "0 auto 36px" }}>
            One qualifying manufacturer receives a full Scope 1 + Scope 2 carbon footprint and CBAM financial exposure calculation — free of charge. Delivered in 5 working days. No obligation.
          </p>
          <a href="mailto:info@greenstackai.co.uk?subject=CBAM Free Pilot Assessment Request" className="glow-btn" style={{ fontSize: 13 }}>
            APPLY FOR FREE PILOT →
          </a>
          <div className="mono" style={{ color: "rgba(255,255,255,0.2)", fontSize: 11, marginTop: 20 }}>
            Limited to one pilot per month · Manufacturing exporters to EU only
          </div>
        </div>

        {/* Footer */}
        <div style={{ borderTop: "1px solid rgba(255,255,255,0.05)", paddingTop: 40, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 20 }}>
          <div>
            <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 4 }}>GREENSTACK AI</div>
            <div className="mono" style={{ color: "rgba(255,255,255,0.25)", fontSize: 11 }}>SATSSTRATEGY EDUCATION LTD · Company No. 16348591 · England & Wales</div>
          </div>
          <div style={{ display: "flex", gap: 32 }}>
            <a href="mailto:info@greenstackai.co.uk" className="mono" style={{ color: "rgba(0,255,135,0.6)", fontSize: 12, textDecoration: "none" }}>info@greenstackai.co.uk</a>
            <a href="https://www.greenstackai.co.uk" className="mono" style={{ color: "rgba(255,255,255,0.3)", fontSize: 12, textDecoration: "none" }}>greenstackai.co.uk</a>
          </div>
        </div>

      </div>
    </div>
  );
}
