
import React, { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";

// ============================================================
// PROTOTIPO v2 — Anuncios IA (vender + comprar)
// Demo: identificación simulada. En producción se conecta una
// API de visión (GPT-4o / Claude / Gemini) y scraping real.
// ============================================================

const EUR_USD = 1.08;
const VAT = 0.21; // IVA importación (simulado, según país destino)

const CATALOG = {
  demo1: {
    id: "demo1", nombre: "iPhone 12 128GB Negro", marca: "Apple", tipo: "Smartphone",
    estado: "Buen estado, sin arañazos en pantalla, batería 87%",
    keywords: ["iphone 12", "apple", "128gb", "smartphone segunda mano"],
    precios: { wallapop: [220, 260, 275, 240], vinted: [230, 255], ebay: [245, 210, 260, 280, 250], milanuncios: [235, 250], facebook: [225, 240, 260] },
    tendencia: [255, 250, 258, 247, 240, 245, 252, 249],
  },
  demo2: {
    id: "demo2", nombre: "Bicicleta eléctrica 48V 13S", marca: "Genérica (pack 48V 13S)", tipo: "E-bike",
    estado: "Funcional, batería de celdas recuperadas 48V 13S, autonomía ~40km",
    keywords: ["bicicleta electrica", "e-bike 48v", "bateria litio", "13s"],
    precios: { wallapop: [450, 520, 480], vinted: [], ebay: [600, 540, 575, 620], milanuncios: [470, 510], facebook: [440, 495] },
    tendencia: [520, 505, 512, 498, 490, 495, 487, 492],
  },
  demo3: {
    id: "demo3", nombre: "Nike Air Force 1 talla 40", marca: "Nike", tipo: "Zapatillas",
    estado: "Poco uso, suela en buen estado, caja original",
    keywords: ["nike air force 1", "zapatillas", "talla 40", "moda hombre"],
    precios: { wallapop: [55, 70, 60], vinted: [50, 65, 58, 62], ebay: [75, 60, 68], milanuncios: [58, 64], facebook: [52, 60, 66] },
    tendencia: [68, 66, 64, 65, 62, 61, 63, 62],
  },
};

// ---- Modo compra: rastreador de ofertas ----
const BUY_CATALOG = [
  {
    q: "bateria litio 48v 13s",
    offers: [
      { seller: "AliExpress", base: 89, ship: 12, market: "China", ioss: true, moq: 1 },
      { seller: "Temu", base: 95, ship: 0, market: "China", ioss: true, moq: 1 },
      { seller: "eBay US", base: 110, ship: 25, market: "EE.UU.", ioss: false, moq: 1 },
      { seller: "Alibaba", base: 42, ship: 35, market: "China", ioss: false, moq: 10, wholesale: true },
      { seller: "1688", base: 38, ship: 40, market: "China", ioss: false, moq: 20, wholesale: true },
    ],
  },
  {
    q: "pantalla iphone 12",
    offers: [
      { seller: "AliExpress", base: 45, ship: 8, market: "China", ioss: true, moq: 1 },
      { seller: "Temu", base: 52, ship: 0, market: "China", ioss: true, moq: 1 },
      { seller: "eBay UK", base: 60, ship: 15, market: "Reino Unido", ioss: false, moq: 1 },
      { seller: "Alibaba", base: 18, ship: 55, market: "China", ioss: false, moq: 50, wholesale: true },
    ],
  },
  {
    q: "nike air force 1",
    offers: [
      { seller: "AliExpress", base: 38, ship: 0, market: "China", ioss: true, moq: 1 },
      { seller: "Temu", base: 33, ship: 0, market: "China", ioss: true, moq: 1 },
      { seller: "eBay US", base: 72, ship: 18, market: "EE.UU.", ioss: false, moq: 1 },
      { seller: "Alibaba", base: 21, ship: 45, market: "China", ioss: false, moq: 30, wholesale: true },
    ],
  },
];

const PLANS = {
  free: { nombre: "Free", limite: 3 },
  pro: { nombre: "Pro", limite: Infinity },
  enterprise: { nombre: "Enterprise", limite: Infinity },
};

const avg = (arr) => (arr && arr.length ? Math.round(arr.reduce((a, b) => a + b, 0) / arr.length) : null);
const fmt = (v, cur) => (v == null ? "—" : cur === "USD" ? `$${(v * EUR_USD).toFixed(0)}` : `€${v}`);

function landed(o) {
  // Coste total real: base + envío + aranceles + IVA si no está cobrado (IOSS)
  const sub = o.base + o.ship;
  if (o.ioss) return { total: sub, duty: 0, vat: 0, sub };
  const duty = Math.round(sub * 0.027); // arancel medio simulado
  const vat = Math.round((sub + duty) * VAT);
  return { total: sub + duty + vat, duty, vat, sub };
}

function Sparkline({ data }) {
  const w = 160, h = 36;
  const min = Math.min(...data), max = Math.max(...data);
  const pts = data.map((v, i) => `${(i / (data.length - 1)) * w},${h - ((v - min) / (max - min || 1)) * (h - 4) - 2}`).join(" ");
  return (
    <svg width={w} height={h} className="inline-block align-middle">
      <polyline points={pts} fill="none" stroke="#7c3aed" strokeWidth="2" />
    </svg>
  );
}

function generateListings(item, precioRecom, lang) {
  const p = precioRecom, pu = Math.round(p * EUR_USD);
  const T = {
    es: {
      w: `Vendo ${item.nombre}. ${item.estado}. Precio negociable, envío disponible.`,
      e: `Condition: ${item.estado}. Ships from Andorra/Spain to EU. Returns accepted within 14 days.`,
    },
    en: {
      w: `Selling ${item.nombre}. ${item.estado}. Price negotiable, shipping available.`,
      e: `Condition: ${item.estado}. Ships from Andorra/Spain to EU. Returns accepted within 14 days.`,
    },
    fr: {
      w: `Vends ${item.nombre}. ${item.estado}. Prix négociable, livraison possible.`,
      e: `Condition: ${item.estado}. Ships from Andorra/Spain to EU. Returns accepted within 14 days.`,
    },
  }[lang];
  return {
    wallapop: {
      titulo: `${item.nombre} · ${item.estado.split(",")[0]}`,
      texto: `${item.nombre}\n\n${item.estado}.\nVendo por cambio a un modelo nuevo. Precio negociable para venta rápida.\nSe puede probar antes de comprar. Envío posible desde Andorra/España.\n\nPrecio: €${p} (negociable)`,
      precio: `€${p}`,
      nota: "Tono cercano y directo, envío opcional, ideal para venta local.",
    },
    vinted: {
      titulo: `${item.marca} · ${item.tipo}`,
      texto: `${item.nombre}\nEstado: ${item.estado}.\nArtículo auténtico de ${item.marca}. Envío en 24-48h tras el pago.\n\n${item.keywords.join(" · ")}`,
      precio: `€${p}`,
      nota: "Formato breve centrado en marca y estado, con envío siempre activo.",
    },
    ebay: {
      titulo: `${item.nombre} ${item.tipo} ${item.estado.split(",")[0]} — EU Shipping`,
      texto: `${item.nombre} by ${item.marca}.\n${T.e}\n\n${item.keywords.join(", ")}`,
      precio: `€${p} / $${pu}`,
      nota: "Bilingüe ES/EN, orientado a compradores internacionales de la UE.",
    },
    extra: {
      titulo: `${item.nombre} — ${item.estado.split(",")[0]}`,
      texto: `${T.w}\n\n${item.keywords.join(" · ")}`,
      precio: `€${p}`,
      nota: "Adaptado a Milanuncios / Amazon Renewed / Facebook Marketplace (Pro).",
    },
  };
}

const AGENT_STEPS = [
  "📸 Analizando las fotos con el agente de visión…",
  "🔍 Identificando artículo, marca y estado…",
  "🌐 Buscando precios en Wallapop, Vinted, eBay y más…",
  "📊 Comparando mercado (€/$) y tendencia…",
  "✍️ Generando anuncios por plataforma e idioma…",
];

let uid = 0;
const nid = () => ++uid;

export default function App() {
  const [view, setView] = useState("chat");
  const [mode, setMode] = useState("vender");
  const [plan, setPlan] = useState("free");
  const [usage, setUsage] = useState(0);
  const [cur, setCur] = useState(null);
  const [msgs, setMsgs] = useState([
    { id: nid(), who: "agent", text: "¡Hola Raquel! 👋 Soy tu agente IA de compra-venta.\n\n**Vender:** hazme una foto del artículo y genero título SEO, descripción y precio recomendado para Wallapop, Vinted y eBay.\n\n**Comprar:** dime qué buscas y rastreo las mejores ofertas en AliExpress, Temu, eBay, Alibaba y 1688 calculando el **coste total real** (envío + aranceles + IVA), para particulares o por mayor." },
  ]);
  const [busy, setBusy] = useState(false);
  const [step, setStep] = useState(-1);
  const [photos, setPhotos] = useState([]);
  const [manual, setManual] = useState("");
  const [cur_, setCur_] = useState("EUR");
  const [history, setHistory] = useState([]);
  const [sidebar, setSidebar] = useState(false);
  const [copied, setCopied] = useState("");
  const [lang, setLang] = useState("es");
  const [buyQuery, setBuyQuery] = useState("");
  const [buyResults, setBuyResults] = useState(null);
  const [wholesale, setWholesale] = useState(false);
  const [marketFilter, setMarketFilter] = useState("Todos");
  const [upsell, setUpsell] = useState(null);
  const [adCredits, setAdCredits] = useState(0);
  const [adDialog, setAdDialog] = useState(false);
  const [interstitial, setInterstitial] = useState(false);
  const [adTime, setAdTime] = useState(0);
  const fileRef = useRef(null);
  const galleryRef = useRef(null);
  const bottomRef = useRef(null);

  const isPro = plan !== "free";
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [msgs, step]);

  const push = (who, text) => setMsgs((m) => [...m, { id: nid(), who, text }]);
  const gate = (feature) => {
    if (isPro) return true;
    setUpsell(feature);
    return false;
  };

  // Vídeo con recompensa (rewarded ad) — simulación
  function watchAd() {
    setAdTime(5);
    const t = setInterval(() => {
      setAdTime((s) => {
        if (s <= 1) {
          clearInterval(t);
          setAdCredits((c) => c + 1);
          setAdDialog(false);
          push("agent", "🎬 ¡Recompensa desbloqueada! **+1 análisis** por ver el anuncio.");
          return 0;
        }
        return s - 1;
      });
    }, 1000);
  }

  async function analyze(itemKey, newPhotos) {
    if (busy) return;
    if (!isPro && usage >= PLANS.free.limite) {
      if (adCredits > 0) {
        setAdCredits((c) => c - 1);
        push("agent", `🎬 +1 análisis desbloqueado por ver un anuncio (te quedan ${adCredits - 1} extra${adCredits - 1 === 1 ? "" : "s"}).`);
      } else {
        setAdDialog(true);
        return;
      }
    }
    setBusy(true); setView("chat");
    if (newPhotos?.length) setPhotos(newPhotos);
    push("user", newPhotos?.length ? `📷 ${newPhotos.length} foto(s) enviada(s)` : `Identifica: ${manual || "artículo de demo"}`);
    setManual("");
    const item = CATALOG[itemKey] || CATALOG.demo1;
    for (let i = 0; i < AGENT_STEPS.length; i++) { setStep(i); await new Promise((r) => setTimeout(r, 650)); }
    setStep(-1);
    const all = Object.values(item.precios).flat().filter(Boolean);
    const media = avg(all), max = Math.max(...all);
    const recom = Math.round(media * 0.95);
    const analysis = { item, media, max, recom };
    const listings = generateListings(item, recom, lang);
    const anuncio = { id: nid(), date: new Date().toLocaleDateString("es-ES"), item, analysis, listings, photos: newPhotos || [], status: "borrador" };
    setCur(anuncio);
    setHistory((h) => [anuncio, ...h]);
    setUsage((u) => u + 1);
    push("agent", `✅ Identificado: **${item.nombre}** (${item.tipo}, ${item.marca}).\nEstado: ${item.estado}.\nMedia mercado: ${fmt(media, cur_)} · Máximo: ${fmt(max, cur_)} · **Recomendado: ${fmt(recom, cur_)}**.\n\nAnuncios listos para Wallapop, Vinted y eBay 👇`);
    setBusy(false);
    // Intersticial entre artículo y artículo (solo Free)
    if (!isPro) setInterstitial(true);
  }

  const onFiles = (e) => {
    const fs = Array.from(e.target.files || []).slice(0, isPro ? 6 : 1);
    const urls = fs.map((f) => URL.createObjectURL(f));
    if (!isPro && fs.length > 1) {
      push("user", `📷 ${fs.length} fotos enviadas`);
      push("agent", "🔒 El plan **Free** admite 1 foto por artículo. Con **Pro** puedes analizar hasta 6 fotos por artículo (detalle, defectos, serie).");
      setPhotos(urls.slice(0, 1));
      analyze("demo1", urls.slice(0, 1));
      return;
    }
    analyze(Object.keys(CATALOG)[history.length % 3], urls);
  };

  function searchBuy() {
    const key = buyQuery.toLowerCase();
    const found = BUY_CATALOG.find((c) => c.q.split(" ").some((w) => key.includes(w.split("")[0])) && (key.length > 2 ? c.q.includes(key.split(" ")[0]) : true)) || BUY_CATALOG[0];
    let offers = found.offers.filter((o) => (wholesale ? true : !o.wholesale));
    if (marketFilter !== "Todos") offers = offers.filter((o) => o.market === marketFilter);
    if (!isPro) offers = offers.filter((o) => !o.wholesale);
    const withCost = offers.map((o) => ({ ...o, cost: landed(o) })).sort((a, b) => a.cost.total - b.cost.total);
    setBuyResults({ q: found.q, offers: withCost, best: withCost[0] });
    setView("comprar");
  }

  const copy = (text, tag) => {
    try { navigator.clipboard?.writeText(text); } catch (e) {}
    setCopied(tag); setTimeout(() => setCopied(""), 1500);
  };
  const setStatus = (id, status) => {
    setHistory((h) => h.map((x) => (x.id === id ? { ...x, status } : x)));
    setCur((c) => (c && c.id === id ? { ...c, status } : c));
  };

  const a = cur?.analysis, L = cur?.listings;
  const statusColor = { borrador: "bg-slate-100 text-slate-600", publicado: "bg-amber-100 text-amber-700", vendido: "bg-green-100 text-green-700" };

  return (
    <div className="flex h-screen w-full bg-slate-100 overflow-hidden">
      {/* SIDEBAR */}
      <aside className={`${sidebar ? "flex" : "hidden"} md:flex w-72 shrink-0 flex-col border-r bg-white`}>
        <div className="p-4 border-b flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-indigo-500 flex items-center justify-center text-white text-sm font-bold">AI</div>
          <div className="flex-1">
            <div className="font-semibold text-sm">VendeIA</div>
            <div className="text-xs text-slate-500">Plan <b>{PLANS[plan].nombre}</b>{plan === "free" && ` · ${usage}/3 hoy${adCredits ? ` (+${adCredits} 🎬)` : ""}`}{isPro && " · ilimitado"}</div>
          </div>
        </div>
        <div className="p-2 border-b">
          <select value={plan} onChange={(e) => { setPlan(e.target.value); setUsage(0); }} className="w-full text-xs border rounded-md px-2 py-1.5 bg-slate-50">
            <option value="free">Free — 0€ (3 anuncios/día)</option>
            <option value="pro">Pro — 10€/mes (todo ilimitado)</option>
            <option value="enterprise">Enterprise — a medida</option>
          </select>
        </div>
        <ScrollArea className="flex-1">
          <div className="p-2 space-y-2">
            {history.length === 0 && <p className="text-xs text-slate-400 p-3">Los anuncios creados aparecerán aquí.</p>}
            {history.map((h) => (
              <div key={h.id} className={`p-3 rounded-xl border text-sm ${cur?.id === h.id ? "border-violet-500 bg-violet-50" : "border-slate-200 bg-white"}`}>
                <button className="w-full text-left" onClick={() => { setCur(h); setView("anuncios"); setSidebar(false); }}>
                  <div className="flex items-center gap-2">
                    {h.photos[0] && <img src={h.photos[0]} className="w-9 h-9 rounded-lg object-cover" />}
                    <div className="min-w-0">
                      <div className="font-medium truncate">{h.item.nombre}</div>
                      <div className="text-xs text-slate-500">{h.date} · {h.listings.wallapop.precio}</div>
                    </div>
                  </div>
                </button>
                <div className="flex items-center gap-1 mt-2">
                  {["borrador", "publicado", "vendido"].map((s) => (
                    <button key={s} onClick={() => setStatus(h.id, s)}
                      className={`text-[10px] px-2 py-0.5 rounded-full capitalize ${h.status === s ? statusColor[s] : "bg-slate-50 text-slate-400"}`}>{s}</button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
        <div className="p-3 border-t flex items-center justify-between">
          <span className="text-xs text-slate-500">{isPro ? "☁️ Sync en la nube activa" : "Moneda"}</span>
          <div className="flex gap-1">
            {["EUR", "USD"].map((c) => (
              <button key={c} onClick={() => setCur_(c)} className={`px-2.5 py-1 rounded-md text-xs font-medium ${cur_ === c ? "bg-violet-600 text-white" : "bg-slate-100 text-slate-600"}`}>{c === "EUR" ? "€" : "$"}</button>
            ))}
          </div>
        </div>
      </aside>

      {/* MAIN */}
      <main className="flex-1 flex flex-col min-w-0">
        <div className="md:hidden flex items-center justify-between px-3 py-2 bg-white border-b">
          <Button variant="ghost" size="sm" onClick={() => setSidebar(!sidebar)}>☰</Button>
          <div className="flex gap-1">
            {["vender", "comprar"].map((m) => (
              <button key={m} onClick={() => { setMode(m); setView(m === "vender" ? "chat" : "comprar"); }}
                className={`px-3 py-1 rounded-full text-xs font-medium capitalize ${mode === m ? "bg-violet-600 text-white" : "bg-slate-100 text-slate-600"}`}>{m === "vender" ? "📤 Vender" : "🛒 Comprar"}</button>
            ))}
          </div>
          <span className="w-4" />
        </div>

        {/* ---- VENDER ---- */}
        {(view === "chat" || view === "comparar" || view === "anuncios") && (
          <>
            <div className="hidden md:flex items-center gap-2 px-4 py-2 bg-white border-b">
              {["vender", "comprar"].map((m) => (
                <button key={m} onClick={() => { setMode(m); setView(m === "vender" ? "chat" : "comprar"); }}
                  className={`px-3 py-1 rounded-full text-xs font-medium ${mode === m ? "bg-violet-600 text-white" : "bg-slate-100 text-slate-600"}`}>{m === "vender" ? "📤 Vender" : "🛒 Comprar"}</button>
              ))}
            </div>

            {view === "chat" && (
              <>
                <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50">
                  {msgs.map((m) => (
                    <div key={m.id} className={`flex ${m.who === "user" ? "justify-end" : "justify-start"}`}>
                      {m.who === "agent" && <div className="w-7 h-7 rounded-full bg-gradient-to-br from-violet-500 to-indigo-500 text-white text-[10px] font-bold flex items-center justify-center mr-2 shrink-0 mt-1">AI</div>}
                      <div className={`max-w-[75%] rounded-2xl px-4 py-2.5 text-sm whitespace-pre-line ${m.who === "user" ? "bg-violet-600 text-white rounded-br-sm" : "bg-white border border-slate-200 rounded-bl-sm"}`}
                        dangerouslySetInnerHTML={{ __html: m.text.replace(/\*\*(.+?)\*\*/g, "<b>$1</b>") }} />
                    </div>
                  ))}
                  {step >= 0 && <div className="flex items-center gap-2 text-sm text-slate-500 px-2"><span className="animate-pulse">⏳</span> {AGENT_STEPS[step]}</div>}
                  {photos.length > 0 && (
                    <div className="flex justify-end gap-1">
                      {photos.map((p, i) => <img key={i} src={p} className="w-20 h-20 object-cover rounded-xl border-4 border-violet-600" />)}
                    </div>
                  )}
                  <div ref={bottomRef} />
                </div>
                <div className="p-3 bg-white border-t space-y-2">
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => fileRef.current?.click()}>📷 Cámara</Button>
                    <Button variant="outline" size="sm" onClick={() => { if (gate("Lote de fotos (hasta 6)")) galleryRef.current?.click(); }}>🖼️ Galería {isPro ? "(lote)" : ""}</Button>
                    <input ref={fileRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={onFiles} />
                    <input ref={galleryRef} type="file" accept="image/*" multiple className="hidden" onChange={onFiles} />
                    <select value={cur_} onChange={(e) => setCur_(e.target.value)} className="text-xs border rounded-md px-2 bg-slate-50"><option value="EUR">€</option><option value="USD">$</option></select>
                  </div>
                  <div className="flex gap-2">
                    <Input value={manual} onChange={(e) => setManual(e.target.value)} placeholder="…o escribe el artículo ('Kindle Paperwhite')" onKeyDown={(e) => e.key === "Enter" && analyze("demo1", null)} />
                    <Button disabled={busy} onClick={() => analyze("demo1", null)}>Analizar</Button>
                  </div>
                  {cur && (
                    <div className="grid grid-cols-2 gap-2">
                      <Button variant="secondary" size="sm" onClick={() => setView("comparar")}>📊 Comparar precios</Button>
                      <Button size="sm" onClick={() => setView("anuncios")}>📝 Ver anuncios</Button>
                    </div>
                  )}
                  <p className="text-[10px] text-slate-400 text-center">Demo: identificación simulada · En producción: API de visión real (GPT-4o/Claude/Gemini)</p>
                </div>
              </>
            )}

            {view !== "chat" && cur && (
              <div className="flex-1 overflow-y-auto bg-slate-50 p-4 space-y-4">
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="sm" onClick={() => setView("chat")}>← Chat</Button>
                  <span className="font-semibold text-sm truncate">{cur.item.nombre}</span>
                </div>

                {view === "comparar" && (
                  <Card className="p-4 space-y-4">
                    <h3 className="font-semibold">Comparativa de mercado</h3>
                    <div className="grid grid-cols-3 gap-2 text-center">
                      {[["Media", a.media], ["Máximo", a.max], ["Recomendado", a.recom]].map(([l, v]) => (
                        <div key={l} className="rounded-xl border bg-white p-3">
                          <div className="text-[10px] uppercase text-slate-500">{l}</div>
                          <div className={`font-bold ${l === "Recomendado" ? "text-violet-600 text-lg" : "text-sm"}`}>{fmt(v, cur_)}</div>
                        </div>
                      ))}
                    </div>
                    <div className="space-y-2">
                      {Object.entries(a.item.precios).map(([plat, arr]) => {
                        if (!isPro && !["wallapop", "vinted", "ebay"].includes(plat)) return null;
                        const m = avg(arr);
                        return (
                          <div key={plat} className="flex items-center gap-3 text-sm">
                            <span className="w-24 capitalize text-xs">{["wallapop", "vinted", "ebay"].includes(plat) ? plat : `🔒 ${plat}`}</span>
                            <div className="flex-1 h-6 bg-slate-100 rounded-md overflow-hidden relative">
                              {m != null && <div className="h-full bg-gradient-to-r from-violet-400 to-indigo-500" style={{ width: `${Math.round((m / a.max) * 100)}%` }} />}
                              <span className="absolute inset-0 flex items-center justify-center text-xs font-medium">{arr.length ? `${arr.length} anuncios · ${fmt(m, cur_)}` : "sin datos"}</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    <div className="flex items-center gap-2 border-t pt-3">
                      <span className="text-xs text-slate-500">Tendencia 8 semanas</span>
                      {isPro ? <Sparkline data={a.item.tendencia} /> : <button onClick={() => setUpsell("Tendencia de mercado")} className="text-xs text-violet-600 underline">🔒 Desbloquear con Pro</button>}
                    </div>
                    <div className="flex flex-wrap gap-1">{a.item.keywords.map((k) => <Badge key={k} variant="secondary">{k}</Badge>)}</div>
                  </Card>
                )}

                {view === "anuncios" && (
                  <Tabs defaultValue="wallapop">
                    <TabsList className="w-full grid grid-cols-4">
                      <TabsTrigger value="wallapop">Wallapop</TabsTrigger>
                      <TabsTrigger value="vinted">Vinted</TabsTrigger>
                      <TabsTrigger value="ebay">eBay</TabsTrigger>
                      <TabsTrigger value="extra">{isPro ? "+3 plataformas" : "🔒 Extra"}</TabsTrigger>
                    </TabsList>
                    {Object.entries(L).map(([plat, l]) => (
                      <TabsContent key={plat} value={plat}>
                        {plat === "extra" && !isPro ? (
                          <Card className="p-6 text-center space-y-2">
                            <p className="text-sm text-slate-600">Milanuncios, Amazon Renewed y Facebook Marketplace disponibles en el plan <b>Pro</b>.</p>
                            <Button onClick={() => setPlan("pro")}>Pasar a Pro — 10€/mes</Button>
                          </Card>
                        ) : (
                          <Card className="p-4 space-y-3">
                            <div className="flex items-center justify-between">
                              <Badge>Precio: {l.precio}</Badge>
                              {plat === "ebay" && (
                                <select value={lang} onChange={(e) => { setLang(e.target.value); setCur({ ...cur, listings: generateListings(cur.item, cur.analysis.recom, e.target.value) }); }} className="text-xs border rounded-md px-2 bg-slate-50">
                                  <option value="es">ES</option><option value="en">EN</option><option value="fr">FR</option>
                                </select>
                              )}
                              <Button size="sm" variant="outline" onClick={() => copy(`${l.titulo}\n\n${l.texto}`, plat)}>{copied === plat ? "✅ Copiado" : "📋 Copiar"}</Button>
                            </div>
                            <div>
                              <div className="text-xs uppercase text-slate-500 mb-1">Título SEO</div>
                              <div className="font-medium text-sm bg-violet-50 border border-violet-200 rounded-lg p-2">{l.titulo}</div>
                            </div>
                            <div>
                              <div className="text-xs uppercase text-slate-500 mb-1">Descripción</div>
                              <Textarea readOnly value={l.texto} className="text-sm h-40" />
                            </div>
                            <p className="text-xs text-slate-500">💡 {l.nota}</p>
                          </Card>
                        )}
                      </TabsContent>
                    ))}
                  </Tabs>
                )}
              </div>
            )}
          </>
        )}

        {/* ---- COMPRAR: rastreador de ofertas ---- */}
        {view === "comprar" && (
          <div className="flex-1 overflow-y-auto bg-slate-50 p-4 space-y-4">
            <Card className="p-4 space-y-3">
              <h3 className="font-semibold">🛒 Rastreador de ofertas</h3>
              <Input value={buyQuery} onChange={(e) => setBuyQuery(e.target.value)} onKeyDown={(e) => e.key === "Enter" && searchBuy()} placeholder="¿Qué quieres comprar? (p.ej. 'bateria litio 48v', 'pantalla iphone 12', 'nike air force 1')" />
              <div className="flex flex-wrap gap-2 items-center">
                <select value={marketFilter} onChange={(e) => setMarketFilter(e.target.value)} className="text-xs border rounded-md px-2 py-1.5 bg-white">
                  {["Todos", "China", "EE.UU.", "Reino Unido"].map((m) => <option key={m}>{m}</option>)}
                </select>
                <label className="flex items-center gap-1 text-xs">
                  <input type="checkbox" checked={wholesale} onChange={(e) => { if (!isPro) { setUpsell("Búsqueda mayorista (Alibaba/1688)"); return; } setWholesale(e.target.checked); }} />
                  Mayorista {isPro ? "" : "🔒"}
                </label>
                <Button size="sm" onClick={searchBuy}>Rastrear</Button>
              </div>
              <p className="text-[11px] text-slate-500">Calculamos el coste total real: producto + envío + aranceles + IVA de importación. {isPro ? "" : "El modo mayorista (B2B) requiere plan Pro."}</p>
            </Card>

            {buyResults && (
              <>
                <Card className="p-4 border-green-300 bg-green-50">
                  <div className="text-xs uppercase text-green-700 font-semibold">Mejor oferta</div>
                  <div className="flex items-center justify-between mt-1">
                    <div>
                      <div className="font-bold">{buyResults.best.seller} · {buyResults.best.market}</div>
                      <div className="text-xs text-slate-600">{fmt(buyResults.best.base, cur_)} + envío {fmt(buyResults.best.ship, cur_)}{buyResults.best.cost.duty > 0 && ` + arancel ${fmt(buyResults.best.cost.duty, cur_)} + IVA ${fmt(buyResults.best.cost.vat, cur_)}`}{buyResults.best.ioss && " · IVA ya incluido (IOSS)"}</div>
                    </div>
                    <div className="text-2xl font-bold text-green-700">{fmt(buyResults.best.cost.total, cur_)}</div>
                  </div>
                  {buyResults.best.moq > 1 && <Badge className="mt-2">Cantidad mínima: {buyResults.best.moq} uds (mayorista)</Badge>}
                </Card>
                <div className="space-y-2">
                  {buyResults.offers.map((o, i) => (
                    <Card key={i} className="p-3 flex items-center justify-between">
                      <div>
                        <div className="font-medium text-sm capitalize">{o.seller} {o.wholesale && <Badge variant="outline" className="ml-1">B2B</Badge>}</div>
                        <div className="text-xs text-slate-500">{o.market} · envío {o.ship === 0 ? "gratis" : fmt(o.ship, cur_)} · {o.ioss ? "IVA incluido (IOSS)" : `+arancel/IVA ${fmt(o.cost.duty + o.cost.vat, cur_)}`}{o.moq > 1 && ` · MOQ ${o.moq} uds`}</div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-sm">{fmt(o.cost.total, cur_)}</div>
                        <div className="text-[10px] text-slate-400">total con tasas</div>
                      </div>
                    </Card>
                  ))}
                </div>
                <Button variant="ghost" size="sm" onClick={() => setView("chat")}>← Volver al chat</Button>
              </>
            )}
            {!buyResults && (
              <div className="text-center text-sm text-slate-400 py-8">
                Escribe un producto y pulsa <b>Rastrear</b>.<br />Prueba: "bateria litio 48v" · "pantalla iphone 12" · "nike air force 1"
              </div>
            )}
          </div>
        )}

        {/* Rewarded ad: +1 análisis */}
        {adDialog && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setAdDialog(false)}>
            <Card className="max-w-sm w-full p-6 space-y-3 bg-white text-center" onClick={(e) => e.stopPropagation()}>
              <h3 className="font-bold">🎬 Análisis gratis terminados</h3>
              {adTime > 0 ? (
                <div className="rounded-xl bg-black text-white py-10 text-sm">▶ Anuncio en reproducción… {adTime}s</div>
              ) : (
                <>
                  <p className="text-sm text-slate-600">Mira un vídeo corto y desbloquea <b>+1 análisis de artículo</b>. O pasa a <b>Pro</b>: anuncios ilimitados y sin publicidad.</p>
                  <div className="flex flex-col gap-2">
                    <Button className="w-full" onClick={watchAd}>▶ Ver anuncio · +1 análisis</Button>
                    <div className="flex gap-2">
                      <Button variant="outline" className="flex-1" onClick={() => { setPlan("pro"); setAdDialog(false); push("agent", "💎 Bienvenida al plan **Pro**. Todas las funciones desbloqueadas y sin anuncios."); }}>Pro — 10€/mes (sin anuncios)</Button>
                      <Button variant="ghost" onClick={() => setAdDialog(false)}>Ahora no</Button>
                    </div>
                  </div>
                </>
              )}
            </Card>
          </div>
        )}

        {/* Intersticial entre artículo y artículo (Free) */}
        {interstitial && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
            <Card className="max-w-sm w-full p-6 space-y-3 bg-white text-center" onClick={(e) => e.stopPropagation()}>
              <div className="rounded-xl bg-slate-900 text-white py-12 text-xs text-slate-400 flex items-center justify-center">📺 Publicidad</div>
              <Button variant="outline" size="sm" onClick={() => setInterstitial(false)}>Cerrar anuncio</Button>
              <p className="text-[11px] text-slate-500">
                Los usuarios Free ven un pequeño vídeo entre artículo y artículo.{" "}
                <button className="text-violet-600 underline" onClick={() => { setPlan("pro"); setInterstitial(false); push("agent", "💎 Bienvenida al plan **Pro**. Todas las funciones desbloqueadas y sin anuncios."); }}>Pásate a Pro para eliminarlos</button>
              </p>
            </Card>
          </div>
        )}

        {/* Upsell dialog */}
        {upsell && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={() => setUpsell(null)}>
            <Card className="max-w-sm w-full p-6 space-y-3 bg-white" onClick={(e) => e.stopPropagation()}>
              <h3 className="font-bold">🔒 {upsell}</h3>
              <p className="text-sm text-slate-600">Esta función está incluida en el plan <b>Pro (10€/mes)</b>: anuncios ilimitados, lote de fotos, tendencias de mercado, plataformas extra, modo mayorista, traducciones y sincronización en la nube.</p>
              <div className="flex gap-2">
                <Button className="flex-1" onClick={() => { setPlan("pro"); setUpsell(null); push("agent", "💎 Bienvenida al plan **Pro**. Todas las funciones desbloqueadas."); }}>Pasar a Pro — 10€/mes</Button>
                <Button variant="ghost" onClick={() => setUpsell(null)}>Ahora no</Button>
              </div>
            </Card>
          </div>
        )}
      </main>
    </div>
  );
}
