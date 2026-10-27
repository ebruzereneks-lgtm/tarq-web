
import React, { useState } from "react";

const API_URL = "http://localhost:3000";

const products = [
  { id: 1, title: "Akıllı Telefon", price: "2.899 SAR", trust: 92, risk: "Düşük", decision: "AL", color: "#15803d" },
  { id: 2, title: "Orijinal Parfüm", price: "349 SAR", trust: 81, risk: "Orta", decision: "BEKLE", color: "#b45309" },
  { id: 3, title: "Market Sepeti", price: "186 SAR", trust: 95, risk: "Düşük", decision: "AL", color: "#15803d" },
];

function App() {
  const [screen, setScreen] = useState("home");
  const [selectedProduct, setSelectedProduct] = useState(products[0]);
  const [showAuth, setShowAuth] = useState(false);
  const [mode, setMode] = useState("login");
  const [currentUser, setCurrentUser] = useState(null);
  const [query, setQuery] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");

  async function handleSubmit() {
    setMessage("İşlem yapılıyor...");
    const endpoint = mode === "login" ? `${API_URL}/api/auth/login` : `${API_URL}/api/auth/register`;
    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });
      const data = await response.json();
      if (!response.ok) return setMessage(data.message || "İşlem başarısız.");
      if (data.token) {
        localStorage.setItem("tarq_token", data.token);
        setCurrentUser(data.user || { name: "TARQ Kullanıcısı" });
        setShowAuth(false);
      }
      setMessage(data.message || "İşlem başarılı.");
    } catch {
      setMessage("Backend bağlantısı kurulamadı.");
    }
  }

  function openProduct(product) {
    setSelectedProduct(product);
    setScreen("detail");
    window.scrollTo(0, 0);
  }

  const Header = () => (
    <header style={s.header}>
      <div style={s.nav}>
        {screen === "detail" ? <button style={s.back} onClick={() => setScreen("home")}>← Ana Sayfa</button> : <div style={s.logo}>TARQ</div>}
        <div style={s.actions}>
          <button style={s.icon}>♡</button><button style={s.icon}>🔔</button>
          {currentUser ? <button style={s.login}>{currentUser.name || "Hesabım"}</button> : <button style={s.login} onClick={() => setShowAuth(true)}>Giriş</button>}
        </div>
      </div>
    </header>
  );

  if (screen === "detail") return (
    <div style={s.page}><Header />
      <main style={s.detailMain}>
        <section style={s.detailHero}>
          <div style={s.bigVisual}>T</div>
          <div><span style={s.eyebrow}>ÜRÜN DETAYI</span><h1 style={s.detailTitle}>{selectedProduct.title}</h1><p style={s.muted}>12 doğrulanmış fiyat karşılaştırıldı</p><div style={s.best}>En iyi doğrulanmış fiyat</div><div style={s.detailPrice}>{selectedProduct.price} <span style={s.drop}>-%8</span></div><div style={s.actionRow}><button style={s.primary}>🔔 Fiyatı Takip Et</button><button style={s.secondary}>♡ Favoriye Ekle</button></div></div>
        </section>

        <section style={s.block}><span style={s.eyebrow}>TARQ TRUST INTELLIGENCE</span><h2 style={s.h2}>Güven, satıcı ve orijinallik birlikte değerlendirilir.</h2><div style={s.trustGrid}><div style={s.card}><b>🛡 Güven</b><strong style={s.value}>{selectedProduct.trust}/100</strong></div><div style={s.card}><b>✓ Satıcı</b><strong style={s.value}>Doğrulanmış</strong></div><div style={s.card}><b>Orijinallik riski</b><strong style={s.value}>{selectedProduct.risk}</strong></div></div></section>

        <section style={s.block}><span style={s.eyebrow}>FİYATLAR VE SATICILAR</span><h2 style={s.h2}>En ucuz teklif otomatik olarak en iyi teklif değildir.</h2><div style={s.offers}><div style={s.offer}><span><b>Doğrulanmış Satıcı A</b><small style={s.small}>Güven 94 · Risk düşük</small></span><b>2.899 SAR</b></div><div style={s.offer}><span><b>Doğrulanmış Satıcı B</b><small style={s.small}>Güven 88 · Risk düşük</small></span><b>2.949 SAR</b></div><div style={s.risky}><span><b>⚠ Satıcı C</b><small style={s.small}>Olağandışı düşük fiyat · Ek doğrulama gerekli</small></span><b>2.799 SAR</b></div></div></section>

        <section style={s.block}><span style={s.eyebrow}>FİYAT GEÇMİŞİ</span><h2 style={s.h2}>Fiyatın yönünü görün.</h2><div style={s.chartBox}><svg viewBox="0 0 700 250" style={s.chart}><line x1="55" y1="25" x2="55" y2="205" stroke="#94a3b8" strokeWidth="2"/><line x1="55" y1="205" x2="665" y2="205" stroke="#94a3b8" strokeWidth="2"/><polyline points="65,55 165,75 265,68 365,110 465,128 565,158 650,176" fill="none" stroke="#0891b2" strokeWidth="6" strokeLinecap="round"/><circle cx="650" cy="176" r="8" fill="#15803d"/><text x="12" y="62" fill="#475569">3.300</text><text x="12" y="135" fill="#475569">3.100</text><text x="12" y="205" fill="#475569">2.899</text><text x="55" y="235" fill="#475569">6 Ay</text><text x="330" y="235" fill="#475569">3 Ay</text><text x="610" y="235" fill="#475569">Bugün</text></svg><p style={s.small}>Örnek grafik. Gerçek Price History API verisine bağlanacaktır.</p></div></section>

        <section style={s.decision}><div><span style={s.darkEye}>TARQ KARARI</span><div style={{...s.badge, background:selectedProduct.color}}>{selectedProduct.decision}</div><p style={s.decisionText}>Fiyat avantajı, satıcı güveni ve orijinallik riski birlikte değerlendirildi.</p></div><div style={s.reasons}><div>✓ Fiyat geçmişi değerlendirildi</div><div>✓ Satıcı güveni değerlendirildi</div><div>✓ Orijinallik riski değerlendirildi</div><div>✓ Fiyat anomalisi kontrol edildi</div></div></section>
      </main><Footer /></div>
  );

  return (
    <div style={s.page}><Header />
      <main>
        <section style={s.hero}><div style={s.heroInner}><div style={s.ai}>✦ TARQ Karar Zekâsı</div><h1 style={s.heroTitle}>Bugün neye ihtiyacınız var?</h1><p style={s.heroText}>Ürünü bilmek zorunda değilsiniz. İhtiyacınızı söyleyin. TARQ fiyatı, satıcı güvenini ve riski birlikte değerlendirsin.</p><div style={s.search}><input style={s.input} value={query} onChange={e=>setQuery(e.target.value)} placeholder="Örn: 3000 SAR altında güvenilir bir telefon arıyorum"/><button style={s.searchBtn}>TARQ'a Sor</button></div><div style={s.quick}><button>🎤 Konuş</button><button>📷 Tara</button><button>▦ Barkod</button><button>🖼 Görsel Ara</button></div></div></section>
        <section style={s.section}><div style={s.container}><span style={s.eyebrow}>KEŞFET</span><h2 style={s.h2}>Ne yapmak istersiniz?</h2><div style={s.categories}>{["🤖 TARQ AI","🛒 Market","📱 Elektronik","👗 Moda","🏠 Ev","💊 Sağlık"].map(x=><button key={x} style={s.category}>{x}</button>)}</div></div></section>
        {["SANA ÖZEL","GÜVENİLİR FIRSATLAR","FİYATI GERÇEKTEN DÜŞENLER","PİYASAYA GÖRE AVANTAJLI"].map((title,i)=><section key={title} style={i%2?s.soft:s.section}><div style={s.container}><span style={s.eyebrow}>{title}</span><div style={s.productGrid}>{products.map(p=><article key={`${title}-${p.id}`} style={s.product}><div style={s.visual}>T</div><div style={s.productBody}><h3>{p.title}</h3><div style={s.price}>{p.price}</div><p style={s.meta}>12 fiyat karşılaştırıldı · <b style={{color:"#15803d"}}>-%8</b></p><p style={s.meta}>🛡 Güven {p.trust}/100</p><button style={s.detailBtn} onClick={()=>openProduct(p)}>Detay</button></div></article>)}</div></div></section>)}
      </main>
      {showAuth && <div style={s.overlay}><div style={s.auth}><button style={s.close} onClick={()=>setShowAuth(false)}>×</button><div style={s.authLogo}>TARQ</div><h2>{mode==="login"?"Giriş Yap":"Hesap Oluştur"}</h2>{mode==="register"&&<input style={s.authInput} placeholder="Adınız" value={name} onChange={e=>setName(e.target.value)}/>}<input style={s.authInput} type="email" placeholder="E-posta" value={email} onChange={e=>setEmail(e.target.value)}/><input style={s.authInput} type="password" placeholder="Şifre" value={password} onChange={e=>setPassword(e.target.value)}/><button style={s.primary} onClick={handleSubmit}>{mode==="login"?"Giriş Yap":"Kayıt Ol"}</button>{message&&<p>{message}</p>}<button style={s.switch} onClick={()=>{setMode(mode==="login"?"register":"login");setMessage("");}}>{mode==="login"?"Yeni Hesap Oluştur":"Girişe Dön"}</button></div></div>}
      <Footer />
    </div>
  );
}

function Footer(){return <footer style={s.footer}><b>TARQ</b><span>Akıllı alışveriş, güvenli karar.</span><small>MVP geliştirme aşaması</small></footer>}

const s={
page:{minHeight:"100vh",width:"100%",margin:0,fontFamily:"Inter,Arial,sans-serif",color:"#0f172a",background:"#fff"},header:{position:"sticky",top:0,zIndex:20,background:"#07111f"},nav:{maxWidth:1240,minHeight:72,margin:"0 auto",padding:"0 28px",display:"flex",alignItems:"center",justifyContent:"space-between"},logo:{fontSize:30,fontWeight:900,letterSpacing:5,color:"#fff"},actions:{display:"flex",gap:10},icon:{width:42,height:42,border:"1px solid #475569",borderRadius:14,background:"#111e30",color:"#fff"},login:{padding:"0 18px",border:0,borderRadius:14,background:"#22d3ee",color:"#082f49",fontWeight:900},back:{border:0,background:"transparent",color:"#fff",fontWeight:800},hero:{padding:"82px 28px 92px",background:"radial-gradient(circle at top right,#155e75 0,#0f2741 32%,#07111f 70%)",color:"#fff"},heroInner:{maxWidth:940,margin:"0 auto",textAlign:"center"},ai:{display:"inline-block",padding:"8px 14px",borderRadius:999,background:"#0d3345",color:"#a5f3fc",fontWeight:900},heroTitle:{margin:"30px 0",fontSize:"clamp(42px,6vw,72px)",lineHeight:1.18,color:"#fff"},heroText:{maxWidth:760,margin:"0 auto",fontSize:19,lineHeight:1.75,color:"#e2e8f0"},search:{maxWidth:840,margin:"38px auto 18px",padding:7,display:"flex",gap:8,borderRadius:20,background:"#fff"},input:{flex:1,minWidth:0,padding:"15px 16px",border:0,outline:0,fontSize:16,color:"#0f172a"},searchBtn:{padding:"0 22px",border:0,borderRadius:14,background:"#22d3ee",color:"#082f49",fontWeight:900},quick:{display:"flex",flexWrap:"wrap",justifyContent:"center",gap:9},section:{padding:"68px 28px",background:"#fff"},soft:{padding:"68px 28px",background:"#f8fafc"},container:{maxWidth:1240,margin:"0 auto"},eyebrow:{color:"#0e7490",fontSize:12,fontWeight:900,letterSpacing:1.8},h2:{fontSize:"clamp(27px,3vw,40px)",lineHeight:1.2},categories:{marginTop:24,display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(145px,1fr))",gap:14},category:{minHeight:100,padding:18,border:"1px solid #cbd5e1",borderRadius:18,background:"#fff",fontWeight:800,color:"#0f172a"},productGrid:{marginTop:24,display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(245px,1fr))",gap:20},product:{overflow:"hidden",border:"1px solid #cbd5e1",borderRadius:22,background:"#fff"},visual:{height:130,display:"grid",placeItems:"center",background:"linear-gradient(135deg,#cffafe,#e0e7ff)",fontSize:38,fontWeight:900,color:"#0e7490"},productBody:{padding:20},price:{fontSize:27,fontWeight:900},meta:{color:"#334155",fontSize:14},detailBtn:{width:"100%",padding:11,border:0,borderRadius:12,background:"#0f172a",color:"#fff",fontWeight:800},detailMain:{maxWidth:1240,margin:"0 auto",padding:"38px 28px 0"},detailHero:{display:"grid",gridTemplateColumns:"minmax(260px,.8fr) minmax(300px,1.2fr)",gap:38,alignItems:"center",padding:28,border:"1px solid #cbd5e1",borderRadius:28},bigVisual:{minHeight:320,display:"grid",placeItems:"center",borderRadius:24,background:"linear-gradient(135deg,#cffafe,#e0e7ff)",fontSize:80,fontWeight:900,color:"#0e7490"},detailTitle:{fontSize:"clamp(34px,4vw,54px)",lineHeight:1.12},muted:{color:"#334155",fontWeight:700},best:{marginTop:25,color:"#475569",fontWeight:700},detailPrice:{fontSize:38,fontWeight:900},drop:{marginLeft:10,padding:"6px 10px",borderRadius:999,background:"#dcfce7",color:"#166534",fontSize:14},actionRow:{display:"flex",gap:10,flexWrap:"wrap",marginTop:20},primary:{padding:"12px 17px",border:0,borderRadius:12,background:"#0891b2",color:"#fff",fontWeight:800},secondary:{padding:"12px 17px",border:"1px solid #94a3b8",borderRadius:12,background:"#fff",color:"#0f172a",fontWeight:800},block:{padding:"62px 0 0"},trustGrid:{marginTop:24,display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(210px,1fr))",gap:14},card:{padding:22,border:"1px solid #cbd5e1",borderRadius:20,display:"flex",flexDirection:"column",gap:8},value:{fontSize:24},offers:{marginTop:24,display:"grid",gap:12},offer:{padding:20,border:"1px solid #cbd5e1",borderRadius:18,display:"flex",justifyContent:"space-between",gap:20},risky:{padding:20,border:"1px solid #fdba74",borderRadius:18,display:"flex",justifyContent:"space-between",gap:20,background:"#fff7ed"},small:{display:"block",marginTop:6,color:"#475569"},chartBox:{marginTop:24,padding:20,border:"1px solid #cbd5e1",borderRadius:22},chart:{display:"block",width:"100%",height:"auto",maxHeight:330},decision:{margin:"62px 0 74px",padding:36,display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(270px,1fr))",gap:28,borderRadius:28,background:"#07111f",color:"#fff"},darkEye:{color:"#a5f3fc",fontWeight:900},badge:{display:"inline-block",margin:"12px 0",padding:"8px 18px",borderRadius:999,color:"#fff",fontSize:24,fontWeight:900},decisionText:{color:"#e2e8f0",fontSize:17,lineHeight:1.65},reasons:{display:"grid",gap:10,alignContent:"center"},overlay:{position:"fixed",inset:0,zIndex:100,display:"grid",placeItems:"center",padding:20,background:"rgba(2,6,23,.75)"},auth:{position:"relative",width:"100%",maxWidth:390,padding:30,boxSizing:"border-box",borderRadius:24,background:"#fff"},close:{position:"absolute",top:12,right:17,border:0,background:"transparent",fontSize:27},authLogo:{fontSize:27,fontWeight:900,letterSpacing:4},authInput:{width:"100%",boxSizing:"border-box",marginBottom:11,padding:13,border:"1px solid #94a3b8",borderRadius:11},switch:{width:"100%",marginTop:9,padding:11,border:0,background:"transparent",color:"#0369a1",fontWeight:800},footer:{minHeight:90,padding:20,display:"flex",flexWrap:"wrap",justifyContent:"center",alignItems:"center",gap:14,background:"#07111f",color:"#cbd5e1"}
};

export default App;

