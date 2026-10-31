import React, { useEffect, useMemo, useState } from "react";
 
const API_URL = "http://localhost:3000";
const TEST_STORE_ID = 1;
 
const demoProducts = [
  { id: 1, title: "Akıllı Telefon", price: "2.899 SAR", decision: "AL", color: "#15803d" },
  { id: 2, title: "Orijinal Parfüm", price: "349 SAR", decision: "BEKLE", color: "#b45309" },
  { id: 3, title: "Market Sepeti", price: "186 SAR", decision: "AL", color: "#15803d" },
];
 
function riskLabel(value) {
  const normalized = String(value || "").toLowerCase();
  if (normalized === "low") return "Düşük";
  if (normalized === "medium") return "Orta";
  if (normalized === "high") return "Yüksek";
  return "Bilinmiyor";
}
 
function formatPrice(value, currency = "SAR") {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return null;
  return `${new Intl.NumberFormat("tr-TR", { maximumFractionDigits: 2 }).format(numeric)} ${currency}`;
}
 
function PriceHistoryChart({ history }) {
  if (!Array.isArray(history) || history.length === 0) return null;
  const values = history.map((item) => Number(item.price)).filter(Number.isFinite);
  if (!values.length) return null;
  const width = 760, height = 230, pad = 38;
  const min = Math.min(...values), max = Math.max(...values);
  const range = max - min || 1;
  const points = values.map((value, index) => {
    const x = values.length === 1 ? width / 2 : pad + index * ((width - pad * 2) / (values.length - 1));
    const y = pad + ((max - value) / range) * (height - pad * 2);
    return { x, y, value, item: history[index] };
  });
  const polyline = points.map((p) => `${p.x},${p.y}`).join(" ");
  return (
    <div style={s.chartWrap}>
      <svg viewBox={`0 0 ${width} ${height}`} style={s.chart} role="img" aria-label="Gerçek fiyat geçmişi grafiği">
        <line x1={pad} y1={height - pad} x2={width - pad} y2={height - pad} stroke="#cbd5e1" strokeWidth="2" />
        <polyline points={polyline} fill="none" stroke="#0891b2" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
        {points.map((p, i) => (
          <g key={i}>
            <circle cx={p.x} cy={p.y} r="8" fill="#fff" stroke="#0891b2" strokeWidth="5" />
            <text x={p.x} y={Math.max(20, p.y - 18)} textAnchor="middle" fontSize="17" fontWeight="800" fill="#0f172a">
              {new Intl.NumberFormat("tr-TR").format(p.value)} SAR
            </text>
          </g>
        ))}
      </svg>
      <div style={s.chartDates}>
        {history.map((item) => (
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
 
  const bestOffer = useMemo(() => offers[0] || null, [offers]);
  const visibleTrust = bestOffer?.trust_score ?? trustStore?.trust_score ?? null;
  const visibleRisk = bestOffer?.authenticity_risk ?? trustStore?.authenticity_risk ?? null;
  const visibleVerified = bestOffer?.is_verified ?? trustStore?.is_verified ?? false;
  const visibleStatus = bestOffer?.verification_status ?? trustStore?.verification_status ?? "unknown";
  const visiblePrice = formatPrice(bestOffer?.price, bestOffer?.currency) || formatPrice(priceAnalysis?.current_price) || selectedProduct.price;
 
  useEffect(() => {
    const savedToken = localStorage.getItem("tarq_token");
    if (savedToken) setCurrentUser({ name: "TARQ Kullanıcısı" });
  }, []);
 
  async function loadTrustData(productId) {
    setTrustLoading(true); setTrustError(""); setOffers([]); setTrustStore(null);
    const productRequest = fetch(`${API_URL}/api/products/${productId}`).then(async (response) => {
      if (!response.ok) throw new Error("Ürün Trust verisi alınamadı");
      return response.json();
    });
    const testStoreRequest = fetch(`${API_URL}/api/stores/${TEST_STORE_ID}`).then(async (response) => {
      if (!response.ok) throw new Error("Test mağazası alınamadı");
      return response.json();
    });
    const [productResult, storeResult] = await Promise.allSettled([productRequest, testStoreRequest]);
    if (productResult.status === "fulfilled") setOffers(Array.isArray(productResult.value.prices) ? productResult.value.prices : []);
    if (storeResult.status === "fulfilled") setTrustStore(storeResult.value);
    if (productResult.status === "rejected" && storeResult.status === "rejected") setTrustError("Trust API bağlantısı kurulamadı. Backend'in 3000 portunda çalıştığını kontrol edin.");
    setTrustLoading(false);
  }
 
  async function loadPriceHistory(productId) {
    setPriceHistoryLoading(true); setPriceHistoryError(""); setPriceHistory([]); setPriceAnalysis(null); setPriceDecision(null);
    try {
      const response = await fetch(`${API_URL}/api/price-history/${productId}`);
      if (!response.ok) throw new Error("Fiyat geçmişi alınamadı");
      const data = await response.json();
      setPriceHistory(Array.isArray(data.history) ? data.history : []);
      setPriceAnalysis(data.analysis || null);
      setPriceDecision(data.decision || null);
    } catch {
      setPriceHistoryError("Price History API bağlantısı kurulamadı.");
    } finally { setPriceHistoryLoading(false); }
  }
 
  async function handleSubmit() {
    setMessage("İşlem yapılıyor...");
    const endpoint = mode === "login" ? `${API_URL}/api/auth/login` : `${API_URL}/api/auth/register`;
    try {
      const response = await fetch(endpoint, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name, email, password }) });
      const data = await response.json();
      if (!response.ok) return setMessage(data.message || data.error || "İşlem başarısız.");
      if (data.token) { localStorage.setItem("tarq_token", data.token); setCurrentUser(data.user || { name: "TARQ Kullanıcısı" }); setShowAuth(false); }
      setMessage(data.message || "İşlem başarılı.");
    } catch { setMessage("Backend bağlantısı kurulamadı."); }
  }
 
  function openProduct(product) {
    setSelectedProduct(product); setScreen("detail"); window.scrollTo(0, 0);
    loadTrustData(product.id); loadPriceHistory(product.id);
  }
 
  const Header = () => (<header style={s.header}><div style={s.nav}>{screen === "detail" ? <button style={s.back} onClick={() => setScreen("home")}>← Ana Sayfa</button> : <div style={s.logo}>TARQ</div>}<div style={s.actions}><button style={s.icon}>♡</button><button style={s.icon}>🔔</button>{currentUser ? <button style={s.login}>{currentUser.name || "Hesabım"}</button> : <button style={s.login} onClick={() => setShowAuth(true)}>Giriş</button>}</div></div></header>);
 
  if (screen === "detail") return (
    <div style={s.page}><Header /><main style={s.detailMain}>
      <section style={s.detailHero}><div style={s.bigVisual}>T</div><div><span style={s.eyebrow}>ÜRÜN DETAYI</span><h1 style={s.detailTitle}>{selectedProduct.title}</h1><p style={s.muted}>{offers.length || 0} gerçek API teklifi bulundu</p><div style={s.best}>En iyi doğrulanmış fiyat</div><div style={s.detailPrice}>{visiblePrice}</div><div style={s.actionRow}><button style={s.primary}>🔔 Fiyatı Takip Et</button><button style={s.secondary}>♡ Favoriye Ekle</button></div></div></section>
      <section style={s.block}><span style={s.eyebrow}>TARQ TRUST INTELLIGENCE</span><h2 style={s.h2}>Güven, satıcı ve orijinallik birlikte değerlendirilir.</h2>{trustLoading && <p style={s.info}>Trust verileri yükleniyor...</p>}{trustError && <p style={s.error}>{trustError}</p>}{!trustLoading && !trustError && <div style={s.trustGrid}><div style={s.card}><b>🛡 Güven</b><strong style={s.value}>{visibleTrust ?? "-"}/100</strong><small style={s.apiBadge}>CANLI API</small></div><div style={s.card}><b>✓ Satıcı</b><strong style={s.value}>{visibleVerified ? "Doğrulanmış" : "Doğrulanmamış"}</strong><small style={s.small}>Durum: {visibleStatus}</small></div><div style={s.card}><b>Orijinallik riski</b><strong style={{...s.value,color:visibleRisk === "high" ? "#b91c1c" : "#166534"}}>{riskLabel(visibleRisk)}</strong><small style={s.small}>API değeri: {visibleRisk || "yok"}</small></div></div>}</section>
      <section style={s.block}><span style={s.eyebrow}>GERÇEK PRICE HISTORY</span><h2 style={s.h2}>Fiyatın nasıl değiştiğini canlı API verisiyle görün.</h2>{priceHistoryLoading && <p style={s.info}>Fiyat geçmişi yükleniyor...</p>}{priceHistoryError && <p style={s.error}>{priceHistoryError}</p>}{!priceHistoryLoading && !priceHistoryError && priceHistory.length > 0 && <><PriceHistoryChart history={priceHistory}/><div style={s.historyStats}><div style={s.card}><b>İlk fiyat</b><strong style={s.value}>{formatPrice(priceAnalysis?.first_price)}</strong></div><div style={s.card}><b>Güncel fiyat</b><strong style={s.value}>{formatPrice(priceAnalysis?.current_price)}</strong></div><div style={s.card}><b>Değişim</b><strong style={{...s.value,color:"#15803d"}}>{priceAnalysis?.difference} SAR · %{priceAnalysis?.percentage_change}</strong></div><div style={s.card}><b>TARQ kararı</b><strong style={{...s.value,color:"#15803d"}}>{priceDecision?.status || "-"}</strong><small style={s.small}>{priceDecision?.reason || ""}</small></div></div></>}</section>
      <section style={s.block}><span style={s.eyebrow}>FİYATLAR VE SATICILAR</span><h2 style={s.h2}>En ucuz teklif otomatik olarak en iyi teklif değildir.</h2><div style={s.offers}>{offers.length > 0 ? offers.map((offer)=><div key={offer.id} style={offer.authenticity_risk === "high" ? s.risky : s.offer}><span><b>{offer.is_verified ? "✓" : "⚠"} {offer.store_name}</b><small style={s.small}>Güven {offer.trust_score ?? "-"}/100 · Risk {riskLabel(offer.authenticity_risk)}</small></span><b>{formatPrice(offer.price,offer.currency)}</b></div>) : <div style={s.offer}><span><b>{trustStore?.name || "TARQ Test Store"}</b><small style={s.small}>Test Trust API kaydı · Üretim fiyatı henüz yok</small></span><b>Güven {visibleTrust ?? "-"}/100</b></div>}</div></section>
      <section style={s.decision}><div><span style={s.darkEye}>TARQ KARARI</span><div style={{...s.badge,background:priceDecision?.status === "AL" ? "#15803d" : selectedProduct.color}}>{priceDecision?.status || selectedProduct.decision}</div><p style={s.decisionText}>{priceDecision?.reason || "Fiyat avantajı, satıcı güveni ve orijinallik riski birlikte değerlendirilir."}</p></div><div style={s.reasons}><div>✓ Trust API bağlantısı aktif</div><div>✓ Price History API bağlantısı aktif</div><div>✓ Satıcı doğrulaması değerlendirildi</div><div>✓ Orijinallik riski değerlendirildi</div></div></section>
    </main><Footer /></div>
  );
 
  return (<div style={s.page}><Header /><main><section style={s.hero}><div style={s.heroInner}><div style={s.ai}>✦ TARQ Karar Zekâsı</div><h1 style={s.heroTitle}>Bugün neye ihtiyacınız var?</h1><p style={s.heroText}>Ürünü bilmek zorunda değilsiniz. TARQ fiyatı, satıcı güvenini ve riski birlikte değerlendirsin.</p><div style={s.search}><input style={s.input} value={query} onChange={(e)=>setQuery(e.target.value)} placeholder="Örn: 3000 SAR altında güvenilir bir telefon arıyorum"/><button style={s.searchBtn}>TARQ'a Sor</button></div></div></section><section style={s.section}><div style={s.container}><span style={s.eyebrow}>GERÇEK TRUST API TESTİ</span><h2 style={s.h2}>Ürün detayında canlı güven ve fiyat geçmişi verisini görün.</h2><div style={s.productGrid}>{demoProducts.map((product)=><article key={product.id} style={s.product}><div style={s.visual}>T</div><div style={s.productBody}><h3>{product.title}</h3><div style={s.price}>{product.price}</div><p style={s.meta}>Trust ve Price History verileri detay açıldığında API'den alınır.</p><button style={s.detailBtn} onClick={()=>openProduct(product)}>Detay</button></div></article>)}</div></div></section></main>{showAuth && <div style={s.overlay}><div style={s.auth}><button style={s.close} onClick={()=>setShowAuth(false)}>×</button><div style={s.authLogo}>TARQ</div><h2>{mode === "login" ? "Giriş Yap" : "Hesap Oluştur"}</h2>{mode === "register" && <input style={s.authInput} placeholder="Adınız" value={name} onChange={(e)=>setName(e.target.value)}/>}<input style={s.authInput} type="email" placeholder="E-posta" value={email} onChange={(e)=>setEmail(e.target.value)}/><input style={s.authInput} type="password" placeholder="Şifre" value={password} onChange={(e)=>setPassword(e.target.value)}/><button style={s.primary} onClick={handleSubmit}>{mode === "login" ? "Giriş Yap" : "Kayıt Ol"}</button>{message && <p>{message}</p>}<button style={s.switch} onClick={()=>{setMode(mode === "login" ? "register" : "login");setMessage("");}}>{mode === "login" ? "Yeni Hesap Oluştur" : "Girişe Dön"}</button></div></div>}<Footer /></div>);
}
 
function Footer(){return <footer style={s.footer}><b>TARQ</b><span>Akıllı alışveriş, güvenli karar.</span><small>MVP geliştirme aşaması</small></footer>;}
 
const s={
page:{minHeight:"100vh",width:"100%",margin:0,fontFamily:"Inter,Arial,sans-serif",color:"#0f172a",background:"#fff"},header:{position:"sticky",top:0,zIndex:20,background:"#07111f"},nav:{maxWidth:1240,minHeight:72,margin:"0 auto",padding:"0 28px",display:"flex",alignItems:"center",justifyContent:"space-between"},logo:{fontSize:30,fontWeight:900,letterSpacing:5,color:"#fff"},actions:{display:"flex",gap:10},icon:{width:42,height:42,border:"1px solid #475569",borderRadius:14,background:"#111e30",color:"#fff"},login:{padding:"0 18px",border:0,borderRadius:14,background:"#22d3ee",color:"#082f49",fontWeight:900},back:{border:0,background:"transparent",color:"#fff",fontWeight:800},hero:{padding:"82px 28px 92px",background:"radial-gradient(circle at top right,#155e75 0,#0f2741 32%,#07111f 70%)",color:"#fff"},heroInner:{maxWidth:940,margin:"0 auto",textAlign:"center"},ai:{display:"inline-block",padding:"8px 14px",borderRadius:999,background:"#0d3345",color:"#a5f3fc",fontWeight:900},heroTitle:{margin:"30px 0",fontSize:"clamp(42px,6vw,72px)",lineHeight:1.18,color:"#fff"},heroText:{maxWidth:760,margin:"0 auto",fontSize:19,lineHeight:1.75,color:"#e2e8f0"},search:{maxWidth:840,margin:"38px auto 18px",padding:7,display:"flex",gap:8,borderRadius:20,background:"#fff"},input:{flex:1,minWidth:0,padding:"15px 16px",border:0,outline:0,fontSize:16,color:"#0f172a"},searchBtn:{padding:"0 22px",border:0,borderRadius:14,background:"#22d3ee",color:"#082f49",fontWeight:900},section:{padding:"68px 28px",background:"#fff"},container:{maxWidth:1240,margin:"0 auto"},eyebrow:{color:"#0e7490",fontSize:12,fontWeight:900,letterSpacing:1.8},h2:{fontSize:"clamp(27px,3vw,40px)",lineHeight:1.2},productGrid:{marginTop:24,display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(245px,1fr))",gap:20},product:{overflow:"hidden",border:"1px solid #cbd5e1",borderRadius:22,background:"#fff"},visual:{height:130,display:"grid",placeItems:"center",background:"linear-gradient(135deg,#cffafe,#e0e7ff)",fontSize:38,fontWeight:900,color:"#0e7490"},productBody:{padding:20},price:{fontSize:27,fontWeight:900},meta:{color:"#334155",fontSize:14},detailBtn:{width:"100%",padding:11,border:0,borderRadius:12,background:"#0f172a",color:"#fff",fontWeight:800},detailMain:{maxWidth:1240,margin:"0 auto",padding:"38px 28px 0"},detailHero:{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(280px,1fr))",gap:38,alignItems:"center",padding:28,border:"1px solid #cbd5e1",borderRadius:28},bigVisual:{minHeight:320,display:"grid",placeItems:"center",borderRadius:24,background:"linear-gradient(135deg,#cffafe,#e0e7ff)",fontSize:80,fontWeight:900,color:"#0e7490"},detailTitle:{fontSize:"clamp(34px,4vw,54px)",lineHeight:1.12},muted:{color:"#334155",fontWeight:700},best:{marginTop:25,color:"#475569",fontWeight:700},detailPrice:{fontSize:38,fontWeight:900},actionRow:{display:"flex",gap:10,flexWrap:"wrap",marginTop:20},primary:{padding:"12px 17px",border:0,borderRadius:12,background:"#0891b2",color:"#fff",fontWeight:800},secondary:{padding:"12px 17px",border:"1px solid #94a3b8",borderRadius:12,background:"#fff",color:"#0f172a",fontWeight:800},block:{padding:"62px 0 0"},trustGrid:{marginTop:24,display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(210px,1fr))",gap:14},historyStats:{marginTop:18,display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(190px,1fr))",gap:14},card:{padding:22,border:"1px solid #cbd5e1",borderRadius:20,display:"flex",flexDirection:"column",gap:8},value:{fontSize:24},apiBadge:{alignSelf:"flex-start",padding:"4px 8px",borderRadius:999,background:"#dcfce7",color:"#166534",fontWeight:900},info:{padding:15,borderRadius:12,background:"#ecfeff",color:"#155e75"},error:{padding:15,borderRadius:12,background:"#fef2f2",color:"#b91c1c"},chartWrap:{marginTop:24,padding:20,border:"1px solid #cbd5e1",borderRadius:20,background:"#f8fafc"},chart:{display:"block",width:"100%",height:"auto",overflow:"visible"},chartDates:{display:"flex",justifyContent:"space-between",gap:12,color:"#475569",fontSize:13,fontWeight:700},offers:{marginTop:24,display:"grid",gap:12},offer:{padding:20,border:"1px solid #cbd5e1",borderRadius:18,display:"flex",justifyContent:"space-between",gap:20},risky:{padding:20,border:"1px solid #fdba74",borderRadius:18,display:"flex",justifyContent:"space-between",gap:20,background:"#fff7ed"},small:{display:"block",marginTop:6,color:"#475569"},decision:{margin:"62px 0 74px",padding:36,display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(270px,1fr))",gap:28,borderRadius:28,background:"#07111f",color:"#fff"},darkEye:{color:"#a5f3fc",fontWeight:900},badge:{display:"inline-block",margin:"12px 0",padding:"8px 18px",borderRadius:999,color:"#fff",fontSize:24,fontWeight:900},decisionText:{color:"#e2e8f0",fontSize:17,lineHeight:1.65},reasons:{display:"grid",gap:10,alignContent:"center"},overlay:{position:"fixed",inset:0,zIndex:100,display:"grid",placeItems:"center",padding:20,background:"rgba(2,6,23,.75)"},auth:{position:"relative",width:"100%",maxWidth:390,padding:30,boxSizing:"border-box",borderRadius:24,background:"#fff"},close:{position:"absolute",top:12,right:17,border:0,background:"transparent",fontSize:27},authLogo:{fontSize:27,fontWeight:900,letterSpacing:4},authInput:{width:"100%",boxSizing:"border-box",marginBottom:11,padding:13,border:"1px solid #94a3b8",borderRadius:11},switch:{width:"100%",marginTop:9,padding:11,border:0,background:"transparent",color:"#0369a1",fontWeight:800},footer:{minHeight:90,padding:20,display:"flex",flexWrap:"wrap",justifyContent:"center",alignItems:"center",gap:14,background:"#07111f",color:"#cbd5e1"}
};
export default App;
