# VendeIA 📸→💰

> **Vende y compra con una foto.** Agente IA móvil que identifica cualquier artículo por imagen, compara precios de mercado en tiempo real, genera anuncios optimizados para múltiples plataformas y rastrea las mejores ofertas de compra con coste real de landing (envío + aranceles + tasas) incluido.

[![Estado](https://img.shields.io/badge/estado-prototipo%20%E2%9C%85-brightgreen)]()
[![Plataformas](https://img.shields.io/badge/plataforma-React%20Native%20%2B%20Expo-blue)]()

---

## ✨ ¿Qué hace VendeIA?

### 🛍️ Modo Vender
1. **Foto → Identificación**: el agente IA reconoce el artículo (marca, modelo, estado, variante).
2. **Comparativa de precios**: consulta Wallapop, eBay, Milanuncios, Vinted, Amazon… y calcula un precio de mercado justo.
3. **Anuncios multiplataforma**: genera títulos, descripciones y etiquetas optimizadas para cada plataforma de venta (nueva y segunda mano), listos para publicar.

### 🛒 Modo Comprar
- **Rastreador de ofertas** en AliExpress, Temu, eBay, Amazon…
- **Coste real de landing**: envío + aranceles + IVA/aduanas calculados automáticamente, para que pagues siempre lo mínimo.
- **Modo empresa**: búsqueda en mayoristas (Alibaba, 1688) y mercados internacionales (mercado chino, estadounidense, británico…).

## 💎 Modelo freemium

| Plan | Precio | Análisis/día | Extras |
|------|--------|--------------|--------|
| **Free** | 0 € | 3 (+1 por anuncio visto, ilimitado) | Anuncios recompensados e intersticiales |
| **Pro** | 10 €/mes | Ilimitados | Sin anuncios, IA superior, todo desbloqueado |
| **Enterprise** | A medida | Ilimitados | Multi-usuario, API, soporte prioritario |

## 📈 Rentabilidad estimada

- **Break-even**: ~200 usuarios activos diarios (DAU)
- **Margen bruto**: ~77 %
- **Beneficio estimado**: 405 €/mes (500 DAU) → 9.000 €/mes (10.000 DAU)
- Los anuncios recompensados (~0,01 €/vista) cubren el coste de IA del plan Free

## 🏗️ Estructura del repositorio

```
VendeIA/
├── README.md              # Este archivo
├── docs/
│   ├── arquitectura.md   # Arquitectura técnica v1.2 (local-first)
│   └── roadmap.md        # Hoja de ruta: prototipo → MVP → producto
└── prototype/
    └── App.tsx           # Prototipo interactivo (React Native-ready)
```

## 🚀 Roadmap resumido

- ✅ **Fase 0** — Prototipo interactivo y arquitectura v1.2
- 🔜 **Fase 1** — MVP: foto → identificación → comparativa → anuncio (España)
- 🎯 **Fase 2** — Modo Comprar con landed cost, multiplataforma completa
- 🌍 **Fase 3** — Internacionalización + plan Enterprise

---

© 2026 VendeIA · Hecho con ❤️ en Andorra
