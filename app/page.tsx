"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion, useInView, AnimatePresence } from "framer-motion";
import {
  Globe,
  ArrowRight,
  Instagram,
  Twitter,
  ArrowUpRight,
  Leaf,
  Lock,
  Eye,
  EyeOff,
} from "lucide-react";

const PASSWORD = "greenstack2026";

const VIDEO_URL =
  "https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKVSdrz9iAoZ8kZqGM/generated_video_1748954259.mp4";

const globalStyles = `
  @import url('https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&display=swap');

  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { background: #000; font-family: ui-sans-serif, system-ui, sans-serif; color: #fff; }

  .liquid-glass {
    background: rgba(255,255,255,0.01);
    background-blend-mode: luminosity;
    backdrop-filter: blur(4px);
    -webkit-backdrop-filter: blur(4px);
    border: none;
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
`;

const SI = ({ children, dim }: { children: React.ReactNode; dim?: boolean }) => (
  <span
    style={{ fontFamily: "'Instrument Serif', serif", fontStyle: "italic" }}
    className={dim ? "text-white/60" : ""}
  >
    {children}
  </span>
);

function useHeroVideo() {
  const ref = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const v = ref.current;
    if (!v) return;

    const fadeIn = () => {
      let start: number | null = null;
      const animate = (ts: number) => {
        if (!start) start = ts;
        const p = Math.min((ts - start) / 500, 1);
        v.style.opacity = String(p);
        if (p < 1) requestAnimationFrame(animate);
      };
      requestAnimationFrame(animate);
    };

    const fadeOut = (cb?: () => void) => {
      let start: number | null = null;
      const animate = (ts: number) => {
        if (!start) start = ts;
        const p = Math.min((ts - start) / 500, 1);
        v.style.opacity = String(1 - p);
        if (p < 1) requestAnimationFrame(animate);
        else cb && cb();
      };
      requestAnimationFrame(animate);
    };

    const onCanPlay = () => { v.style.opacity = "0"; v.play(); fadeIn(); };
    const onTimeUpdate = () => {
      if (!v.duration) return;
      if (v.currentTime >= v.duration - 0.55 && parseFloat(v.style.opacity) > 0) {
        fadeOut(() => {
          v.currentTime = 0;
          v.play();
          fadeIn();
        });
      }
    };

    v.addEventListener("canplay", onCanPlay);
    v.addEventListener("timeupdate", onTimeUpdate);
    return () => {
      v.removeEventListener("canplay", onCanPlay);
      v.removeEventListener("timeupdate", onTimeUpdate);
    };
  }, []);

  return ref;
}

function PasswordGate({ onUnlock }: { onUnlock: () => void }) {
  const [pw, setPw] = useState("");
  const [show, setShow] = useState(false);
  const [err, setErr] = useState(false);
  const [shake, setShake] = useState(false);

  const attempt = () => {
    if (pw === PASSWORD) {
      onUnlock();
    } else {
      setErr(true);
      setShake(true);
      setTimeout(() => setShake(false), 600);
      setTimeout(() => setErr(false), 2000);
      setPw("");
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 0.97 }}
      transition={{ duration: 0.4 }}
      style={{
        position: "fixed", inset: 0, background: "#000",
        display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center",
        zIndex: 9999, padding: "24px",
      }}
    >
      <div style={{
        position: "absolute", inset: 0, pointerEvents: "none",
        background: "radial-gradient(ellipse at 50% 40%, rgba(34,197,94,0.06) 0%, transparent 65%)",
      }} />

      <motion.div
        animate={shake ? { x: [-8, 8, -6, 6, -3, 3, 0] } : { x: 0 }}
        transition={{ duration: 0.5 }}
        style={{ width: "100%", maxWidth: "360px", position: "relative", zIndex: 1 }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "48px", justifyContent: "center" }}>
          <div style={{
            width: 36, height: 36, borderRadius: "50%",
            background: "rgba(34,197,94,0.12)",
            display: "flex", alignItems: "center", justifyContent: "center",
            border: "1px solid rgba(34,197,94,0.25)",
          }}>
            <Leaf size={18} color="rgba(134,239,172,0.9)" />
          </div>
          <span style={{ fontSize: "1.25rem", fontWeight: 600, color: "#fff", letterSpacing: "-0.02em" }}>
            Green<SI>stack</SI>
          </span>
        </div>

        <div style={{ textAlign: "center", marginBottom: "32px" }}>
          <div style={{
            display: "inline-flex", alignItems: "center", justifyContent: "center",
            width: 48, height: 48, borderRadius: "50%",
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.08)",
            marginBottom: "20px",
          }}>
            <Lock size={20} color="rgba(255,255,255,0.5)" />
          </div>
          <h1 style={{
            fontSize: "1.6rem", fontWeight: 600, color: "#fff",
            letterSpacing: "-0.03em", lineHeight: 1.2, marginBottom: "8px",
          }}>
            Enter <SI dim>password</SI>
          </h1>
          <p style={{ color: "rgba(255,255,255,0.35)", fontSize: "0.875rem", lineHeight: 1.6 }}>
            This platform is in private beta.
          </p>
        </div>

        <div className="liquid-glass" style={{ borderRadius: "9999px", marginBottom: "12px" }}>
          <div style={{ display: "flex", alignItems: "center", paddingLeft: "24px", paddingRight: "8px", paddingTop: "8px", paddingBottom: "8px" }}>
            <input
              type={show ? "text" : "password"}
              value={pw}
              onChange={e => setPw(e.target.value)}
              onKeyDown={e => e.key === "Enter" && attempt()}
              placeholder="Password"
              autoFocus
              style={{
                flex: 1, background: "transparent", border: "none", outline: "none",
                color: err ? "rgba(248,113,113,0.9)" : "#fff",
                fontSize: "0.9rem", letterSpacing: "0.05em",
              }}
            />
            <button
              onClick={() => setShow(s => !s)}
              style={{
                background: "none", border: "none", cursor: "pointer",
                padding: "8px", color: "rgba(255,255,255,0.4)",
                display: "flex", alignItems: "center",
              }}
            >
              {show ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
            <button
              onClick={attempt}
              style={{
                width: 36, height: 36, borderRadius: "50%",
                background: "#fff", border: "none", cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <ArrowRight size={16} color="#000" />
            </button>
          </div>
        </div>

        <AnimatePresence>
          {err && (
            <motion.p
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              style={{ textAlign: "center", color: "rgba(248,113,113,0.8)", fontSize: "0.8rem", marginTop: "8px" }}
            >
              Incorrect password. Try again.
            </motion.p>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
}

function Navbar({ onDashboard }: { onDashboard: () => void }) {
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
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <Leaf size={20} color="rgba(134,239,172,0.8)" />
          <span style={{ color: "#fff", fontWeight: 600, fontSize: "1.05rem", letterSpacing: "-0.02em" }}>
            Green<SI>stack</SI>
          </span>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "28px" }}>
          {["Tenders", "Platform", "About"].map(l => (
            <span key={l} style={{ color: "rgba(255,255,255,0.6)", fontSize: "0.85rem", fontWeight: 500, cursor: "pointer" }}>{l}</span>
          ))}
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <a href="mailto:info@greenstackai.co.uk" style={{ color: "rgba(255,255,255,0.6)", fontSize: "0.85rem", cursor: "pointer", textDecoration: "none" }}>Contact</a>
          <div className="liquid-glass" style={{ borderRadius: "9999px", padding: "8px 20px", cursor: "pointer" }} onClick={onDashboard}>
            <span style={{ color: "#fff", fontSize: "0.85rem", fontWeight: 500 }}>Dashboard</span>
          </div>
        </div>
      </div>
    </nav>
  );
}

function Hero({ onDashboard }: { onDashboard: () => void }) {
  const videoRef = useHeroVideo();
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleEmailSubmit = () => {
    if (!email || !email.includes("@")) return;
    setSubmitted(true);
    setEmail("");
  };

  return (
    <section style={{
      minHeight: "100vh", background: "#000", position: "relative",
      display: "flex", flexDirection: "column", overflow: "hidden",
    }}>
      <video
        ref={videoRef}
        src={VIDEO_URL}
        muted autoPlay playsInline preload="auto"
        style={{
          position: "absolute", inset: 0, width: "100%", height: "100%",
          objectFit: "cover", opacity: 0,
          transform: "translateY(calc(17% + 100px))",
          zIndex: 0,
        }}
      />
      <div style={{
        position: "absolute", inset: 0,
        background: "linear-gradient(to bottom, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.1) 50%, rgba(0,0,0,0.7) 100%)",
        zIndex: 1,
      }} />

      <Navbar onDashboard={onDashboard} />

      <div style={{
        position: "relative", zIndex: 10, flex: 1,
        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
        transform: "translateY(-10%)", padding: "0 24px", textAlign: "center",
      }}>
        <h1 style={{
          fontFamily: "'Instrument Serif', serif",
          fontSize: "clamp(2.5rem, 7vw, 5rem)",
          color: "#fff", letterSpacing: "-0.02em",
          whiteSpace: "nowrap", marginBottom: "32px", lineHeight: 1.05,
        }}>
          Intelligence for a<br />
          <SI>greener</SI> tomorrow
        </h1>

        <div className="liquid-glass" style={{
          borderRadius: "9999px", padding: "8px 8px 8px 24px",
          display: "flex", alignItems: "center", gap: "8px",
          width: "100%", maxWidth: "420px", marginBottom: "20px",
        }}>
          {submitted ? (
            <span style={{ flex: 1, color: "rgba(134,239,172,0.9)", fontSize: "0.9rem", padding: "8px 0" }}>
              Thanks — we&apos;ll be in touch.
            </span>
          ) : (
            <>
              <input
                value={email}
                onChange={e => setEmail(e.target.value)}
                onKeyDown={e => e.key === "Enter" && handleEmailSubmit()}
                placeholder="Enter your email"
                style={{
                  flex: 1, background: "transparent", border: "none", outline: "none",
                  color: "#fff", fontSize: "0.9rem",
                }}
              />
              <button onClick={handleEmailSubmit} style={{
                width: 38, height: 38, borderRadius: "50%",
                background: "#fff", border: "none", cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <ArrowRight size={18} color="#000" />
              </button>
            </>
          )}
        </div>

        <p style={{ color: "rgba(255,255,255,0.55)", fontSize: "0.85rem", maxWidth: "360px", lineHeight: 1.7 }}>
          Automated sustainability tender intelligence. Find, bid, and win — without the overhead.
        </p>

        <div className="liquid-glass" style={{
          borderRadius: "9999px", padding: "12px 32px",
          cursor: "pointer", marginTop: "24px",
        }} onClick={onDashboard}>
          <span style={{ color: "#fff", fontSize: "0.85rem", fontWeight: 500 }}>Enter Platform →</span>
        </div>
      </div>

      <div style={{
        position: "relative", zIndex: 10,
        display: "flex", justifyContent: "center", gap: "12px", padding: "24px",
      }}>
        <a href="https://instagram.com" target="_blank" rel="noopener noreferrer">
          <div className="liquid-glass" style={{ borderRadius: "50%", padding: "14px", cursor: "pointer" }}>
            <Instagram size={18} color="rgba(255,255,255,0.7)" />
          </div>
        </a>
        <a href="https://twitter.com" target="_blank" rel="noopener noreferrer">
          <div className="liquid-glass" style={{ borderRadius: "50%", padding: "14px", cursor: "pointer" }}>
            <Twitter size={18} color="rgba(255,255,255,0.7)" />
          </div>
        </a>
        <a href="https://www.greenstackai.co.uk" target="_blank" rel="noopener noreferrer">
          <div className="liquid-glass" style={{ borderRadius: "50%", padding: "14px", cursor: "pointer" }}>
            <Globe size={18} color="rgba(255,255,255,0.7)" />
          </div>
        </a>
      </div>
    </section>
  );
}

function AboutSection() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section ref={ref} style={{
      background: "#000", padding: "160px 24px 56px",
      backgroundImage: "radial-gradient(ellipse at top, rgba(255,255,255,0.03) 0%, transparent 70%)",
    }}>
      <div style={{ maxWidth: "900px", margin: "0 auto" }}>
        <motion.p
          initial={{ opacity: 0, y: 20 }} animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          style={{ color: "rgba(255,255,255,0.4)", fontSize: "0.8rem", letterSpacing: "0.2em", textTransform: "uppercase", marginBottom: "24px" }}
        >
          About Us
        </motion.p>

        <motion.h2
          initial={{ opacity: 0, y: 40 }} animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8, delay: 0.1 }}
          style={{
            fontSize: "clamp(2rem, 6vw, 4.5rem)", color: "#fff",
            lineHeight: 1.1, letterSpacing: "-0.03em",
          }}
        >
          Pioneering <SI dim>intelligence</SI> for
          <br />minds that <SI dim>build,</SI> <SI dim>bid,</SI> and <SI dim>win.</SI>
        </motion.h2>
      </div>
    </section>
  );
}

function FeaturedVideoSection() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section style={{ background: "#000", padding: "24px 24px 96px" }}>
      <div ref={ref} style={{ maxWidth: "960px", margin: "0 auto" }}>
        <motion.div
          initial={{ opacity: 0, y: 60 }} animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.9 }}
          style={{ borderRadius: "24px", overflow: "hidden", aspectRatio: "16/9", position: "relative" }}
        >
          <video
            src={VIDEO_URL}
            muted autoPlay loop playsInline preload="auto"
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
          />
          <div style={{
            position: "absolute", inset: 0,
            background: "linear-gradient(to top, rgba(0,0,0,0.6) 0%, transparent 50%, transparent 100%)",
          }} />

          <div style={{
            position: "absolute", bottom: 0, left: 0, right: 0,
            padding: "40px", display: "flex", justifyContent: "space-between", alignItems: "flex-end",
          }}>
            <div className="liquid-glass" style={{ borderRadius: "16px", padding: "24px 28px", maxWidth: "380px" }}>
              <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "0.7rem", letterSpacing: "0.2em", textTransform: "uppercase", marginBottom: "10px" }}>
                Our Approach
              </p>
              <p style={{ color: "#fff", fontSize: "0.9rem", lineHeight: 1.7 }}>
                We believe in the power of curiosity-driven exploration. Every tender starts with an insight, and every win opens a new door to sustainable growth.
              </p>
            </div>

            <motion.div
              whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
              className="liquid-glass"
              style={{ borderRadius: "9999px", padding: "12px 28px", cursor: "pointer", flexShrink: 0 }}
            >
              <span style={{ color: "#fff", fontSize: "0.85rem", fontWeight: 500 }}>Explore more</span>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

function PhilosophySection() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section style={{ background: "#000", padding: "140px 24px" }}>
      <div ref={ref} style={{ maxWidth: "960px", margin: "0 auto" }}>
        <motion.h2
          initial={{ opacity: 0, y: 40 }} animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8 }}
          style={{
            fontSize: "clamp(2.5rem, 7vw, 6rem)", color: "#fff",
            letterSpacing: "-0.04em", marginBottom: "80px",
          }}
        >
          Automation <SI dim>×</SI> Sustainability
        </motion.h2>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "40px" }}>
          <motion.div
            initial={{ opacity: 0, x: -40 }} animate={inView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.8, delay: 0.2 }}
            style={{ borderRadius: "24px", overflow: "hidden", aspectRatio: "4/3" }}
          >
            <video src={VIDEO_URL} muted autoPlay loop playsInline preload="auto"
              style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 40 }} animate={inView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.8, delay: 0.3 }}
            style={{ display: "flex", flexDirection: "column", justifyContent: "center", gap: "32px" }}
          >
            <div>
              <p style={{ color: "rgba(255,255,255,0.4)", fontSize: "0.7rem", letterSpacing: "0.2em", textTransform: "uppercase", marginBottom: "14px" }}>
                Find the opportunity
              </p>
              <p style={{ color: "rgba(255,255,255,0.7)", fontSize: "1rem", lineHeight: 1.75 }}>
                Every meaningful sustainability contract begins at the intersection of real-time intelligence and bold bidding strategy. GreenStack operates at that crossroads — surfacing tenders before your competitors even know they exist.
              </p>
            </div>
            <div style={{ width: "100%", height: "1px", background: "rgba(255,255,255,0.1)" }} />
            <div>
              <p style={{ color: "rgba(255,255,255,0.4)", fontSize: "0.7rem", letterSpacing: "0.2em", textTransform: "uppercase", marginBottom: "14px" }}>
                Win at scale
              </p>
              <p style={{ color: "rgba(255,255,255,0.7)", fontSize: "1rem", lineHeight: 1.75 }}>
                We believe the best bids emerge when precision meets conviction. Our AI pipeline is designed to uncover the right contracts and auto-generate submissions that resonate with procurement decision-makers.
              </p>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

const SERVICES = [
  {
    tag: "INTELLIGENCE",
    title: "Tender Discovery",
    desc: "We scan Contracts Finder and public procurement portals in real time, surfacing sustainability opportunities the moment they go live.",
  },
  {
    tag: "AUTOMATION",
    title: "Auto-Bid Engine",
    desc: "From carbon audits to net zero strategy contracts, our pipeline drafts, refines, and submits compliant bids — fully autonomous.",
  },
];

function ServiceCard({ tag, title, desc, delay, inView }: {
  tag: string; title: string; desc: string; delay: number; inView: boolean;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 50 }} animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.8, delay }}
      className="liquid-glass"
      style={{ borderRadius: "24px", overflow: "hidden", cursor: "pointer" }}
    >
      <div style={{ position: "relative", aspectRatio: "16/9", overflow: "hidden" }}>
        <video src={VIDEO_URL} muted autoPlay loop playsInline preload="auto"
          style={{ width: "100%", height: "100%", objectFit: "cover", transition: "transform 700ms ease" }} />
        <div style={{
          position: "absolute", inset: 0,
          background: "linear-gradient(to top, rgba(0,0,0,0.4) 0%, transparent 60%)",
        }} />
      </div>

      <div style={{ padding: "28px 32px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "14px" }}>
          <span style={{ color: "rgba(255,255,255,0.4)", fontSize: "0.7rem", letterSpacing: "0.2em", textTransform: "uppercase" }}>
            {tag}
          </span>
          <div className="liquid-glass" style={{ borderRadius: "50%", padding: "8px" }}>
            <ArrowUpRight size={14} color="rgba(255,255,255,0.6)" />
          </div>
        </div>
        <h3 style={{ color: "#fff", fontSize: "1.3rem", letterSpacing: "-0.02em", marginBottom: "10px" }}>{title}</h3>
        <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "0.875rem", lineHeight: 1.7 }}>{desc}</p>
      </div>
    </motion.div>
  );
}

function ServicesSection() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-100px" });

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
          <h2 style={{ fontSize: "clamp(1.8rem, 4vw, 3rem)", color: "#fff", letterSpacing: "-0.03em" }}>
            What we <SI dim>do</SI>
          </h2>
          <span style={{ color: "rgba(255,255,255,0.4)", fontSize: "0.85rem" }}>Our services</span>
        </motion.div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px" }}>
          {SERVICES.map((s, i) => (
            <ServiceCard key={i} {...s} delay={i * 0.15} inView={inView} />
          ))}
        </div>

        <div style={{
          marginTop: "80px", paddingTop: "40px",
          borderTop: "1px solid rgba(255,255,255,0.08)",
          display: "flex", justifyContent: "space-between", alignItems: "center",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <Leaf size={16} color="rgba(134,239,172,0.6)" />
            <span style={{ color: "rgba(255,255,255,0.3)", fontSize: "0.8rem", letterSpacing: "-0.01em" }}>
              GreenStack © 2026
            </span>
          </div>
          <span style={{ color: "rgba(255,255,255,0.2)", fontSize: "0.75rem" }}>
            SATSSTRATEGY EDUCATION LTD
          </span>
        </div>
      </div>
    </section>
  );
}

export default function App() {
  const router = useRouter();
  const [unlocked, setUnlocked] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const stored = sessionStorage.getItem("gs_auth");
    if (stored === "true") {
      router.push("/dashboard");
    } else {
      setChecking(false);
    }
  }, [router]);

  const handleUnlock = () => {
    sessionStorage.setItem("gs_auth", "true");
    router.push("/dashboard");
  };

  const handleDashboard = () => {
    if (sessionStorage.getItem("gs_auth") === "true") {
      router.push("/dashboard");
    } else {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  if (checking) return null;

  return (
    <>
      <style>{globalStyles}</style>

      <AnimatePresence mode="wait">
        {!unlocked ? (
          <PasswordGate key="gate" onUnlock={handleUnlock} />
        ) : (
          <motion.div
            key="site"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6 }}
          >
            <Hero onDashboard={handleDashboard} />
            <AboutSection />
            <FeaturedVideoSection />
            <PhilosophySection />
            <ServicesSection />
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
