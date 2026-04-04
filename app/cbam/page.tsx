"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { Leaf, ArrowRight, Globe, Instagram, Twitter } from "lucide-react";

const VIDEO_URL = "/hero.mp4";
const VIDEO_URL_2 = "/video2.mp4";
const VIDEO_URL_3 = "/video3.mp4";

const globalStyles = `
  @import url('https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&display=swap');
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { background: #000; font-family: ui-sans-serif, system-ui, sans-serif; color: #fff; }
  .liquid-glass {
    background: rgba(255,255,255,0.01);
    backdrop-filter: blur(4px);
    -webkit-backdrop-filter: blur(4px);
    box-shadow: inset 0 1px 1px rgba(255,255,255,0.1);
    position: relative;
    overflow: hidden;
  }
  .liquid-glass::before {
    content: '';
    position: absolute;
    inset: 0;
    border-radius: inherit;
    padding: 1.4px;
    background: linear-gradient(
      180deg,
      rgba(255,255,255,0.45) 0%,
      rgba(255,255,255,0.15) 20%,
      rgba(255,255,255,0) 40%,
      rgba(255,255,255,0) 60%,
      rgba(255,255,255,0.15) 80%,
      rgba(255,255,255,0.45) 100%
    );
    -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
    -webkit-mask-composite: xor;
    mask-composite: exclude;
    pointer-events: none;
    z-index: 1;
  }
  @keyframes pulse { 0%,100% { opacity: 1; } 50% { opacity: 0.3; } }
`;

const SI = ({ children, dim }: { children: React.ReactNode; dim?: boolean }) => (
  <span
    style={{ fontFamily: "'Instrument Serif', serif", fontStyle: "italic" }}
    className={dim ? "text-white/60" : ""}
  >
    {children}
  </span>
);

function Navbar() {
  return (
    <nav style={{
      position: "absolute", top: 0, left: 0, right: 0,
      zIndex: 20, padding: "20px 24px", display: "flex", justifyContent: "center",
    }}>
      <div className="liquid-glass" style={{
        borderRadius: "9999px", maxWidth: "800px", width: "100%",
        padding: "12px 24px",
        display: "flex", alignItems: "center", justifyContent: "space-between",
      }}>
        <a href="/" style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: "8px" }}>
          <Leaf size={20} color="rgba(134,239,172,0.8)" />
          <span style={{ color: "#fff", fontWeight: 600, fontSize: "1.05rem", letterSpacing: "-0.02em" }}>
            Green<SI>stack</SI>
          </span>
        </a>
        <div style={{ display: "flex", alignItems: "center", gap: "28px" }}>
          {["Tenders", "Platform", "About"].map(l => (
            <a key={l} href="/" style={{ color: "rgba(255,255,255,0.6)", fontSize: "0.85rem", fontWeight: 500, cursor: "pointer", textDecoration: "none" }}>{l}</a>
          ))}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <a href="mailto:info@greenstackai.co.uk" style={{ color: "rgba(255,255,255,0.6)", fontSize: "0.85rem", textDecoration: "none" }}>Contact</a>
          <a href="/dashboard" className="liquid-glass" style={{ borderRadius: "9999px", padding: "8px 20px", cursor: "pointer", textDecoration: "none" }}>
            <span style={{ color: "#fff", fontSize: "0.85rem", fontWeight: 500 }}>Dashboard</span>
          </a>
        </div>
      </div>
    </nav>
  );
}

function Hero() {
  return (
    <section style={{
      minHeight: "100vh", background: "#000", position: "relative",
      display: "flex", flexDirection: "column", overflow: "hidden",
    }}>
      <video
        src={VIDEO_URL}
        muted autoPlay loop playsInline preload="auto"
        style={{
          position: "absolute", inset: 0, width: "100%", height: "100%",
          objectFit: "cover", opacity: 0.4,
          zIndex: 0,
        }}
      />
      <div style={{
        position: "absolute", inset: 0,
        background: "linear-gradient(to bottom, rgba(0,0,0,0.6) 0%, rgba(0,0,0,0.2) 50%, rgba(0,0,0,0.8) 100%)",
        zIndex: 1,
      }} />

      <Navbar />

      <div style={{
        position: "relative", zIndex: 10, flex: 1,
        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
        padding: "100px 24px 24px", textAlign: "center",
      }}>
        <div className="liquid-glass" style={{
          borderRadius: "9999px", padding: "6px 20px", marginBottom: "28px", display: "inline-block",
        }}>
          <span style={{ color: "rgba(134,239,172,0.9)", fontSize: "0.75rem", letterSpacing: "0.15em", textTransform: "uppercase" }}>
            CBAM Compliance Advisory
          </span>
        </div>

        <h1 style={{
          fontFamily: "'Instrument Serif', serif",
          fontSize: "clamp(2.5rem, 7vw, 5rem)",
          color: "#fff", letterSpacing: "-0.02em",
          marginBottom: "24px", lineHeight: 1.05,
        }}>
          Your EU buyers need your<br />
          <SI>carbon data. Now.</SI>
        </h1>

        <p style={{ color: "rgba(255,255,255,0.55)", fontSize: "0.95rem", maxWidth: "520px", lineHeight: 1.8, marginBottom: "36px" }}>
          From 2026, the EU Carbon Border Adjustment Mechanism requires verified carbon footprints for all goods exported to Europe. Act now or face tariff penalties.
        </p>

        <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", justifyContent: "center" }}>
          <a href="mailto:info@greenstackai.co.uk?subject=CBAM Free Pilot Assessment"
            className="liquid-glass"
            style={{ borderRadius: "9999px", padding: "14px 32px", textDecoration: "none", cursor: "pointer" }}>
            <span style={{ color: "rgba(134,239,172,0.9)", fontSize: "0.9rem", fontWeight: 500 }}>Claim Free Pilot →</span>
          </a>
          <a href="mailto:info@greenstackai.co.uk?subject=CBAM Enquiry"
            className="liquid-glass"
            style={{ borderRadius: "9999px", padding: "14px 32px", textDecoration: "none", cursor: "pointer" }}>
            <span style={{ color: "rgba(255,255,255,0.6)", fontSize: "0.9rem", fontWeight: 500 }}>Speak to a specialist</span>
          </a>
        </div>
      </div>

      <div style={{
        position: "relative", zIndex: 10,
        display: "flex", justifyContent: "center", gap: "12px", padding: "24px",
      }}>
        {[Instagram, Twitter, Globe].map((Icon, i) => (
          <div key={i} className="liquid-glass" style={{ borderRadius: "50%", padding: "14px", cursor: "pointer" }}>
            <Icon size={18} color="rgba(255,255,255,0.7)" />
          </div>
        ))}
      </div>
    </section>
  );
}

function TimelineSection() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-100px" });

  const rows = [
    { date: "2023–2025", label: "Transitional period", detail: "Reporting only — no financial penalties yet", active: false, urgent: false },
    { date: "Jan 2026", label: "Full obligations begin", detail: "Importers must purchase CBAM certificates for embedded carbon", active: true, urgent: false },
    { date: "2027+", label: "Free allowances phase out", detail: "Costs escalate dramatically — unverified exporters lose EU access", active: false, urgent: true },
  ];

  return (
    <section style={{ background: "#000", padding: "140px 24px 80px" }}>
      <div ref={ref} style={{ maxWidth: "900px", margin: "0 auto" }}>
        <motion.p
          initial={{ opacity: 0, y: 20 }} animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          style={{ color: "rgba(255,255,255,0.4)", fontSize: "0.8rem", letterSpacing: "0.2em", textTransform: "uppercase", marginBottom: "24px" }}
        >
          Timeline
        </motion.p>
        <motion.h2
          initial={{ opacity: 0, y: 40 }} animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8, delay: 0.1 }}
          style={{ fontSize: "clamp(2rem, 5vw, 4rem)", letterSpacing: "-0.03em", marginBottom: "56px", lineHeight: 1.1 }}
        >
          The clock is <SI dim>already running.</SI>
        </motion.h2>

        {rows.map((row, i) => (
          <motion.div
            key={row.date}
            initial={{ opacity: 0, x: -30 }} animate={inView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.7, delay: 0.2 + i * 0.15 }}
            className="liquid-glass"
            style={{
              borderRadius: "16px", padding: "24px 32px", marginBottom: "12px",
              display: "flex", gap: "32px", alignItems: "center",
              borderLeft: row.active ? "2px solid rgba(134,239,172,0.6)" : "none",
            }}
          >
            <div style={{
              minWidth: 110, fontFamily: "monospace", fontSize: "0.9rem",
              color: row.active ? "rgba(134,239,172,0.9)" : row.urgent ? "rgba(255,100,100,0.7)" : "rgba(255,255,255,0.3)",
            }}>
              {row.date}
              {row.active && <span style={{ display: "inline-block", width: 6, height: 6, borderRadius: "50%", background: "rgba(134,239,172,0.9)", boxShadow: "0 0 8px rgba(134,239,172,0.6)", marginLeft: 8, animation: "pulse 2s infinite", verticalAlign: "middle" }} />}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 600, fontSize: "1rem", color: row.active ? "#fff" : "rgba(255,255,255,0.5)", marginBottom: 4 }}>{row.label}</div>
              <div style={{ color: "rgba(255,255,255,0.35)", fontSize: "0.85rem", lineHeight: 1.6 }}>{row.detail}</div>
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}

function ComparisonSection() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-100px" });

  const rows = [
    ["Delivery time", "16–24 weeks", "14 working days"],
    ["Cost", "€200,000–€500,000", "€35,000–€80,000"],
    ["On-site visits", "4–6 weeks of travel", "None — fully remote"],
    ["SME accessible", "No", "Yes"],
    ["Carbon from consultancy", "High — flights, hotels", "Zero"],
  ];

  return (
    <section style={{ background: "#000", padding: "80px 24px 140px" }}>
      <div ref={ref} style={{ maxWidth: "960px", margin: "0 auto" }}>
        <motion.div
          initial={{ opacity: 0, y: 30 }} animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7 }}
          style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: "56px" }}
        >
          <h2 style={{ fontSize: "clamp(1.8rem, 4vw, 3rem)", letterSpacing: "-0.03em" }}>
            14 days. <SI dim>Not 6 months.</SI>
          </h2>
          <span style={{ color: "rgba(255,255,255,0.4)", fontSize: "0.85rem" }}>Why us</span>
        </motion.div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "2px" }}>
          {/* Traditional */}
          <motion.div
            initial={{ opacity: 0, x: -40 }} animate={inView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="liquid-glass"
            style={{ borderRadius: "24px 0 0 24px", padding: "36px" }}
          >
            <p style={{ color: "rgba(255,255,255,0.3)", fontSize: "0.75rem", letterSpacing: "0.2em", textTransform: "uppercase", marginBottom: "28px" }}>Traditional consultancy</p>
            {rows.map(([label, bad]) => (
              <div key={label} style={{ padding: "14px 0", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                <div style={{ color: "rgba(255,255,255,0.3)", fontSize: "0.7rem", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 6 }}>{label}</div>
                <div style={{ color: "rgba(255,100,100,0.7)", fontSize: "0.95rem" }}>{bad}</div>
              </div>
            ))}
          </motion.div>

          {/* GreenStack */}
          <motion.div
            initial={{ opacity: 0, x: 40 }} animate={inView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="liquid-glass"
            style={{ borderRadius: "0 24px 24px 0", padding: "36px", borderLeft: "1px solid rgba(134,239,172,0.2)" }}
          >
            <p style={{ color: "rgba(134,239,172,0.6)", fontSize: "0.75rem", letterSpacing: "0.2em", textTransform: "uppercase", marginBottom: "28px" }}>GreenStack AI</p>
            {rows.map(([label, , good]) => (
              <div key={label} style={{ padding: "14px 0", borderBottom: "1px solid rgba(134,239,172,0.05)" }}>
                <div style={{ color: "rgba(255,255,255,0.3)", fontSize: "0.7rem", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 6 }}>{label}</div>
                <div style={{ color: "rgba(134,239,172,0.9)", fontSize: "0.95rem" }}>{good}</div>
              </div>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  );
}

function DeliverablesSection() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-100px" });

  const items = [
    { num: "01", title: "Full Carbon Footprint", desc: "Scope 1, 2 and 3 emissions — facility by facility, product by product. CBAM-compatible format." },
    { num: "02", title: "CBAM Financial Exposure", desc: "Exact tariff liability at current EU ETS carbon price. Know your number before your buyers do." },
    { num: "03", title: "Decarbonisation Roadmap", desc: "Quick wins, medium-term strategy and long-term net zero pathway with full ROI modelling." },
    { num: "04", title: "Buyer-Ready Report", desc: "Publication-quality ESG report formatted for EU procurement teams and investor due diligence." },
  ];

  return (
    <section style={{
      background: "#000", padding: "140px 24px",
      backgroundImage: "radial-gradient(ellipse at center, rgba(255,255,255,0.02) 0%, transparent 60%)",
    }}>
      <div ref={ref} style={{ maxWidth: "960px", margin: "0 auto" }}>
        <motion.div
          initial={{ opacity: 0, y: 30 }} animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7 }}
          style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: "64px" }}
        >
          <h2 style={{ fontSize: "clamp(1.8rem, 4vw, 3rem)", letterSpacing: "-0.03em" }}>
            Everything your <SI dim>buyers need.</SI>
          </h2>
          <span style={{ color: "rgba(255,255,255,0.4)", fontSize: "0.85rem" }}>Deliverables</span>
        </motion.div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px" }}>
          {items.map((item, i) => (
            <motion.div
              key={item.num}
              initial={{ opacity: 0, y: 50 }} animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.8, delay: i * 0.15 }}
              className="liquid-glass"
              style={{ borderRadius: "24px", overflow: "hidden" }}
            >
              <div style={{ position: "relative", aspectRatio: "16/9", overflow: "hidden" }}>
                <video src={i < 2 ? VIDEO_URL_2 : VIDEO_URL_3} muted autoPlay loop playsInline preload="auto"
                  style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(0,0,0,0.5) 0%, transparent 60%)" }} />
              </div>
              <div style={{ padding: "28px 32px" }}>
                <div style={{ color: "rgba(134,239,172,0.4)", fontSize: "0.75rem", fontFamily: "monospace", marginBottom: "12px" }}>{item.num}</div>
                <h3 style={{ fontSize: "1.3rem", letterSpacing: "-0.02em", marginBottom: "10px" }}>{item.title}</h3>
                <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "0.875rem", lineHeight: 1.7 }}>{item.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

function PricingSection() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-100px" });

  const tiers = [
    { name: "Essential", price: "€35,000", scope: "Single facility · Scope 1+2 · CBAM calculation", featured: false },
    { name: "Standard", price: "€55,000", scope: "Full organisation · Scope 1+2+3 · CBAM + Roadmap", featured: true },
    { name: "Premium", price: "€80,000", scope: "Multi-site · Full inventory · CBAM + ESG report + Investor narrative", featured: false },
  ];

  return (
    <section style={{ background: "#000", padding: "80px 24px 140px" }}>
      <div ref={ref} style={{ maxWidth: "960px", margin: "0 auto" }}>
        <motion.div
          initial={{ opacity: 0, y: 30 }} animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7 }}
          style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: "64px" }}
        >
          <h2 style={{ fontSize: "clamp(1.8rem, 4vw, 3rem)", letterSpacing: "-0.03em" }}>
            Transparent. <SI dim>Fixed. No surprises.</SI>
          </h2>
          <span style={{ color: "rgba(255,255,255,0.4)", fontSize: "0.85rem" }}>Pricing</span>
        </motion.div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "2px" }}>
          {tiers.map((tier, i) => (
            <motion.div
              key={tier.name}
              initial={{ opacity: 0, y: 40 }} animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.8, delay: i * 0.1 }}
              className="liquid-glass"
              style={{
                borderRadius: i === 0 ? "24px 0 0 24px" : i === 2 ? "0 24px 24px 0" : "0",
                padding: "36px 28px",
                borderTop: tier.featured ? "1px solid rgba(134,239,172,0.3)" : "none",
                position: "relative",
              }}
            >
              {tier.featured && (
                <div style={{
                  position: "absolute", top: 0, left: 0, right: 0,
                  background: "rgba(134,239,172,0.08)", padding: "6px 0",
                  textAlign: "center", fontSize: "0.7rem", letterSpacing: "0.2em",
                  color: "rgba(134,239,172,0.7)", textTransform: "uppercase",
                  borderRadius: "0 0 0 0",
                }}>Most Popular</div>
              )}
              <div style={{ marginTop: tier.featured ? "24px" : 0 }}>
                <p style={{ color: "rgba(255,255,255,0.4)", fontSize: "0.75rem", letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: "16px" }}>{tier.name}</p>
                <div style={{
                  fontFamily: "'Instrument Serif', serif",
                  fontSize: "2.8rem", color: tier.featured ? "rgba(134,239,172,0.9)" : "#fff",
                  letterSpacing: "-0.02em", marginBottom: "16px",
                }}>{tier.price}</div>
                <p style={{ color: "rgba(255,255,255,0.35)", fontSize: "0.85rem", lineHeight: 1.7, marginBottom: "32px" }}>{tier.scope}</p>
                <a
                  href={`mailto:info@greenstackai.co.uk?subject=CBAM ${tier.name} Package Enquiry`}
                  className="liquid-glass"
                  style={{
                    display: "block", textAlign: "center", borderRadius: "9999px",
                    padding: "12px 20px", textDecoration: "none",
                  }}
                >
                  <span style={{ color: tier.featured ? "rgba(134,239,172,0.9)" : "rgba(255,255,255,0.6)", fontSize: "0.85rem" }}>Enquire →</span>
                </a>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

function PilotSection() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section style={{ background: "#000", padding: "0 24px 140px" }}>
      <div ref={ref} style={{ maxWidth: "960px", margin: "0 auto" }}>
        <motion.div
          initial={{ opacity: 0, y: 60 }} animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.9 }}
          style={{ borderRadius: "24px", overflow: "hidden", position: "relative", minHeight: 400 }}
        >
          <video src={VIDEO_URL} muted autoPlay loop playsInline preload="auto"
            style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} />
          <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.7)" }} />

          <div style={{ position: "relative", zIndex: 10, padding: "80px 64px", textAlign: "center" }}>
            <div className="liquid-glass" style={{
              borderRadius: "9999px", padding: "6px 20px", marginBottom: "28px", display: "inline-block",
            }}>
              <span style={{ color: "rgba(134,239,172,0.9)", fontSize: "0.75rem", letterSpacing: "0.15em", textTransform: "uppercase" }}>
                Free Pilot Offer
              </span>
            </div>

            <h2 style={{
              fontFamily: "'Instrument Serif', serif",
              fontSize: "clamp(2rem, 5vw, 4rem)", letterSpacing: "-0.03em", marginBottom: "20px", lineHeight: 1.1,
            }}>
              See the report<br /><SI dim>before you commit.</SI>
            </h2>

            <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "0.95rem", maxWidth: "520px", margin: "0 auto 36px", lineHeight: 1.8 }}>
              One qualifying manufacturer receives a full Scope 1 + Scope 2 carbon footprint and CBAM financial exposure calculation — free. Delivered in 5 working days. No obligation.
            </p>

            <a
              href="mailto:info@greenstackai.co.uk?subject=CBAM Free Pilot Assessment Request"
              className="liquid-glass"
              style={{ borderRadius: "9999px", padding: "16px 40px", textDecoration: "none", display: "inline-block" }}
            >
              <span style={{ color: "rgba(134,239,172,0.9)", fontSize: "0.9rem", fontWeight: 500 }}>Apply for Free Pilot →</span>
            </a>

            <p style={{ color: "rgba(255,255,255,0.2)", fontSize: "0.8rem", marginTop: "20px", fontFamily: "monospace" }}>
              Limited to one pilot per month · Manufacturing exporters to EU only
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

function Footer() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section style={{ background: "#000", padding: "0 24px 80px" }}>
      <div ref={ref} style={{ maxWidth: "960px", margin: "0 auto" }}>
        <motion.div
          initial={{ opacity: 0, y: 30 }} animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7 }}
        >
          <div style={{
            padding: "64px 0",
            borderTop: "1px solid rgba(255,255,255,0.08)",
            borderBottom: "1px solid rgba(255,255,255,0.08)",
            marginBottom: "40px",
          }}>
            <p style={{ color: "rgba(255,255,255,0.4)", fontSize: "0.8rem", letterSpacing: "0.2em", textTransform: "uppercase", marginBottom: "24px" }}>
              Get in touch
            </p>
            <h2 style={{ fontSize: "clamp(1.8rem, 4vw, 3.5rem)", letterSpacing: "-0.03em", marginBottom: "40px", lineHeight: 1.1 }}>
              Ready to win <SI dim>smarter?</SI>
            </h2>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "40px" }}>
              <div>
                <p style={{ color: "rgba(255,255,255,0.3)", fontSize: "0.7rem", letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: "8px" }}>Email</p>
                <a href="mailto:info@greenstackai.co.uk" style={{ color: "#fff", fontSize: "1rem", textDecoration: "none" }}>info@greenstackai.co.uk</a>
              </div>
              <div>
                <p style={{ color: "rgba(255,255,255,0.3)", fontSize: "0.7rem", letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: "8px" }}>Website</p>
                <a href="/" style={{ color: "#fff", fontSize: "1rem", textDecoration: "none" }}>greenstackai.co.uk</a>
              </div>
              <div>
                <p style={{ color: "rgba(255,255,255,0.3)", fontSize: "0.7rem", letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: "8px" }}>Registered</p>
                <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "0.9rem" }}>SATSSTRATEGY EDUCATION LTD<br />No. 16348591 · Liverpool, England</p>
              </div>
            </div>
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <Leaf size={16} color="rgba(134,239,172,0.6)" />
              <span style={{ color: "rgba(255,255,255,0.3)", fontSize: "0.8rem" }}>GreenStack © 2026</span>
            </div>
            <span style={{ color: "rgba(255,255,255,0.2)", fontSize: "0.75rem" }}>SATSSTRATEGY EDUCATION LTD</span>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

export default function CBAMPage() {
  return (
    <>
      <style>{globalStyles}</style>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.6 }}>
        <Hero />
        <TimelineSection />
        <ComparisonSection />
        <DeliverablesSection />
        <PricingSection />
        <PilotSection />
        <Footer />
      </motion.div>
    </>
  );
}
