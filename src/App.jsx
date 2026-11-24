import React, { useEffect, useMemo, useState } from "react";
 
const API_URL = "https://tarq-backend.onrender.com";
const TEST_STORE_ID = 1;
 
const demoProducts = [
  { id: 1, title: "AkÄ±llÄ± Telefon", price: "2.899 SAR", decision: "AL", color: "#15803d" },
  { id: 2, title: "Orijinal ParfÃ¼m", price: "349 SAR", decision: "BEKLE", color: "#b45309" },
  { id: 3, title: "Market Sepeti", price: "186 SAR", decision: "AL", color: "#15803d" },
];
 
const TIME_RANGES = [
  { key: "1m", label: "1 Ay", months: 1 },
  { key: "3m", label: "3 Ay", months: 3 },
  { key: "6m", label: "6 Ay", months: 6 },
  { key: "1y", label: "1 YÄ±l", months: 12 },
  { key: "all", label: "TÃ¼mÃ¼", months: null },
];
 
function riskLabel(value) {
  const normalized = String(value || "").toLowerCase();
  if (normalized === "low") return "DÃ¼ÅŸÃ¼k";
  if (normalized === "medium") return "Orta";
  if (normalized === "high") return "YÃ¼ksek";
  return "Bilinmiyor";
}
 
function formatPrice(value, currency = "SAR") {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return null;
  return `${new Intl.NumberFormat("tr-TR", { maximumFractionDigits: 2 }).format(numeric)} ${currency}`;
}
 
function filterHistoryByRange(history, rangeKey) {
  if (!Array.isArray(history)) return [];
  const option = TIME_RANGES.find((item) => item.key === rangeKey);
  if (!option || option.months === null || history.length === 0) return history;
 
  const validDates = history
    .map((item) => new Date(item.checked_at))
    .filter((date) => !Number.isNaN(date.getTime()));
 
  if (!validDates.length) return history;
 
  // Test verileri geÃ§miÅŸ tarihli olduÄŸundan referans olarak en yeni kayÄ±t kullanÄ±lÄ±r.
  const latestDate = new Date(Math.max(...validDates.map((date) => date.getTime())));
  const cutoffDate = new Date(latestDate);
  cutoffDate.setMonth(cutoffDate.getMonth() - option.months);
 
  return history.filter((item) => {
    const date = new Date(item.checked_at);
    return !Number.isNaN(date.getTime()) && date >= cutoffDate && date <= latestDate;
  });
}
 
function analyzeHistory(history, fallbackAnalysis, fallbackDecision) {
  if (!Array.isArray(history) || history.length === 0) {
    return { analysis: fallbackAnalysis, decision: fallbackDecision };
  }
 
  const firstPrice = Number(history[0]?.price);
  const currentPrice = Number(history[history.length - 1]?.price);
  if (!Number.isFinite(firstPrice) || !Number.isFinite(currentPrice)) {
    return { analysis: fallbackAnalysis, decision: fallbackDecision };
  }
 
  const difference = currentPrice - firstPrice;
  const percentageChange = firstPrice === 0 ? 0 : Number(((difference / firstPrice) * 100).toFixed(2));
  const status = percentageChange <= -5 ? "AL" : percentageChange > 0 ? "BEKLE" : "TAKÄ°P ET";
 
  return {
    analysis: {
      first_price: firstPrice,
      current_price: currentPrice,
      difference,
      percentage_change: percentageChange,
      direction: difference < 0 ? "down" : difference > 0 ? "up" : "stable",
    },
    decision: {
      status,
      reason:
        status === "AL"
          ? "SeÃ§ilen dÃ¶nemde fiyat en az %5 dÃ¼ÅŸtÃ¼."
          : status === "BEKLE"
            ? "SeÃ§ilen dÃ¶nemde fiyat yÃ¼kseldi."
            : "SeÃ§ilen dÃ¶nemde fiyat deÄŸiÅŸimi sÄ±nÄ±rlÄ±.",
    },
  };
}
 
function PriceHistoryChart({ history }) {
  if (!Array.isArray(history) || history.length === 0) return null;
 
  const validHistory = history.filter((item) => Number.isFinite(Number(item.price)));
  if (!validHistory.length) return null;
 
  const values = validHistory.map((item) => Number(item.price));
  const width = 760;
  const height = 230;
  const pad = 38;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
 
  const points = values.map((value, index) => {
    const x = values.length === 1 ? width / 2 : pad + index * ((width - pad * 2) / (values.length - 1));
    const y = pad + ((max - value) / range) * (height - pad * 2);
    return { x, y, value };
  });
 
  return (
    <div style={s.chartWrap}>
      <svg viewBox={`0 0 ${width} ${height}`} style={s.chart} role="img" aria-label="GerÃ§ek fiyat geÃ§miÅŸi grafiÄŸi">
        <line x1={pad} y1={height - pad} x2={width - pad} y2={height - pad} stroke="#cbd5e1" strokeWidth="2" />
        <polyline
          points={points.map((point) => `${point.x},${point.y}`).join(" ")}
          fill="none"
          stroke="#0891b2"
          strokeWidth="6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {points.map((point, index) => (
          <g key={`${point.x}-${index}`}>
            <circle cx={point.x} cy={point.y} r="8" fill="#fff" stroke="#0891b2" strokeWidth="5" />
            <text x={point.x} y={Math.max(20, point.y - 18)} textAnchor="middle" fontSize="17" fontWeight="800" fill="#0f172a">
              {new Intl.NumberFormat("tr-TR").format(point.value)} SAR
            </text>
          </g>
        ))}
      </svg>
      <div style={s.chartDates}>
        {validHistory.map((item) => (
          <span key={item.id}>{new Date(item.checked_at).toLocaleDateString("tr-TR")}</span>
        ))}
      </div>
    </div>
  );
}
 
function App() {
  const [screen, setScreen] = useState("home");
  const [selectedProduct, setSelectedProduct] = useState(demoProducts[0]);
  const [showAuth, setShowAuth] = useState(false);
  const [mode, setMode] = useState("login");
  const [currentUser, setCurrentUser] = useState(null);
  const [query, setQuery] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [offers, setOffers] = useState([]);
  const [trustStore, setTrustStore] = useState(null);
  const [trustLoading, setTrustLoading] = useState(false);
  const [trustError, setTrustError] = useState("");
  const [priceHistory, setPriceHistory] = useState([]);
  const [priceAnalysis, setPriceAnalysis] = useState(null);
  const [priceDecision, setPriceDecision] = useState(null);
  const [priceHistoryLoading, setPriceHistoryLoading] = useState(false);
  const [priceHistoryError, setPriceHistoryError] = useState("");
  const [timeRange, setTimeRange] = useState("all");
 
  const filteredPriceHistory = useMemo(
    () => filterHistoryByRange(priceHistory, timeRange),
    [priceHistory, timeRange]
  );
 
  const filteredResult = useMemo(
    () => analyzeHistory(filteredPriceHistory, priceAnalysis, priceDecision),
    [filteredPriceHistory, priceAnalysis, priceDecision]
  );
 
  const bestOffer = useMemo(() => offers[0] || null, [offers]);
  const visibleTrust = bestOffer?.trust_score ?? trustStore?.trust_score ?? null;
  const visibleRisk = bestOffer?.authenticity_risk ?? trustStore?.authenticity_risk ?? null;
  const visibleVerified = bestOffer?.is_verified ?? trustStore?.is_verified ?? false;
  const visibleStatus = bestOffer?.verification_status ?? trustStore?.verification_status ?? "unknown";
  const visiblePrice =
    formatPrice(bestOffer?.price, bestOffer?.currency) ||
    formatPrice(filteredResult.analysis?.current_price) ||
    selectedProduct.price;
 
  useEffect(() => {
    const savedToken = localStorage.getItem("tarq_token");
    if (savedToken) setCurrentUser({ name: "TARQ KullanÄ±cÄ±sÄ±" });
  }, []);
 
  async function loadTrustData(productId) {
    setTrustLoading(true);
    setTrustError("");
    setOffers([]);
    setTrustStore(null);
 
    const productRequest = fetch(`${API_URL}/api/products/${productId}`).then(async (response) => {
      if (!response.ok) throw new Error("ÃœrÃ¼n Trust verisi alÄ±namadÄ±");
      return response.json();
    });
 
    const testStoreRequest = fetch(`${API_URL}/api/stores/${TEST_STORE_ID}`).then(async (response) => {
      if (!response.ok) throw new Error("Test maÄŸazasÄ± alÄ±namadÄ±");
      return response.json();
    });
 
    const [productResult, storeResult] = await Promise.allSettled([productRequest, testStoreRequest]);
    if (productResult.status === "fulfilled") {
      setOffers(Array.isArray(productResult.value.prices) ? productResult.value.prices : []);
    }
    if (storeResult.status === "fulfilled") setTrustStore(storeResult.value);
    if (productResult.status === "rejected" && storeResult.status === "rejected") {
      setTrustError("Trust API baÄŸlantÄ±sÄ± kurulamadÄ±. Backend'in 3000 portunda Ã§alÄ±ÅŸtÄ±ÄŸÄ±nÄ± kontrol edin.");
    }
    setTrustLoading(false);
  }
 
  async function loadPriceHistory(productId) {
    setPriceHistoryLoading(true);
    setPriceHistoryError("");
    setPriceHistory([]);
    setPriceAnalysis(null);
    setPriceDecision(null);
    setTimeRange("all");
 
    try {
      const response = await fetch(`${API_URL}/api/price-history/${productId}`);
      if (!response.ok) throw new Error("Fiyat geÃ§miÅŸi alÄ±namadÄ±");
      const data = await response.json();
      setPriceHistory(Array.isArray(data.history) ? data.history : []);
      setPriceAnalysis(data.analysis || null);
      setPriceDecision(data.decision || null);
    } catch {
      setPriceHistoryError("Price History API baÄŸlantÄ±sÄ± kurulamadÄ±.");
    } finally {
      setPriceHistoryLoading(false);
    }
  }
 
  async function handleSubmit() {
    setMessage("Ä°ÅŸlem yapÄ±lÄ±yor...");
    const endpoint = mode === "login" ? `${API_URL}/api/auth/login` : `${API_URL}/api/auth/register`;
    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });
      const data = await response.json();
      if (!response.ok) return setMessage(data.message || data.error || "Ä°ÅŸlem baÅŸarÄ±sÄ±z.");
      if (data.token) {
        localStorage.setItem("tarq_token", data.token);
        setCurrentUser(data.user || { name: "TARQ KullanÄ±cÄ±sÄ±" });
        setShowAuth(false);
      }
      setMessage(data.message || "Ä°ÅŸlem baÅŸarÄ±lÄ±.");
    } catch {
      setMessage("Backend baÄŸlantÄ±sÄ± kurulamadÄ±.");
    }
  }
 
  function openProduct(product) {
    setSelectedProduct(product);
    setScreen("detail");
    window.scrollTo(0, 0);
    loadTrustData(product.id);
    loadPriceHistory(product.id);
  }
 
  const Header = () => (
    <header style={s.header}>
      <div style={s.nav}>
        {screen === "detail" ? (
          <button style={s.back} onClick={() => setScreen("home")}>â† Ana Sayfa</button>
        ) : (
          <div style={s.logo}>TARQ</div>
        )}
        <div style={s.actions}>
          <button style={s.icon}>â™¡</button>
          <button style={s.icon}>ğŸ””</button>
          {currentUser ? (
            <button style={s.login}>{currentUser.name || "HesabÄ±m"}</button>
          ) : (
            <button style={s.login} onClick={() => setShowAuth(true)}>GiriÅŸ</button>
          )}
        </div>
      </div>
    </header>
  );
 
  if (screen === "detail") {
    return (
      <div style={s.page}>
        <Header />
        <main style={s.detailMain}>
          <section style={s.detailHero}>
            <div style={s.bigVisual}>T</div>
            <div>
              <span style={s.eyebrow}>ÃœRÃœN DETAYI</span>
              <h1 style={s.detailTitle}>{selectedProduct.title}</h1>
              <p style={s.muted}>{offers.length || 0} gerÃ§ek API teklifi bulundu</p>
              <div style={s.best}>En iyi doÄŸrulanmÄ±ÅŸ fiyat</div>
              <div style={s.detailPrice}>{visiblePrice}</div>
              <div style={s.actionRow}>
                <button style={s.primary}>ğŸ”” FiyatÄ± Takip Et</button>
                <button style={s.secondary}>â™¡ Favoriye Ekle</button>
              </div>
            </div>
          </section>
 
          <section style={s.block}>
            <span style={s.eyebrow}>TARQ TRUST INTELLIGENCE</span>
            <h2 style={s.h2}>GÃ¼ven, satÄ±cÄ± ve orijinallik birlikte deÄŸerlendirilir.</h2>
            {trustLoading && <p style={s.info}>Trust verileri yÃ¼kleniyor...</p>}
            {trustError && <p style={s.error}>{trustError}</p>}
            {!trustLoading && !trustError && (
              <div style={s.trustGrid}>
                <div style={s.card}>
                  <b>ğŸ›¡ GÃ¼ven</b>
                  <strong style={s.value}>{visibleTrust ?? "-"}/100</strong>
                  <small style={s.apiBadge}>CANLI API</small>
                </div>
                <div style={s.card}>
                  <b>âœ“ SatÄ±cÄ±</b>
                  <strong style={s.value}>{visibleVerified ? "DoÄŸrulanmÄ±ÅŸ" : "DoÄŸrulanmamÄ±ÅŸ"}</strong>
                  <small style={s.small}>Durum: {visibleStatus}</small>
                </div>
                <div style={s.card}>
                  <b>Orijinallik riski</b>
                  <strong style={{ ...s.value, color: visibleRisk === "high" ? "#b91c1c" : "#166534" }}>
                    {riskLabel(visibleRisk)}
                  </strong>
                  <small style={s.small}>API deÄŸeri: {visibleRisk || "yok"}</small>
                </div>
              </div>
            )}
          </section>
 
          <section style={s.block}>
            <span style={s.eyebrow}>GERÃ‡EK PRICE HISTORY</span>
            <h2 style={s.h2}>FiyatÄ±n nasÄ±l deÄŸiÅŸtiÄŸini canlÄ± API verisiyle gÃ¶rÃ¼n.</h2>
            {priceHistoryLoading && <p style={s.info}>Fiyat geÃ§miÅŸi yÃ¼kleniyor...</p>}
            {priceHistoryError && <p style={s.error}>{priceHistoryError}</p>}
            {!priceHistoryLoading && !priceHistoryError && priceHistory.length > 0 && (
              <>
                <div style={s.rangeRow}>
                  {TIME_RANGES.map((range) => (
                    <button
                      key={range.key}
                      type="button"
                      onClick={() => setTimeRange(range.key)}
                      style={timeRange === range.key ? s.rangeActive : s.rangeButton}
                    >
                      {range.label}
                    </button>
                  ))}
                </div>
 
                {filteredPriceHistory.length > 0 ? (
                  <PriceHistoryChart history={filteredPriceHistory} />
                ) : (
                  <p style={s.info}>Bu zaman aralÄ±ÄŸÄ±nda fiyat kaydÄ± yok.</p>
                )}
 
                <div style={s.historyStats}>
                  <div style={s.card}>
                    <b>Ä°lk fiyat</b>
                    <strong style={s.value}>{formatPrice(filteredResult.analysis?.first_price)}</strong>
                  </div>
                  <div style={s.card}>
                    <b>GÃ¼ncel fiyat</b>
                    <strong style={s.value}>{formatPrice(filteredResult.analysis?.current_price)}</strong>
                  </div>
                  <div style={s.card}>
                    <b>DeÄŸiÅŸim</b>
                    <strong style={{ ...s.value, color: "#15803d" }}>
                      {filteredResult.analysis?.difference} SAR Â· %{filteredResult.analysis?.percentage_change}
                    </strong>
                  </div>
                  <div style={s.card}>
                    <b>TARQ kararÄ±</b>
                    <strong style={{ ...s.value, color: "#15803d" }}>{filteredResult.decision?.status || "-"}</strong>
                    <small style={s.small}>{filteredResult.decision?.reason || ""}</small>
                  </div>
                </div>
              </>
            )}
          </section>
 
          <section style={s.block}>
            <span style={s.eyebrow}>FÄ°YATLAR VE SATICILAR</span>
            <h2 style={s.h2}>En ucuz teklif otomatik olarak en iyi teklif deÄŸildir.</h2>
            <div style={s.offers}>
              {offers.length > 0 ? offers.map((offer) => (
                <div key={offer.id} style={offer.authenticity_risk === "high" ? s.risky : s.offer}>
                  <span>
                    <b>{offer.is_verified ? "âœ“" : "âš "} {offer.store_name}</b>
                    <small style={s.small}>GÃ¼ven {offer.trust_score ?? "-"}/100 Â· Risk {riskLabel(offer.authenticity_risk)}</small>
                  </span>
                  <b>{formatPrice(offer.price, offer.currency)}</b>
                </div>
              )) : (
                <div style={s.offer}>
                  <span>
                    <b>{trustStore?.name || "TARQ Test Store"}</b>
                    <small style={s.small}>Test Trust API kaydÄ± Â· Ãœretim fiyatÄ± henÃ¼z yok</small>
                  </span>
                  <b>GÃ¼ven {visibleTrust ?? "-"}/100</b>
                </div>
              )}
            </div>
          </section>
 
          <section style={s.decision}>
            <div>
              <span style={s.darkEye}>TARQ KARARI</span>
              <div style={{ ...s.badge, background: filteredResult.decision?.status === "AL" ? "#15803d" : selectedProduct.color }}>
                {filteredResult.decision?.status || selectedProduct.decision}
              </div>
              <p style={s.decisionText}>{filteredResult.decision?.reason || "Fiyat avantajÄ±, satÄ±cÄ± gÃ¼veni ve orijinallik riski birlikte deÄŸerlendirilir."}</p>
            </div>
            <div style={s.reasons}>
              <div>âœ“ Trust API baÄŸlantÄ±sÄ± aktif</div>
              <div>âœ“ Price History API baÄŸlantÄ±sÄ± aktif</div>
              <div>âœ“ Zaman aralÄ±ÄŸÄ± filtresi aktif</div>
              <div>âœ“ Orijinallik riski deÄŸerlendirildi</div>
            </div>
          </section>
        </main>
        <Footer />
      </div>
    );
  }
 
  return (
    <div style={s.page}>
      <Header />
      <main>
        <section style={s.hero}>
          <div style={s.heroInner}>
            <div style={s.ai}>âœ¦ TARQ Karar ZekÃ¢sÄ±</div>
            <h1 style={s.heroTitle}>BugÃ¼n neye ihtiyacÄ±nÄ±z var?</h1>
            <p style={s.heroText}>ÃœrÃ¼nÃ¼ bilmek zorunda deÄŸilsiniz. TARQ fiyatÄ±, satÄ±cÄ± gÃ¼venini ve riski birlikte deÄŸerlendirsin.</p>
            <div style={s.search}>
              <input style={s.input} value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Ã–rn: 3000 SAR altÄ±nda gÃ¼venilir bir telefon arÄ±yorum" />
              <button style={s.searchBtn}>TARQ'a Sor</button>
            </div>
          </div>
        </section>
 
        <section style={s.section}>
          <div style={s.container}>
            <span style={s.eyebrow}>GERÃ‡EK TRUST API TESTÄ°</span>
            <h2 style={s.h2}>ÃœrÃ¼n detayÄ±nda canlÄ± gÃ¼ven ve fiyat geÃ§miÅŸi verisini gÃ¶rÃ¼n.</h2>
            <div style={s.productGrid}>
              {demoProducts.map((product) => (
                <article key={product.id} style={s.product}>
                  <div style={s.visual}>T</div>
                  <div style={s.productBody}>
                    <h3>{product.title}</h3>
                    <div style={s.price}>{product.price}</div>
                    <p style={s.meta}>Trust ve Price History verileri detay aÃ§Ä±ldÄ±ÄŸÄ±nda API'den alÄ±nÄ±r.</p>
                    <button style={s.detailBtn} onClick={() => openProduct(product)}>Detay</button>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>
      </main>
 
      {showAuth && (
        <div style={s.overlay}>
          <div style={s.auth}>
            <button style={s.close} onClick={() => setShowAuth(false)}>Ã—</button>
            <div style={s.authLogo}>TARQ</div>
            <h2>{mode === "login" ? "GiriÅŸ Yap" : "Hesap OluÅŸtur"}</h2>
            {mode === "register" && <input style={s.authInput} placeholder="AdÄ±nÄ±z" value={name} onChange={(e) => setName(e.target.value)} />}
            <input style={s.authInput} type="email" placeholder="E-posta" value={email} onChange={(e) => setEmail(e.target.value)} />
            <input style={s.authInput} type="password" placeholder="Åifre" value={password} onChange={(e) => setPassword(e.target.value)} />
            <button style={s.primary} onClick={handleSubmit}>{mode === "login" ? "GiriÅŸ Yap" : "KayÄ±t Ol"}</button>
            {message && <p>{message}</p>}
            <button style={s.switch} onClick={() => { setMode(mode === "login" ? "register" : "login"); setMessage(""); }}>
              {mode === "login" ? "Yeni Hesap OluÅŸtur" : "GiriÅŸe DÃ¶n"}
            </button>
          </div>
        </div>
      )}
      <Footer />
    </div>
  );
}
 
function Footer() {
  return <footer style={s.footer}><b>TARQ</b><span>AkÄ±llÄ± alÄ±ÅŸveriÅŸ, gÃ¼venli karar.</span><small>MVP geliÅŸtirme aÅŸamasÄ±</small></footer>;
}
 
const s = {
  page: { minHeight: "100vh", width: "100%", margin: 0, fontFamily: "Inter,Arial,sans-serif", color: "#0f172a", background: "#fff" },
  header: { position: "sticky", top: 0, zIndex: 20, background: "#07111f" },
  nav: { maxWidth: 1240, minHeight: 72, margin: "0 auto", padding: "0 28px", display: "flex", alignItems: "center", justifyContent: "space-between" },
  logo: { fontSize: 30, fontWeight: 900, letterSpacing: 5, color: "#fff" },
  actions: { display: "flex", gap: 10 },
  icon: { width: 42, height: 42, border: "1px solid #475569", borderRadius: 14, background: "#111e30", color: "#fff" },
  login: { padding: "0 18px", border: 0, borderRadius: 14, background: "#22d3ee", color: "#082f49", fontWeight: 900 },
  back: { border: 0, background: "transparent", color: "#fff", fontWeight: 800 },
  hero: { padding: "82px 28px 92px", background: "radial-gradient(circle at top right,#155e75 0,#0f2741 32%,#07111f 70%)", color: "#fff" },
  heroInner: { maxWidth: 940, margin: "0 auto", textAlign: "center" },
  ai: { display: "inline-block", padding: "8px 14px", borderRadius: 999, background: "#0d3345", color: "#a5f3fc", fontWeight: 900 },
  heroTitle: { margin: "30px 0", fontSize: "clamp(42px,6vw,72px)", lineHeight: 1.18, color: "#fff" },
  heroText: { maxWidth: 760, margin: "0 auto", fontSize: 19, lineHeight: 1.75, color: "#e2e8f0" },
  search: { maxWidth: 840, margin: "38px auto 18px", padding: 7, display: "flex", gap: 8, borderRadius: 20, background: "#fff" },
  input: { flex: 1, minWidth: 0, padding: "15px 16px", border: 0, outline: 0, fontSize: 16, color: "#0f172a" },
  searchBtn: { padding: "0 22px", border: 0, borderRadius: 14, background: "#22d3ee", color: "#082f49", fontWeight: 900 },
  section: { padding: "68px 28px", background: "#fff" },
  container: { maxWidth: 1240, margin: "0 auto" },
  eyebrow: { color: "#0e7490", fontSize: 12, fontWeight: 900, letterSpacing: 1.8 },
  h2: { fontSize: "clamp(27px,3vw,40px)", lineHeight: 1.2 },
  productGrid: { marginTop: 24, display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(245px,1fr))", gap: 20 },
  product: { overflow: "hidden", border: "1px solid #cbd5e1", borderRadius: 22, background: "#fff" },
  visual: { height: 130, display: "grid", placeItems: "center", background: "linear-gradient(135deg,#cffafe,#e0e7ff)", fontSize: 38, fontWeight: 900, color: "#0e7490" },
  productBody: { padding: 20 },
  price: { fontSize: 27, fontWeight: 900 },
  meta: { color: "#334155", fontSize: 14 },
  detailBtn: { width: "100%", padding: 11, border: 0, borderRadius: 12, background: "#0f172a", color: "#fff", fontWeight: 800 },
  detailMain: { maxWidth: 1240, margin: "0 auto", padding: "38px 28px 0" },
  detailHero: { display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(280px,1fr))", gap: 38, alignItems: "center", padding: 28, border: "1px solid #cbd5e1", borderRadius: 28 },
  bigVisual: { minHeight: 320, display: "grid", placeItems: "center", borderRadius: 24, background: "linear-gradient(135deg,#cffafe,#e0e7ff)", fontSize: 80, fontWeight: 900, color: "#0e7490" },
  detailTitle: { fontSize: "clamp(34px,4vw,54px)", lineHeight: 1.12 },
  muted: { color: "#334155", fontWeight: 700 },
  best: { marginTop: 25, color: "#475569", fontWeight: 700 },
  detailPrice: { fontSize: 38, fontWeight: 900 },
  actionRow: { display: "flex", gap: 10, flexWrap: "wrap", marginTop: 20 },
  primary: { padding: "12px 17px", border: 0, borderRadius: 12, background: "#0891b2", color: "#fff", fontWeight: 800 },
  secondary: { padding: "12px 17px", border: "1px solid #94a3b8", borderRadius: 12, background: "#fff", color: "#0f172a", fontWeight: 800 },
  block: { padding: "62px 0 0" },
  trustGrid: { marginTop: 24, display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(210px,1fr))", gap: 14 },
  historyStats: { marginTop: 18, display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(190px,1fr))", gap: 14 },
  rangeRow: { display: "flex", gap: 8, flexWrap: "wrap", marginTop: 20 },
  rangeButton: { padding: "9px 14px", border: "1px solid #94a3b8", borderRadius: 999, background: "#fff", color: "#334155", fontWeight: 800, cursor: "pointer" },
  rangeActive: { padding: "9px 14px", border: "1px solid #0891b2", borderRadius: 999, background: "#0891b2", color: "#fff", fontWeight: 900, cursor: "pointer" },
  card: { padding: 22, border: "1px solid #cbd5e1", borderRadius: 20, display: "flex", flexDirection: "column", gap: 8 },
  value: { fontSize: 24 },
  apiBadge: { alignSelf: "flex-start", padding: "4px 8px", borderRadius: 999, background: "#dcfce7", color: "#166534", fontWeight: 900 },
  info: { padding: 15, borderRadius: 12, background: "#ecfeff", color: "#155e75" },
  error: { padding: 15, borderRadius: 12, background: "#fef2f2", color: "#b91c1c" },
  chartWrap: { marginTop: 24, padding: 20, border: "1px solid #cbd5e1", borderRadius: 20, background: "#f8fafc" },
  chart: { display: "block", width: "100%", height: "auto", overflow: "visible" },
  chartDates: { display: "flex", justifyContent: "space-between", gap: 12, color: "#475569", fontSize: 13, fontWeight: 700 },
  offers: { marginTop: 24, display: "grid", gap: 12 },
  offer: { padding: 20, border: "1px solid #cbd5e1", borderRadius: 18, display: "flex", justifyContent: "space-between", gap: 20 },
  risky: { padding: 20, border: "1px solid #fdba74", borderRadius: 18, display: "flex", justifyContent: "space-between", gap: 20, background: "#fff7ed" },
  small: { display: "block", marginTop: 6, color: "#475569" },
  decision: { margin: "62px 0 74px", padding: 36, display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(270px,1fr))", gap: 28, borderRadius: 28, background: "#07111f", color: "#fff" },
  darkEye: { color: "#a5f3fc", fontWeight: 900 },
  badge: { display: "inline-block", margin: "12px 0", padding: "8px 18px", borderRadius: 999, color: "#fff", fontSize: 24, fontWeight: 900 },
  decisionText: { color: "#e2e8f0", fontSize: 17, lineHeight: 1.65 },
  reasons: { display: "grid", gap: 10, alignContent: "center" },
  overlay: { position: "fixed", inset: 0, zIndex: 100, display: "grid", placeItems: "center", padding: 20, background: "rgba(2,6,23,.75)" },
  auth: { position: "relative", width: "100%", maxWidth: 390, padding: 30, boxSizing: "border-box", borderRadius: 24, background: "#fff" },
  close: { position: "absolute", top: 12, right: 17, border: 0, background: "transparent", fontSize: 27 },
  authLogo: { fontSize: 27, fontWeight: 900, letterSpacing: 4 },
  authInput: { width: "100%", boxSizing: "border-box", marginBottom: 11, padding: 13, border: "1px solid #94a3b8", borderRadius: 11 },
  switch: { width: "100%", marginTop: 9, padding: 11, border: 0, background: "transparent", color: "#0369a1", fontWeight: 800 },
  footer: { minHeight: 90, padding: 20, display: "flex", flexWrap: "wrap", justifyContent: "center", alignItems: "center", gap: 14, background: "#07111f", color: "#cbd5e1" },
};
 
export default App;


