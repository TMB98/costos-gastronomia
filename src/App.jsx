import React, { useState, useEffect, useRef, useMemo, useCallback, useContext } from "react";
import { usePuedeEditar, usePuedeVentas, RolContext } from "./auth/usuarios.js";
import { uid } from "./lib/formato.js";
import { calcPlato, netoDe, semaforo, cfMensual } from "./lib/calculos.js";
import {
  cargarTodo,
  crearIngrediente as dbCrearIngrediente, actualizarIngrediente as dbActualizarIngrediente, borrarIngrediente as dbBorrarIngrediente,
  aplicarPreciosMasivo as dbAplicarPreciosMasivo,
  crearPlato as dbCrearPlato, actualizarPlato as dbActualizarPlato, borrarPlato as dbBorrarPlato,
  actualizarUnidadesEstimadas as dbActualizarUnidadesEstimadas, actualizarUnidadesMasivo as dbActualizarUnidadesMasivo,
  aplicarPreciosPlatosMasivo as dbAplicarPreciosPlatosMasivo,
  crearCostoFijo as dbCrearCostoFijo, actualizarCostoFijo as dbActualizarCostoFijo, borrarCostoFijo as dbBorrarCostoFijo,
  registrarPedido as dbRegistrarPedido, borrarPedido as dbBorrarPedido, deshacerBorradoPedido as dbDeshacerBorradoPedido,
  agregarCategoria as dbAgregarCategoria, actualizarBenchmark as dbActualizarBenchmark, actualizarConfiguracion as dbActualizarConfiguracion,
} from "./services/datos.js";
import {
  CAT_ING, CAT_PLATO, CAT_COSTO_DEFAULT,
  NAVY, NAVY_TEXT, NAVY_BG_SOFT, ROJO_TEXT, VERDE, VERDE_BG, AMARILLO, AMARILLO_BG, AMARILLO_TEXT,
} from "./config/constants.js";
import { Search, Beef, UtensilsCrossed, Building2, Calculator, Receipt, BarChart3, User, AlertTriangle } from "./components/icons.jsx";
import ConTooltip from "./components/ConTooltip.jsx";
import Modal from "./components/Modal.jsx";
import Boton from "./components/Boton.jsx";

import CampanaNovedades from "./shell/CampanaNovedades.jsx";
import MenuConfiguracion from "./shell/MenuConfiguracion.jsx";
import ChecklistPrimerosPasos from "./shell/ChecklistPrimerosPasos.jsx";
import BuscadorGlobal from "./shell/BuscadorGlobal.jsx";

import SeccionMaterias from "./features/materias/SeccionMaterias.jsx";
import ModalIngrediente from "./features/materias/ModalIngrediente.jsx";
import ModalPreciosMasivo from "./features/materias/ModalPreciosMasivo.jsx";
import SeccionPlatos from "./features/platos/SeccionPlatos.jsx";
import ModalPlato from "./features/platos/ModalPlato.jsx";
import SeccionFijos from "./features/costosFijos/SeccionFijos.jsx";
import ModalCostoFijo from "./features/costosFijos/ModalCostoFijo.jsx";
import SeccionVentas from "./features/ventas/SeccionVentas.jsx";
import SeccionPricing from "./features/pricing/SeccionPricing.jsx";
import SeccionReportes from "./features/reportes/SeccionReportes.jsx";

function App({ usuarioActual, usuarioId, companyId, onCerrarSesion }) {
  const puedeEditar = usePuedeEditar();
  const puedeVentas = usePuedeVentas();
  const rolActual = useContext(RolContext);
  const [data, setData] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [errorCarga, setErrorCarga] = useState(null);
  const [tab, setTab] = useState("materias");
  const navScrollRef = useRef(null);

  useEffect(() => {
    const contenedor = navScrollRef.current;
    if (!contenedor) return;
    const boton = contenedor.querySelector(`[data-tab-id="${tab}"]`);
    if (boton && boton.scrollIntoView) {
      boton.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
    }
  }, [tab]);
  const [toasts, setToasts] = useState([]);
  const [buscadorAbierto, setBuscadorAbierto] = useState(false);
  const [platoRecienCreado, setPlatoRecienCreado] = useState(null);

  useEffect(() => {
    const onKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setBuscadorAbierto((a) => !a);
      }
      if (e.key === "Escape") setBuscadorAbierto(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const [confirmar, setConfirmar] = useState(null);
  const [modal, setModal] = useState(null);

  const temaOscuroActual = !!(data && data.config && data.config.temaOscuro);
  useEffect(() => {
    document.documentElement.classList.toggle("dark", temaOscuroActual);
  }, [temaOscuroActual]);

  // Carga inicial: todo viene de las tablas relacionales, scoped a la
  // empresa del usuario logueado. Ya no hay fallback a localStorage/demo acá
  // — si algo falla, se lo decimos claro en vez de mostrar datos de mentira.
  useEffect(() => {
    if (!companyId) { setCargando(false); setErrorCarga("Tu cuenta no tiene una empresa asignada."); return; }
    (async () => {
      try {
        const datos = await cargarTodo(companyId);
        setData(datos);
      } catch (e) {
        setErrorCarga("No se pudieron cargar los datos. Probá recargar la página en un momento.");
      } finally {
        setCargando(false);
      }
    })();
  }, [companyId]);

  const toast = useCallback((msg, accion) => {
    const id = uid("t");
    setToasts((t) => [...t, { id, msg, accion }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), accion ? 6000 : 2800);
    return id;
  }, []);

  // setCfg sigue con la misma firma de siempre (así ninguna sección tiene que
  // cambiar cómo la llama) — pero ahora, según qué campo cambie, decide solo
  // a qué tabla de verdad tiene que escribir.
  const setCfg = async (k, v) => {
    setData((d) => ({ ...d, config: { ...d.config, [k]: v } })); // respuesta visual inmediata
    try {
      await dbActualizarConfiguracion(companyId, { [k]: v });
    } catch (e) {
      toast("❌ No se pudo guardar ese cambio de configuración");
    }
  };

  const mapIng = useMemo(() => (data ? Object.fromEntries(data.ingredientes.map((i) => [i.id, i])) : {}), [data]);

  const platosCalc = useMemo(() => {
    if (!data) return [];
    const cfg = data.config;
    return data.platos.map((p) => {
      const c = calcPlato(p, mapIng);
      const neto = netoDe(p.precioVenta, cfg);
      const margen = neto > 0 && !c.incompleto ? ((neto - c.costoPorcion) / neto) * 100 : null;
      return { ...p, ...c, neto, margen, sem: semaforo(margen), unidades: Number(cfg.unidades[p.id] || 0) };
    });
  }, [data, mapIng]);

  const totalCF = useMemo(
    () => (data ? data.costosFijos.reduce((a, c) => a + cfMensual(c), 0) : 0),
    [data]
  );

  const totales = useMemo(() => {
    const unidadesTot = platosCalc.reduce((a, p) => a + p.unidades, 0);
    const ingresos = platosCalc.reduce((a, p) => a + p.neto * p.unidades, 0);
    const costoIng = platosCalc.reduce((a, p) => a + p.costoPorcion * p.unidades, 0);
    return { unidadesTot, ingresos, costoIng };
  }, [platosCalc]);

  const prorrateoSinDatos = useMemo(() => {
    if (!data) return false;
    const modo = data.config.modoProrrateo;
    if (totalCF <= 0) return false;
    if (modo === "ingresos") return totales.ingresos <= 0;
    if (modo === "costoIngredientes") return totales.costoIng <= 0;
    return totales.unidadesTot <= 0;
  }, [data, totalCF, totales]);

  const cfPorPorcion = useCallback((p) => {
    if (!data) return 0;
    const modo = data.config.modoProrrateo;
    if (modo === "ingresos") return totales.ingresos > 0 ? (totalCF / totales.ingresos) * p.neto : 0;
    if (modo === "costoIngredientes") return totales.costoIng > 0 ? (totalCF / totales.costoIng) * p.costoPorcion : 0;
    return totales.unidadesTot > 0 ? totalCF / totales.unidadesTot : 0;
  }, [data, totalCF, totales]);

  if (cargando) {
    return <div className="flex h-64 items-center justify-center text-sm text-gray-500 dark:text-gray-400">Cargando datos…</div>;
  }
  if (errorCarga || !data) {
    return (
      <div className="flex h-screen flex-col items-center justify-center gap-3 px-4 text-center">
        <p className="text-sm text-gray-700 dark:text-gray-300">{errorCarga || "No se pudieron cargar los datos."}</p>
        <button onClick={() => window.location.reload()} className="text-sm font-medium text-blue-600 underline">Reintentar</button>
      </div>
    );
  }
  const cfg = data.config;
  const oscuro = temaOscuroActual;
  const setOscuro = (v) => setCfg("temaOscuro", v);

  /* ---------- Materias primas ---------- */
  const guardarIng = async (ing) => {
    if (!puedeEditar) return;
    const esNuevo = !data.ingredientes.some((x) => x.id === ing.id);
    try {
      if (esNuevo) await dbCrearIngrediente(companyId, ing);
      else await dbActualizarIngrediente(ing);
      setData((d) => ({
        ...d,
        ingredientes: esNuevo ? [...d.ingredientes, ing] : d.ingredientes.map((x) => (x.id === ing.id ? ing : x)),
      }));
      setModal(null); toast("✅ Ingrediente guardado");
    } catch (e) {
      toast(`❌ No se pudo guardar: ${e.message || "error desconocido"}`);
    }
  };

  /* ---------- Platos ---------- */
  const guardarPlato = async (p) => {
    if (!puedeEditar) return;
    const esNuevo = !data.platos.some((x) => x.id === p.id);
    try {
      if (esNuevo) await dbCrearPlato(companyId, { ...p, unidadesEstimadas: 0 });
      else await dbActualizarPlato(p);
      setData((d) => ({
        ...d,
        platos: esNuevo ? [...d.platos, p] : d.platos.map((x) => (x.id === p.id ? p : x)),
        config: { ...d.config, unidades: { ...d.config.unidades, [p.id]: d.config.unidades[p.id] ?? 0 } },
      }));
      if (esNuevo) setPlatoRecienCreado(p.id);
      setModal(null); toast("✅ Plato guardado");
    } catch (e) {
      toast(`❌ No se pudo guardar: ${e.message || "error desconocido"}`);
    }
  };

  const duplicarPlato = async (p) => {
    if (!puedeEditar) return;
    const nuevoId = uid("p");
    const limpio = {
      id: nuevoId,
      nombre: p.nombre + " (copia)",
      categoria: p.categoria,
      descripcion: p.descripcion || "",
      foto: p.foto || "",
      porciones: p.porciones,
      tiempo: p.tiempo || 0,
      notas: p.notas || "",
      precioVenta: p.precioVenta,
      items: (p.items || []).map((it) => ({ id: uid("l"), ingId: it.ingId, cantidad: it.cantidad, unidad: it.unidad })),
    };
    try {
      await dbCrearPlato(companyId, { ...limpio, unidadesEstimadas: 0 });
      setData((d) => ({
        ...d,
        platos: [...d.platos, limpio],
        config: { ...d.config, unidades: { ...d.config.unidades, [nuevoId]: 0 } },
      }));
      toast("📋 Plato duplicado — ajustá lo que necesites");
      setModal({ tipo: "plato", item: limpio });
    } catch (e) {
      toast(`❌ No se pudo duplicar: ${e.message || "error desconocido"}`);
    }
  };

  const cambiarUnidadEstimada = async (platoId, unidades) => {
    setData((d) => ({ ...d, config: { ...d.config, unidades: { ...d.config.unidades, [platoId]: unidades } } }));
    try {
      await dbActualizarUnidadesEstimadas(platoId, unidades);
    } catch (e) {
      toast("❌ No se pudo guardar la estimación de unidades");
    }
  };

  const actualizarUnidadesMasivo = async (cambios) => {
    // cambios: [{ platoId, unidades }]
    try {
      await dbActualizarUnidadesMasivo(cambios);
      setData((d) => {
        const nuevasUnidades = { ...d.config.unidades };
        cambios.forEach((c) => { nuevasUnidades[c.platoId] = c.unidades; });
        return { ...d, config: { ...d.config, unidades: nuevasUnidades } };
      });
    } catch (e) {
      toast("❌ No se pudieron actualizar las estimaciones");
    }
  };

  const aplicarPreciosPlatosMasivo = async (cambios) => {
    // cambios: [{ platoId, precioVenta }]
    try {
      await dbAplicarPreciosPlatosMasivo(cambios);
      setData((d) => ({
        ...d,
        platos: d.platos.map((p) => {
          const c = cambios.find((x) => x.platoId === p.id);
          return c ? { ...p, precioVenta: c.precioVenta } : p;
        }),
      }));
      toast(`✅ Precio actualizado en ${cambios.length} plato${cambios.length > 1 ? "s" : ""}`);
    } catch (e) {
      toast("❌ No se pudieron actualizar los precios");
    }
  };

  /* ---------- Costos fijos ---------- */
  const guardarCF = async (c) => {
    if (!puedeEditar) return;
    const esNuevo = !data.costosFijos.some((x) => x.id === c.id);
    try {
      if (esNuevo) await dbCrearCostoFijo(companyId, c);
      else await dbActualizarCostoFijo(c);
      setData((d) => ({
        ...d,
        costosFijos: esNuevo ? [...d.costosFijos, c] : d.costosFijos.map((x) => (x.id === c.id ? c : x)),
      }));
      setModal(null); toast("✅ Costo fijo guardado");
    } catch (e) {
      toast(`❌ No se pudo guardar: ${e.message || "error desconocido"}`);
    }
  };

  /* ---------- Borrado genérico (ingredientes / platos / costos fijos) ----------
     Cada sección sigue llamando borrar("ingredientes"|"platos"|"costosFijos", id,
     nombre) exactamente igual que antes — acá adentro decidimos a qué tabla real
     pega cada uno, y "Deshacer" ahora vuelve a crear la fila de verdad en la base,
     no solo en la pantalla. */
  const ACCIONES_BORRAR = {
    ingredientes: { borrar: dbBorrarIngrediente, crear: (item) => dbCrearIngrediente(companyId, item) },
    platos: { borrar: dbBorrarPlato, crear: (item) => dbCrearPlato(companyId, item) },
    costosFijos: { borrar: dbBorrarCostoFijo, crear: (item) => dbCrearCostoFijo(companyId, item) },
  };

  const borrar = async (tipo, id, nombre) => {
    if (!puedeEditar) return;
    const lista = data[tipo];
    const indice = lista.findIndex((x) => x.id === id);
    if (indice === -1) return;
    const item = lista[indice];
    try {
      await ACCIONES_BORRAR[tipo].borrar(id);
    } catch (e) {
      toast(`❌ ${e.message || "No se pudo borrar"}`);
      return;
    }
    setData((d) => ({ ...d, [tipo]: d[tipo].filter((x) => x.id !== id) }));
    toast(`🗑️ "${nombre}" eliminado`, {
      label: "Deshacer",
      onClick: async () => {
        try {
          await ACCIONES_BORRAR[tipo].crear(item);
          setData((d2) => {
            const listaActual = [...d2[tipo]];
            listaActual.splice(Math.min(indice, listaActual.length), 0, item);
            return { ...d2, [tipo]: listaActual };
          });
        } catch (e) {
          toast("❌ No se pudo deshacer — puede que ya lo hayas creado de nuevo");
        }
      },
    });
  };

  /* ---------- Ventas ---------- */
  const registrarVenta = async (fecha, medioPago, items) => {
    if (!puedeVentas) return;
    const pedidoId = uid("ped");
    const nuevasVentas = items.map((it) => ({
      id: uid("v"), pedidoId, fecha, medioPago,
      platoId: it.platoId, platoNombre: it.platoNombre, cantidad: it.cantidad,
      precioUnitario: it.precioUnitario, costoUnitario: it.costoUnitario, notas: "",
    }));
    try {
      await dbRegistrarPedido(companyId, pedidoId, fecha, medioPago, nuevasVentas);
      setData((d) => ({ ...d, ventas: [...nuevasVentas, ...(d.ventas || [])] }));
      const total = items.reduce((s, it) => s + it.cantidad * it.precioUnitario, 0);
      toast(`✅ Venta registrada — ${items.length} ítem${items.length > 1 ? "s" : ""}, total $${total.toLocaleString("es-AR")}`);
    } catch (e) {
      toast(`❌ No se pudo registrar la venta: ${e.message || "error desconocido"}`);
    }
  };

  const borrarPedidoVenta = async (pedidoId, motivo) => {
    if (!puedeVentas) return;
    const itemsBorrados = (data.ventas || []).filter((v) => (v.pedidoId || v.id) === pedidoId);
    if (itemsBorrados.length === 0) return;
    const total = itemsBorrados.reduce((s, v) => s + v.cantidad * v.precioUnitario, 0);
    let correccionId;
    try {
      correccionId = await dbBorrarPedido(pedidoId, motivo, usuarioId);
    } catch (e) {
      toast(`❌ No se pudo borrar la venta: ${e.message || "error desconocido"}`);
      return;
    }
    const registro = {
      id: correccionId,
      fecha: itemsBorrados[0].fecha,
      hora: new Date().toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit", hour12: false }),
      usuario: usuarioActual || "—",
      pedidoId,
      motivo: motivo?.trim() || "",
      items: itemsBorrados.map((v) => ({ platoNombre: v.platoNombre, cantidad: v.cantidad, precioUnitario: v.precioUnitario })),
      total,
    };
    setData((d) => ({
      ...d,
      ventas: (d.ventas || []).filter((v) => (v.pedidoId || v.id) !== pedidoId),
      correccionesVentas: [registro, ...(d.correccionesVentas || [])],
    }));
    toast(`🗑️ Venta eliminada ($${total.toLocaleString("es-AR")})`, {
      label: "Deshacer",
      onClick: async () => {
        try {
          await dbDeshacerBorradoPedido(correccionId);
          setData((d2) => ({
            ...d2,
            ventas: [...itemsBorrados, ...(d2.ventas || [])],
            correccionesVentas: (d2.correccionesVentas || []).filter((c) => c.id !== correccionId),
          }));
        } catch (e) {
          toast("❌ No se pudo deshacer");
        }
      },
    });
  };

  /* ---------- Categorías ---------- */
  const agregarCategoriaIngrediente = async (nombre) => {
    const nuevas = [...(cfg.categoriasIngredientes || CAT_ING), nombre];
    setData((d) => ({ ...d, config: { ...d.config, categoriasIngredientes: nuevas } }));
    try { await dbAgregarCategoria(companyId, "ingrediente", nombre); } catch (e) { toast("❌ No se pudo guardar la categoría"); }
  };
  const agregarCategoriaPlato = async (nombre) => {
    const nuevas = [...(cfg.categoriasPlatos || CAT_PLATO), nombre];
    setData((d) => ({ ...d, config: { ...d.config, categoriasPlatos: nuevas } }));
    try { await dbAgregarCategoria(companyId, "plato", nombre); } catch (e) { toast("❌ No se pudo guardar la categoría"); }
  };
  const agregarCategoriaCosto = async (nombre) => {
    const nuevas = [...(cfg.categoriasCostos || CAT_COSTO_DEFAULT), nombre];
    setData((d) => ({ ...d, config: { ...d.config, categoriasCostos: nuevas } }));
    try { await dbAgregarCategoria(companyId, "costo", nombre); } catch (e) { toast("❌ No se pudo guardar la categoría"); }
  };

  /* ---------- Benchmarks (Reportería) ---------- */
  const actualizarBenchmark = async (id, campo, valor) => {
    setData((d) => ({
      ...d,
      config: { ...d.config, benchmarks: d.config.benchmarks.map((b) => (b.id === id ? { ...b, [campo]: Number(valor) } : b)) },
    }));
    try {
      await dbActualizarBenchmark(id, { [campo]: Number(valor) });
    } catch (e) {
      toast("❌ No se pudo guardar el benchmark");
    }
  };

  /* ---------- Actualización masiva de precios de ingredientes ---------- */
  const aplicarPreciosMasivo = async (valores, fecha) => {
    const cambios = Object.entries(valores)
      .filter(([id, v]) => data.ingredientes.some((i) => i.id === id) && v !== undefined)
      .map(([ingredienteId, v]) => ({ ingredienteId, precio: v === "" ? null : Number(v) }))
      .filter((c) => c.precio != null); // el RPC actualiza precio; los que se vacían del todo se dejan para edición manual
    try {
      if (cambios.length) await dbAplicarPreciosMasivo(cambios, fecha);
      setData((d) => ({
        ...d,
        ingredientes: d.ingredientes.map((i) => {
          if (valores[i.id] === undefined) return i;
          const nuevo = valores[i.id] === "" ? null : Number(valores[i.id]);
          if (nuevo === i.precio) return i;
          const hist = (i.historial || []).filter((h) => h.fecha !== fecha);
          if (nuevo != null) hist.push({ fecha, precio: nuevo });
          hist.sort((a, b) => a.fecha.localeCompare(b.fecha));
          return { ...i, precio: nuevo, fechaPrecio: nuevo == null ? i.fechaPrecio : fecha, historial: hist };
        }),
      }));
      setModal(null); toast("✅ Precios actualizados");
    } catch (e) {
      toast(`❌ No se pudieron actualizar los precios: ${e.message || "error desconocido"}`);
    }
  };

  const TABS = [
    { id: "materias", label: "Materias primas", icon: Beef },
    { id: "platos", label: "Platos", icon: UtensilsCrossed },
    { id: "fijos", label: "Costos fijos", icon: Building2 },
    { id: "pricing", label: "Pricing", icon: Calculator },
    { id: "sep", separador: true },
    { id: "ventas", label: "Ventas", icon: Receipt },
    { id: "reportes", label: "Reportería", icon: BarChart3 },
  ];

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
      <header style={{ backgroundColor: NAVY }} className="relative px-5 py-3.5 text-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3">
          <h1 className="flex items-baseline gap-2 leading-none">
            <span className="text-lg font-extrabold tracking-tight sm:text-xl">La Nuna</span>
            <span className="hidden text-xs font-medium text-blue-200 sm:inline">Gestión gastronómica</span>
          </h1>
          <div className="flex items-center gap-1">
            <ConTooltip texto="Buscar (Ctrl+K)">
              <button
                onClick={() => setBuscadorAbierto(true)}
                className="rounded-full p-2 text-white hover:bg-white hover:bg-opacity-10"
                title="Buscar (Ctrl+K)"
              >
                <Search size={17} />
              </button>
            </ConTooltip>
            <CampanaNovedades cfg={cfg} setCfg={setCfg} />
            <MenuConfiguracion data={data} setData={setData} toast={toast} setConfirmar={setConfirmar} oscuro={oscuro} setOscuro={setOscuro} usuarioActual={usuarioActual} onCerrarSesion={onCerrarSesion} />
          </div>
        </div>
      </header>

      <nav className="relative border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm">
        <div className="pointer-events-none absolute bottom-0 left-0 top-0 z-10 w-6 bg-gradient-to-r from-white to-transparent dark:from-gray-800" />
        <div className="pointer-events-none absolute bottom-0 right-0 top-0 z-10 w-6 bg-gradient-to-l from-white to-transparent dark:from-gray-800" />
        <div ref={navScrollRef} className="mx-auto flex max-w-7xl gap-1 overflow-x-auto px-3">
          {TABS.map((t) => {
            if (t.separador) {
              return <div key={t.id} className="mx-1 my-2 w-px shrink-0 self-stretch bg-gray-300" />;
            }
            const activo = tab === t.id;
            const Icon = t.icon;
            return (
              <button key={t.id} data-tab-id={t.id} onClick={() => setTab(t.id)}
                className={`flex shrink-0 items-center gap-2 border-b-2 px-4 py-3 text-sm font-medium transition-colors ${activo ? "" : "border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:text-gray-100"}`}
                style={activo ? { borderColor: NAVY_TEXT, color: NAVY_TEXT } : {}}>
                <Icon size={16} /> {t.label}
              </button>
            );
          })}
        </div>
      </nav>

      <div className="border-b border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
        <div className="mx-auto flex max-w-7xl flex-wrap gap-2 px-4 py-2 sm:px-6">
          <button
            onClick={() => setTab("materias")}
            className="flex items-center gap-1.5 rounded-md bg-gray-50 px-2.5 py-1 text-xs hover:bg-gray-100 dark:bg-gray-700/50 dark:hover:bg-gray-700"
            title="Ir a Materias primas"
          >
            <Beef size={13} className="text-gray-400" />
            <b className="text-gray-700 dark:text-gray-200">{data.ingredientes.length}</b>
            <span className="text-gray-500 dark:text-gray-400">materias primas</span>
            {data.ingredientes.some((i) => i.precio == null) && (
              <span className="font-medium" style={{ color: ROJO_TEXT }}>
                · {data.ingredientes.filter((i) => i.precio == null).length} sin precio
              </span>
            )}
          </button>
          <button
            onClick={() => setTab("platos")}
            className="flex items-center gap-1.5 rounded-md bg-gray-50 px-2.5 py-1 text-xs hover:bg-gray-100 dark:bg-gray-700/50 dark:hover:bg-gray-700"
            title="Ir a Platos"
          >
            <UtensilsCrossed size={13} className="text-gray-400" />
            <b className="text-gray-700 dark:text-gray-200">{data.platos.length}</b>
            <span className="text-gray-500 dark:text-gray-400">productos</span>
          </button>
          <span className="flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium" style={{ backgroundColor: VERDE_BG, color: VERDE }}>
            <span className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ backgroundColor: VERDE }} />
            Guardado en la nube
          </span>
          {usuarioActual && (
            <span className="flex items-center gap-1.5 rounded-md bg-gray-50 px-2.5 py-1 text-xs dark:bg-gray-700/50">
              <User size={13} className="text-gray-400" />
              <span className="text-gray-700 dark:text-gray-200">{usuarioActual}</span>
              <span
                className="rounded-full px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide"
                style={
                  rolActual === "admin"
                    ? { backgroundColor: NAVY_BG_SOFT, color: NAVY_TEXT }
                    : { backgroundColor: "#f1f5f9", color: "#64748b" }
                }
              >
                {rolActual}
              </span>
            </span>
          )}
        </div>
      </div>

      <main className="mx-auto max-w-7xl space-y-5 p-4 sm:p-6">
        <ChecklistPrimerosPasos data={data} cfg={cfg} setCfg={setCfg} setTab={setTab} />
        {tab === "materias" && (
          <SeccionMaterias
            data={data} setModal={setModal} borrar={borrar} cfg={cfg} setCfg={setCfg}
          />
        )}
        {tab === "platos" && (
          <SeccionPlatos platosCalc={platosCalc} cfg={cfg} setCfg={setCfg} setModal={setModal} borrar={borrar} duplicarPlato={duplicarPlato} />
        )}
        {tab === "fijos" && (
          <SeccionFijos data={data} totalCF={totalCF} setModal={setModal} borrar={borrar} cfg={cfg} setCfg={setCfg} />
        )}
        {tab === "ventas" && (
          <SeccionVentas data={data} platosCalc={platosCalc} borrar={borrar} borrarPedidoVenta={borrarPedidoVenta}
            onRegistrarVenta={registrarVenta} onActualizarUnidadesMasivo={actualizarUnidadesMasivo}
            toast={toast} cfg={cfg} setCfg={setCfg}
            setModal={setModal} platoRecienCreado={platoRecienCreado} limpiarPlatoRecienCreado={() => setPlatoRecienCreado(null)} totalCF={totalCF} />
        )}
        {tab === "pricing" && (
          <SeccionPricing
            data={data} cfg={cfg} platosCalc={platosCalc} totalCF={totalCF} totales={totales}
            cfPorPorcion={cfPorPorcion} prorrateoSinDatos={prorrateoSinDatos} setCfg={setCfg}
            onCambiarUnidadEstimada={cambiarUnidadEstimada} onAplicarPreciosPlatosMasivo={aplicarPreciosPlatosMasivo}
            toast={toast} setConfirmar={setConfirmar}
          />
        )}
        {tab === "reportes" && (
          <SeccionReportes
            data={data} cfg={cfg} setCfg={setCfg} platosCalc={platosCalc} totalCF={totalCF} totales={totales}
            cfPorPorcion={cfPorPorcion} onActualizarBenchmark={actualizarBenchmark} mapIng={mapIng}
          />
        )}
      </main>

      {modal?.tipo === "ing" && (
        <ModalIngrediente key={modal.item?.id || "nuevo"} inicial={modal.item} categorias={cfg.categoriasIngredientes || CAT_ING} existentes={data.ingredientes}
          onAgregarCategoria={agregarCategoriaIngrediente} onGuardar={guardarIng} onClose={() => setModal(null)} onVerExistente={(ing) => setModal({ tipo: "ing", item: ing })} />
      )}
      {modal?.tipo === "plato" && (
        <ModalPlato inicial={modal.item} ingredientes={data.ingredientes} config={cfg}
          onAgregarCategoria={agregarCategoriaPlato} onGuardar={guardarPlato} onClose={() => setModal(null)} />
      )}
      {modal?.tipo === "cf" && (
        <ModalCostoFijo inicial={modal.item} categorias={cfg.categoriasCostos}
          onAgregarCategoria={agregarCategoriaCosto} onGuardar={guardarCF} onClose={() => setModal(null)} />
      )}
      {modal?.tipo === "masivo" && (
        <ModalPreciosMasivo ingredientes={data.ingredientes} categorias={cfg.categoriasIngredientes || CAT_ING} onAplicar={aplicarPreciosMasivo} onClose={() => setModal(null)} />
      )}

      {confirmar && (
        <Modal title="Confirmar acción" onClose={() => setConfirmar(null)}>
          <p className="flex items-start gap-2 text-sm text-gray-700 dark:text-gray-300">
            <AlertTriangle size={18} style={{ color: AMARILLO_TEXT }} className="mt-0.5 shrink-0" />
            {confirmar.msg}
          </p>
          <div className="mt-5 flex justify-end gap-2">
            <Boton variant="ghost" onClick={() => setConfirmar(null)}>Cancelar</Boton>
            <Boton variant="danger" onClick={() => { confirmar.accion(); setConfirmar(null); }}>Sí, continuar</Boton>
          </div>
        </Modal>
      )}

      <BuscadorGlobal
        abierto={buscadorAbierto}
        setAbierto={setBuscadorAbierto}
        data={data}
        platosCalc={platosCalc}
        setTab={setTab}
        setModal={setModal}
      />

      <div className="fixed bottom-4 right-4 z-50 space-y-2">
        {toasts.map((t) => (
          <div key={t.id} className="animate-toast-in flex items-center gap-3 rounded-lg px-4 py-2.5 text-sm font-medium text-white shadow-lg" style={{ backgroundColor: NAVY }}>
            <span>{t.msg}</span>
            {t.accion && (
              <button
                onClick={() => {
                  t.accion.onClick();
                  setToasts((ts) => ts.filter((x) => x.id !== t.id));
                }}
                className="shrink-0 rounded border border-white border-opacity-40 px-2 py-0.5 text-xs font-semibold hover:bg-white hover:bg-opacity-20"
              >
                {t.accion.label}
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default App;
