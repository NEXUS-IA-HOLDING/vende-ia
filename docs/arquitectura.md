# VendeIA — Documento de Arquitectura (v1.2)

> Aplicación móvil con agente IA para vender artículos por foto y rastrear ofertas de compra con coste real total.
> Versión 1.2 — incorpora modelo freemium con anuncios recompensados, arquitectura local-first y rastreador de ofertas B2C/B2B.

---

## 1. Visión general

VendeIA permite a un usuario hacer una **foto de cualquier artículo** y obtener:
- Identificación del artículo (marca, modelo, estado, variante).
- Comparativa de precios de mercado en tiempo real.
- Anuncios de venta listos para publicar en múltiples plataformas (Wallapop, Milanuncios, eBay, Vinted, Facebook Marketplace…).
- En el **Modo Comprar**: rastreo de ofertas en AliExpress, Temu, eBay, Amazon y, para empresas, mayoristas (Alibaba, 1688) en distintos mercados internacionales (China, EEUU, Reino Unido…), calculando siempre el **landed cost** (envío + aranceles + IVA/aduanas + tasas) para que el cliente pague lo mínimo posible.

### Stack tecnológico

| Capa | Tecnología |
|------|-----------|
| App móvil | React Native + Expo (interfaz chat + panel lateral de historial) |
| Estado local / datos personales | SQLite en dispositivo (local-first) |
| Backend API | NestJS (Node.js) |
| IA — plan Free | Gemini Flash (~0,005 €/análisis) |
| IA — plan Pro/Enterprise | GPT-4o |
| Scraping / rastreo | Playwright (workers) |
| Cola de trabajos | Redis + BullMQ |
| Base de datos cloud (mínima) | PostgreSQL (solo cuentas, cuotas, créditos SSV, caché de precios compartido) |
| Pagos | Stripe |
| Monetización ads | AdMob con Server-Side Verification (SSV) |

---

## 2. Requisitos funcionales

| ID | Requisito |
|----|-----------|
| RF-01 | El usuario puede capturar o subir una foto de un artículo |
| RF-02 | El agente IA identifica marca, modelo, variante y estado estimado |
| RF-03 | El sistema compara precios en plataformas de venta (nueva y segunda mano) |
| RF-04 | Se muestra un rango de precio de mercado y un precio recomendado |
| RF-05 | El agente genera anuncios adaptados a cada plataforma (título, descripción, etiquetas) |
| RF-06 | El usuario puede publicar o copiar el anuncio en las plataformas objetivo |
| RF-07 | Modo Comprar: búsqueda por nombre/foto del producto deseado |
| RF-08 | Rastreo de ofertas en AliExpress, Temu, eBay y Amazon |
| RF-09 | Cálculo de landed cost: envío + aranceles + IVA/aduanas + tasas |
| RF-10 | Para empresas (B2B): búsqueda en mayoristas Alibaba/1688 y mercados internacionales |
| RF-11 | Selector de mercado objetivo (España, Andorra, China, EEUU, Reino Unido…) |
| RF-12 | Plan Free: 3 análisis/día + 1 extra por anuncio recompensado visto (ilimitado) |
| RF-13 | Anuncios intersticiales entre artículo y artículo en plan Free |
| RF-14 | Plan Pro (10 €/mes): análisis ilimitados, sin anuncios, IA superior |
| RF-15 | Plan Enterprise: multi-usuario, API, soporte prioritario, volúmenes |
| RF-16 | Historial de análisis y anuncios guardado localmente en el dispositivo |
| RF-17 | Suscripciones Stripe con altas/bajas autogestionadas |
| RF-18 | Server-Side Verification de anuncios recompensados (anti-fraude) |

---

## 3. Arquitectura

### 3.1 Diagrama general

```
┌──────────────────────────────────────────────────────────────┐
│  APP MÓVIL (React Native + Expo)                            │
│  ┌──────────────┐  ┌──────────────────────────────────────┐  │
│  │ Chat IA      │  │ SQLite local (local-first)            │  │
│  │ (interfaz)   │  │ historial, anuncios, preferencias     │  │
│  └──────┬───────┘  └──────────────────────────────────────┘  │
│         │ AdMob (intersticiales + recompensados con SSV)      │
└─────────┼────────────────────────────────────────────────────┘
          │ HTTPS (REST)
┌─────────▼────────────────────────────────────────────────────┐
│  BACKEND NestJS                                               │
│  ┌────────────┐ ┌───────────┐ ┌──────────────┐ ┌──────────┐  │
│  │ Auth/Cuotas│ │ Agente IA │ │ Generador de │ │ Landed   │  │
│  │ (planes)   │ │ (vision)  │ │ anuncios     │ │ cost      │  │
│  └────────────┘ └───────────┘ └──────────────┘ └──────────┘  │
│         │            │                │              │        │
│  ┌──────▼──────┐ ┌───▼────────┐ ┌────▼─────────┐             │
│  │ PostgreSQL │ │ Redis/     │ │ Workers      │             │
│  │ (cuentas,  │ │ BullMQ     │ │ Playwright   │             │
│  │ cuotas SSV,│ │ (colas)    │ │ (scraping)   │             │
│  │ caché)     │ │            │ │              │             │
│  └────────────┘ └────────────┘ └──────────────┘             │
│  Stripe (suscripciones) · AdMob SSV · APIs marketplaces      │
└──────────────────────────────────────────────────────────────┘
```

### 3.2 Flujo Modo Vender
1. Foto → subida al backend → agente IA (vision) identifica artículo.
2. Workers Playwright consultan precios en plataformas objetivo.
3. Se agrega un rango de mercado + precio recomendado.
4. El agente genera anuncios adaptados por plataforma.
5. El usuario publica/copia; todo queda guardado en SQLite local.

### 3.3 Flujo Modo Comprar
1. Entrada: texto o foto del producto deseado + mercado objetivo.
2. Workers rastrean AliExpress/Temu/eBay/Amazon (B2C) o Alibaba/1688 (B2B).
3. Módulo **landed cost**: envío + aranceles (según categoría arancelaria e importes de exención) + IVA/aduanas + tasas.
4. Ranking de ofertas por coste total real, no por precio de catálogo.

### 3.4 Monetización y planes

| Plan | Análisis/día | IA | Anuncios | Precio |
|------|--------------|-----|----------|--------|
| Free | 3 + recompensados ilimitados (+1 por anuncio visto) | Gemini Flash | Intersticiales + recompensados | 0 € |
| Pro | Ilimitados | GPT-4o | Sin anuncios | 10 €/mes |
| Enterprise | Ilimitados | GPT-4o + opciones | Sin anuncios | A medida |

**Anuncios recompensados**: al agotar la cuota diaria del plan Free, el usuario puede desbloquear +1 análisis viendo un anuncio, **las veces que quiera**. La recompensa se valida con **Server-Side Verification (SSV)** de AdMob: el backend recibe el callback firmado de Google y acredita el análisis — nunca se confía en el cliente. Los intersticiales se muestran entre artículo y artículo (frecuencia capada para no dañar la retención).

### 3.5 Gestión de cuotas (backend)
- PostgreSQL almacena: usuarios, plan, cuota diaria usada, créditos por SSV, estado de suscripción Stripe.
- Redis/BullMQ encola los trabajos de análisis y scraping.
- Idempotencia de callbacks SSV (event_id único) para evitar doble acreditación.

### 3.6 Seguridad
- Autenticación OAuth2 (Google/Apple) + JWT de corta duración.
- Fotos y datos personales **nunca** salen del dispositivo salvo el análisis puntual.
- Rate limiting por usuario/IP en endpoints de IA.
- Firmas verificadas en callbacks SSV y webhooks Stripe.

### 3.7 Arquitectura local-first
El usuario posee sus datos: historial, anuncios generados, favoritos y preferencias viven en **SQLite en el dispositivo**. PostgreSQL en cloud se reduce a lo estrictamente operativo:
- Cuentas y planes (autenticación, cuotas, suscripciones).
- Créditos acreditados por SSV.
- Caché compartida de precios (reduce coste de scraping entre usuarios).

**Ventajas**: coste de infraestructura mínimo, privacidad máxima (argumento de venta), funcionamiento offline del historial, y cumplimiento RGPD simplificado.

---

## 4. Rentabilidad estimada

| Concepto | Valor |
|----------|-------|
| Coste IA plan Free (Gemini Flash) | ~0,005 €/análisis |
| Ingreso rewarded ads | ~0,01 €/vista (cubre el coste IA del plan Free) |
| Ingreso intersticiales | ~0,002–0,005 €/impresión |
| Coste scraping | Compartido entre usuarios (caché PostgreSQL) |
| Break-even | ~200 DAU |
| Margen bruto | ~77 % |
| Beneficio 500 DAU | ~405 €/mes |
| Beneficio 10.000 DAU | ~9.000 €/mes |

Hipótesis: CPM AdMob medio España, 3 análisis/día por usuario Free, conversión Free→Pro ~3–5 %.

---

## 5. Decisiones abiertas

1. **APIs oficiales vs. scraping**: usar APIs oficiales de marketplaces cuando existan (eBay, Amazon PA-API) y Playwright solo como fallback.
2. **Publicación automática**: publicar en nombre del usuario requiere OAuth por plataforma (Wallapop no ofrece API pública → empezar con "copiar anuncio listo").
3. **Precios de aranceles**: fuente de datos para landed cost (bases de aduanas actualizadas por mercado).
4. **Navegación por foto en Modo Comprar**: viabilidad técnica y coste por búsqueda de imagen inversa.
5. **Idiomas iniciales**: español (España + Andorra) primero; inglés en Fase 3.

---

## 6. Hoja de ruta

Ver [roadmap.md](./roadmap.md).
