"use client";
import { useState } from "react";
import { signIn } from "next-auth/react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    const res = await signIn("credentials", {
      email,
      password,
      redirect: false,
      callbackUrl: "/"
    });
    if (res?.ok) {
      window.location.href = "/"
    } else {
      setError("Email veya şifre hatalı")
      setLoading(false)
    }
  };

  return (
    <div style={{ minHeight: "100vh", background: "#0a0f14", display: "flex", justifyContent: "center", alignItems: "center", fontFamily: "Manrope" }}>
      <form onSubmit={handleSubmit} style={{ background: "#1a232b", padding: 32, borderRadius: 12, boxShadow: "0 4px 24px #0003", minWidth: 320 }}>
        <h2 style={{ color: "#2dd4bf", fontFamily: "Manrope", marginBottom: 24, textAlign: "center" }}>Giriş Yap</h2>
        <div style={{ marginBottom: 16 }}>
          <label style={{ color: "#fff", fontFamily: "Manrope", marginBottom: 4, display: "block" }}>Email</label>
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            style={{ width: "100%", padding: 8, borderRadius: 6, border: "1px solid #2dd4bf", background: "#0a0f14", color: "#fff", fontFamily: "Manrope" }}
            required
          />
        </div>
        <div style={{ marginBottom: 16 }}>
          <label style={{ color: "#fff", fontFamily: "Manrope", marginBottom: 4, display: "block" }}>Şifre</label>
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            style={{ width: "100%", padding: 8, borderRadius: 6, border: "1px solid #2dd4bf", background: "#0a0f14", color: "#fff", fontFamily: "Manrope" }}
            required
          />
        </div>
        {error && <div style={{ color: "#ef4444", marginBottom: 16, fontFamily: "Manrope", textAlign: "center" }}>{error}</div>}
        <button type="submit" disabled={loading} style={{ width: "100%", padding: 10, borderRadius: 6, background: "#2dd4bf", color: "#0a0f14", fontWeight: 600, fontFamily: "Manrope", fontSize: 16, border: "none", cursor: "pointer" }}>
          {loading ? "Giriş Yapılıyor..." : "Giriş Yap"}
        </button>
      </form>
    </div>
  );
}