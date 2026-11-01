# VendeIA — Roadmap

## ✅ Fase 0 — Prototipo (COMPLETADA)
- [x] Prototipo interactivo de la app (interfaz chat + panel lateral de historial)
- [x] Definición de marca: **VendeIA**
- [x] Modelo freemium: Free (3 análisis/día + recompensados ilimitados) / Pro (10 €/mes) / Enterprise
- [x] Arquitectura v1.2: local-first, rewarded ads con SSV, landed cost
- [x] Análisis de rentabilidad: break-even ~200 DAU, margen ~77 %

## 🔜 Fase 1 — MVP (España + Andorra)
Objetivo: validar el flujo completo de venta con usuarios reales.
- [ ] Setup monorepo (app Expo + backend NestJS + PostgreSQL + Redis)
- [ ] Auth Google/Apple + gestión de planes y cuotas
- [ ] Foto → identificación con Gemini Flash
- [ ] Comparativa de precios: Wallapop, Milanuncios, eBay (scraping + APIs)
- [ ] Generador de anuncios adaptados por plataforma
- [ ] Stripe: suscripción Pro (10 €/mes)
- [ ] AdMob: intersticiales + recompensados con Server-Side Verification
- [ ] SQLite local-first (historial y anuncios)
- [ ] Beta cerrada en España y Andorra (TestFlight / Play Console)

## 🎯 Fase 2 — Producto (Modo Comprar)
Objetivo: convertir VendeIA en herramienta diaria de venta Y compra.
- [ ] Rastreador de ofertas: AliExpress, Temu, eBay, Amazon
- [ ] Módulo landed cost: envío + aranceles + IVA/aduanas por mercado
- [ ] Alertas de ofertas ("avísame cuando baje de X €")
- [ ] Modo empresa (B2B): mayoristas Alibaba/1688, volúmenes
- [ ] Selector de mercado (España, Andorra, China, EEUU, Reino Unido)
- [ ] Publicación asistida en más plataformas (Vinted, Facebook Marketplace)
- [ ] Métricas de conversión Free→Pro, retención D7/D30

## 🌍 Fase 3 — Crecimiento e internacionalización
- [ ] Versión en inglés y más mercados europeos
- [ ] IA superior en Pro (GPT-4o) y ajuste de costes por volumen
- [ ] Plan Enterprise: multi-usuario, API pública, panel de administración
- [ ] Programa de referidos (créditos de análisis)
- [ ] Optimización SEO/ASO: "vender segunda mano", "comparador de precios"

---

### Criterios de éxito por fase
| Fase | Métrica objetivo |
|------|------------------|
| 1 | 200 DAU (break-even), conversión Free→Pro ≥ 3 % |
| 2 | Retención D30 ≥ 15 %, uso mensual del Modo Comprar ≥ 40 % |
| 3 | 10.000 DAU, beneficio ~9.000 €/mes |
