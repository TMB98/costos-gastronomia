-- ============================================================================
-- Borra la tabla `datos_app` (modelo viejo de "un solo JSON", abandonado
-- desde la migración a esquema relacional en Etapa 3). Nada del código
-- actual la usa — se confirmó al limpiar `dbLeer`/`dbGuardar` de
-- `services/supabase.js` en la sesión del 13/09/2026.
--
-- Al borrar la tabla, Postgres borra automáticamente sus políticas de RLS
-- ("usuarios logueados pueden leer/insertar/actualizar datos") y el RLS
-- habilitado sobre ella — no hace falta un DROP POLICY separado.
--
-- Aplicado a mano en producción (18/09/2026) después de un backup manual
-- fresco vía .github/workflows/backup.yml, siguiendo la regla de
-- PROJECT_CONTEXT.md: "antes de cualquier migración de esquema/datos,
-- pedirle a Tomi que baje un respaldo".
-- ============================================================================

DROP TABLE IF EXISTS public.datos_app;
