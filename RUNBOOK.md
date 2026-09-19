# Runbook de incidentes — La Nuna

Guía práctica para seguir bajo presión, no un manual corporativo. Cada
sección es: "pasó esto → hacé esto".

---

---

## ¿Cómo me entero si la app se cae?

Hay un monitor automático (UptimeRobot, plan gratis) que revisa la URL de
producción cada 5 minutos y te manda un mail apenas deja de responder — no
hace falta que vos ni Juani estén mirando. Si te llega ese mail, empezá por
la sección de abajo.

## La aplicación no carga

1. Probá en una ventana de incógnito (descarta problema de caché del navegador).
2. Fijate si es solo vos: probá desde el celular con datos móviles, no wifi.
3. Entrá a la pestaña **Actions** del repo en GitHub. Si la última corrida
   está en rojo, el problema es que el último cambio subido rompió el build
   — ver "Un deployment rompió producción" más abajo.
4. Si Actions está todo verde pero la página no carga igual, puede ser
   GitHub Pages en sí: revisá [githubstatus.com](https://www.githubstatus.com).

## Los usuarios no pueden iniciar sesión

1. Confirmá que no es una contraseña olvidada de verdad (lo más común).
2. Entrá a [status.supabase.com](https://status.supabase.com) — si Supabase
   Auth está caído, no hay nada para hacer del lado nuestro, solo esperar.
3. Si dice "no tenés acceso a ninguna empresa" (no es un error de
   contraseña): revisar en Supabase, tabla `memberships`, que esa persona
   tenga una fila con su `user_id` y `company_id` correctos.

## Supabase no responde

1. Revisá [status.supabase.com](https://status.supabase.com).
2. **Ojo con esto, es propio del plan Free**: Supabase pausa automáticamente
   los proyectos gratuitos después de aproximadamente una semana sin
   actividad. Si el local estuvo cerrado varios días (vacaciones, etc.) y
   al volver la app no anda, lo más probable es que el proyecto esté
   pausado — se reactiva con un click desde el dashboard de Supabase
   (Project → aparece un botón "Restore project" o similar). Tarda un par
   de minutos en volver a estar activo.

## El local perdió internet

Se decidió explícitamente (ver `PROJECT_CONTEXT.md`, Etapa 5) NO tener
ventas offline — la app avisa que algo no se guardó, no lo esconde, pero no
guarda nada sin conexión. Qué hacer:

- **Lo que ya estaba cargado en pantalla sigue viéndose** (ingredientes,
  platos, precios) — no se pierde, está en la memoria del navegador.
- **Nada nuevo se puede guardar** hasta que vuelva la señal — intentar
  guardar algo va a mostrar un error, no un falso éxito.
- **Para una venta que hay que registrar sí o sí en el momento**: anotarla
  en papel (plato, cantidad, medio de pago, hora) y cargarla en la app en
  cuanto vuelva la conexión. No hay cola automática de sincronización
  todavía (decisión explícita, ver Etapa 5 del `PROJECT_CONTEXT.md`).

## Hay operaciones pendientes de sincronización

No aplica hoy — no existe una cola de operaciones offline (se evaluó y se
decidió no construirla por ahora, ver punto anterior). Si en el futuro se
agrega venta offline con sincronización, esta sección se reescribe entonces.

## Un deployment rompió producción

1. Entrá a la pestaña **Actions** del repo.
2. Buscá la última corrida que salió **verde** ANTES de la que rompió todo.
3. Entrá a esa corrida vieja → arriba a la derecha, botón **"Re-run all jobs"**.
4. Eso vuelve a compilar y publicar exactamente esa versión vieja que
   sabías que andaba bien — en un par de minutos producción vuelve a la
   normalidad.
5. Con más calma, después: identificar qué commit rompió las cosas y
   corregirlo antes de volver a subirlo.

_Nota: esto revierte el CÓDIGO. Si el problema vino de un cambio de base de
datos (una migración), revertir el código no revierte la base — ver el
punto de Migraciones en `PROJECT_CONTEXT.md`._

## Se eliminaron/corrompieron datos

1. Andá a la pestaña **Actions** → workflow **"Backup diario de la base de
   datos"** → elegí la corrida del día más reciente ANTES de que se haya
   corrompido algo.
2. Descargá el archivo (aparece como "artifact" al final de esa corrida —
   mismo gesto que ya usaste hoy para bajar los zips que te fui pasando).
3. **Restaurarlo requiere una herramienta de línea de comandos
   (`pg_restore`) con acceso a internet sin restricciones** — esto NO se
   puede hacer desde una sesión de chat de Claude.ai (el entorno donde
   trabajo tiene el acceso a internet limitado a un puñado de sitios, por
   seguridad, y no incluye la base de Supabase). Se puede hacer:
   - Con **Claude Code** (la versión de Claude que corre en tu compu, no en
     el navegador) — ese sí tiene acceso de red completo y puede correr el
     restore por vos, dándole el archivo y la contraseña de la base.
   - O alguien con `pg_restore` instalado (en Mac: `brew install libpq`)
     corriendo: `pg_restore --clean --if-exists --no-owner --no-privileges
     --dbname="<SUPABASE_DB_URL>" archivo.dump`
4. **Este procedimiento con `pg_restore` (el mecanismo de arriba, con el
   archivo `.dump`) todavía no se probó de punta a punta** — requiere
   acceso de red completo, que recién vas a tener con Claude Code.
   **Lo que SÍ está probado y confirmado (16/09/2026):** que los datos de
   negocio SE PUEDEN recuperar de verdad. Se hizo la prueba completa contra
   el proyecto de desarrollo (`la-nuna-desarrollo`, ya existe, no hace
   falta crearlo) usando un método alternativo — un dump en SQL de texto
   plano pegado en el SQL Editor de Supabase, sin pasar por `pg_restore` —
   y las 13 tablas de negocio (536 filas) se restauraron sin errores.
   Cuando tengas Claude Code, pedile que haga la prueba "real" con
   `pg_restore` contra el mismo proyecto de desarrollo antes de confiar en
   ella para una emergencia real contra producción.

## Una credencial fue expuesta

1. **Clave anon de Supabase** (la que usa la app en el navegador, ya de por
   sí pública/semi-pública): Supabase Dashboard → Settings → API →
   regenerar. Después actualizar el secret `VITE_SUPABASE_ANON_KEY` en
   GitHub (Settings → Secrets and variables → Actions) y volver a correr el
   deploy.
2. **Contraseña de la base de datos** (la que usa el backup automático,
   mucho más sensible — da acceso total): Supabase Dashboard → Settings →
   Database → Reset database password. Actualizar el secret
   `SUPABASE_DB_URL` en GitHub con la nueva contraseña.
3. Cualquier otra credencial (contraseña de un usuario, por ejemplo):
   cambiarla desde el panel de Supabase Auth o pedirle a esa persona que la
   cambie desde el menú ⚙️ de la app.

---

*Última actualización: 19/09/2026, con la Etapa 5 (Operación productiva)
cerrada al 100% — ver `PROJECT_CONTEXT.md`.*
