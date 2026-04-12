import Link from 'next/link'

export default function Page() {
  return (
    <div style={{ minHeight: "100svh", background: "linear-gradient(135deg, #020c18 0%, #041220 50%, #020e1a 100%)", display: "flex", alignItems: "center", justifyContent: "center", padding: "24px" }}>
      <div style={{ width: "100%", maxWidth: "420px", textAlign: "center" }}>
        <div style={{ marginBottom: "32px" }}>
          <span style={{ fontFamily: "'Instrument Serif', serif", fontStyle: "italic", fontSize: "1.5rem", color: "rgba(0,255,135,0.9)", letterSpacing: "-0.02em" }}>
            GreenStack AI
          </span>
        </div>
        <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(0,255,135,0.15)", borderRadius: "20px", padding: "48px 36px" }}>
          <div style={{ width: 48, height: 48, borderRadius: "50%", background: "rgba(0,255,135,0.1)", border: "1px solid rgba(0,255,135,0.3)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 24px", fontSize: "1.5rem" }}>
            🌿
          </div>
          <h1 style={{ color: "#fff", fontSize: "1.5rem", fontWeight: 600, marginBottom: "12px", letterSpacing: "-0.02em" }}>
            Check your email
          </h1>
          <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "0.9rem", lineHeight: 1.7, marginBottom: "32px" }}>
            We&apos;ve sent a confirmation link to your email address. Click it to activate your GreenStack AI account.
          </p>
          <Link href="/" style={{ color: "rgba(0,255,135,0.7)", fontSize: "0.85rem", textDecoration: "none" }}>
            ← Back to home
          </Link>
        </div>
      </div>
    </div>
  )
}
