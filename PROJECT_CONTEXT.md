# PROJECT_CONTEXT.md — La Nuna (gestión gastronómica)

> Handoff para continuar el desarrollo en una conversación nueva. Refleja el estado real verificado contra el código en GitHub al 13/09/2026 (sesión de corrección de discrepancias). Ante cualquier contradicción con documentación vieja, este archivo manda.
>
> ⚠️ **Nota de esta revisión:** la versión anterior de este archivo decía "265/265 tests, build limpio" y daba por terminada la cobertura de `services/datos.js` (21 funciones) y de `App.jsx` (18 tests propios). Al bajar el repo real de GitHub y correr `npm test`, eso no estaba — la suite tenía 185 tests (16 fallando) y ningún test de `datos.js` ni de `App.jsx` existía. Esas mejoras se armaron en una sesión de chat anterior pero **nunca se subieron a GitHub** (no hubo commit/push). Este archivo ahora refleja solo lo que está confirmado en el repo real.

## 1. Objetivo de la aplicación

App de gestión para un negocio gastronómico real (cliente: Juani, dueño de "La Nuna"). Cubre: carga de materias primas y sus precios, armado de recetas/platos con cálculo de costo y margen, costos fijos, pricing (precio sugerido según margen objetivo), registro de ventas por pedido, y reportería (rentabilidad, benchmarks de mercado, ranking 80/20). Multiusuario, con roles.

## 2. Stack tecnológico

- **Frontend:** React 18 + Vite 5, Tailwind CSS 3
- **Backend:** Supabase (Postgres + Auth + RLS + funciones RPC) — sin backend propio
- **Testing:** Vitest + jsdom + react-dom (montaje real de componentes, sin `@testing-library`)
- **Deploy:** GitHub Actions → GitHub Pages. Repo: `tmb98/costos-gastronomia`
- **Cliente Supabase:** `@supabase/supabase-js` v2

## 3. Arquitectura actual

Migrado desde un monolito HTML de un solo archivo a un proyecto Vite modular. Capas:
