# Cómo trabajamos con Claude Code + Git + GitHub

Guía práctica, no un curso de Git. Si algo no está acá, preguntale a Claude Code directamente.

## 1. Cómo empezar una tarea nueva

Le describís a Claude Code qué querés (una feature, un fix, un ajuste). Claude identifica qué archivos hay que tocar, crea o usa una branch de trabajo, y hace los cambios ahí — nunca directo en `main`.

## 2. Cuándo se crea una branch nueva

Siempre que el cambio sea algo nuevo. Nombres simples:

- `feature/nombre-corto` — algo nuevo.
- `fix/nombre-corto` — corregir un bug.
- `chore/nombre-corto` — configuración, documentación, mantenimiento.

## 3. Cómo se trabaja con Claude Code

Claude lee el código relevante, modifica los archivos, corre `npm run validate` (tests + build), y te muestra un resumen antes de commitear. Vos no tocás archivos a mano ni subís nada por la web de GitHub — eso es justo lo que estamos dejando atrás.

## 4. Cómo ver qué cambió

Claude te muestra, en texto, la lista de archivos modificados y un resumen de qué cambió en cada uno (no línea por línea, salvo que lo pidas). Si preferís verlo con tus propios ojos: en GitHub, abrí el Pull Request → pestaña "Files changed".

## 5. Cómo saber si los tests pasaron

Claude corre `npm run validate` y te dice el resultado: cuántos tests pasaron/fallaron y si el build compiló. Si dice "270/270 ✅" y "build OK ✅", está validado. Si algo falla, te lo muestra y no lo da por terminado.

## 6. Qué es un commit

Es un "punto de guardado" con una descripción de qué cambió. Queda para siempre en el historial — por eso Claude hace commits chicos y con mensajes claros (`feat: ...`, `fix: ...`, `docs: ...`), nunca uno gigante con todo mezclado.

## 7. Qué es un push

Es subir esos commits desde la branch local a GitHub. Sin push, los cambios quedan solo en la sesión de Claude Code y se pierden si se cierra. Claude hace push a la branch de trabajo, nunca a `main`.

## 8. Qué es un Pull Request (PR)

Es un "pedido para incorporar estos cambios a `main`". GitHub muestra el diff completo y corre automáticamente los checks (tests + build).

**¿Cuándo sí abrir PR?** Cuando el cambio toca código funcional (`src/`, `supabase/migrations/`) o querés que el check de CI lo confirme antes de tocar `main`. Un typo o una corrección menor de texto en la documentación puede ir directo si vos lo decidís puntualmente — pero como regla general, Claude va a proponer PR salvo que el cambio sea trivial y lo apruebes vos mismo en el momento.

## 9. Cuándo aprobar/mergear

Con el PR abierto y el check de CI en verde: mirás el resumen que te dio Claude, mirás el diff en GitHub si querés, y decidís. El merge a `main` lo hacés vos, o Claude solo con tu confirmación explícita en esa conversación puntual — nunca por default.

## 10. Qué hacer si algo sale mal

- **Tests o build rotos**: Claude no lo presenta como terminado. Si ya está en un PR y el check salió rojo, no lo mergees — pedile que lo arregle en la misma branch.
- **Algo se rompió en producción después de un merge**: ver `RUNBOOK.md`, sección "Un deployment rompió producción".
- **Te arrepentís de una branch/PR**: se puede cerrar el PR sin mergear, la branch queda ahí sin afectar `main`.

## Modelo de branches (simple, no Git Flow)

- `main` → producción estable. Nadie trabaja directo ahí.
- `feature/...` → algo nuevo.
- `fix/...` → corrección de un bug.
- `chore/...` → configuración, documentación, tareas técnicas sin impacto funcional.

## Convención de commits

`feat:` nueva funcionalidad · `fix:` corrección · `refactor:` cambio técnico sin cambiar comportamiento · `chore:` mantenimiento/configuración · `docs:` documentación · `test:` tests.

## Validación antes de cerrar cualquier cambio

`npm run validate` (ya existe, corre `npm test && npm run build`). Si en el futuro se agrega lint, se suma a este mismo comando — no se agregan pasos manuales nuevos.

## CI/CD (ya configurado, no hay que tocarlo)

`.github/workflows/deploy.yml` corre automáticamente en cada push y cada PR contra `main`: instala dependencias, corre tests, compila. Si el PR está en verde, mergear a `main` publica sola la producción en GitHub Pages — no hay ningún paso manual de deploy.

## Flujo recomendado para una feature nueva (plantilla repetible)

1. Describir la feature en una frase.
2. Identificar qué módulo(s) toca (Claude lo hace, ver `ARCHITECTURE.md`).
3. Crear branch (`feature/...`, `fix/...` o `chore/...`).
4. Claude modifica el código.
5. Agregar/actualizar tests si corresponde.
6. `npm run validate`.
7. Revisar el resumen del diff que da Claude.
8. Commit.
9. Push a la branch.
10. PR si corresponde según el criterio del punto 8.
11. Merge después de tu aprobación explícita.

## ⚠️ Pendientes manuales en GitHub (no se pueden hacer desde acá)

- **Confirmar protección de la rama `main`**: Settings del repo → Branches → regla sobre `main` → tiene que tener tildado "Require a pull request before merging" y "Require status checks to pass" (el check `build`). Si ya está así, no hay que hacer nada.
- **Restringir el acceso de la Claude GitHub App**: hoy puede tener acceso a más repositorios de los necesarios. GitHub → Settings de tu cuenta → Applications → la app de Claude → Configure → elegir "Only select repositories" y dejar únicamente `costos-gastronomia`.
