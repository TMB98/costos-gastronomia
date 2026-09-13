import { describe, it, expect, vi, beforeEach } from "vitest";

// services/supabase.js crea el cliente real de Supabase al importarse
// (createClient de @supabase/supabase-js). Para testear las funciones que
// lo envuelven (login, sesión, perfil) sin pegarle a la red, mockeamos el
// cliente en el límite exacto donde se crea.
const auth = {
  signInWithPassword: vi.fn(),
  signOut: vi.fn(),
  updateUser: vi.fn(),
  getSession: vi.fn(),
  onAuthStateChange: vi.fn(),
};
const fromMock = vi.fn();

vi.mock("@supabase/supabase-js", () => ({
  createClient: () => ({ auth, from: fromMock }),
}));

// dbConfigurada depende de import.meta.env.VITE_SUPABASE_*, que en la máquina
// de quien corre los tests puede no tener un .env real. Lo fijamos acá para
// que el test sea determinístico en cualquier entorno (local, CI, sandbox).
vi.stubEnv("VITE_SUPABASE_URL", "https://test.supabase.co");
vi.stubEnv("VITE_SUPABASE_ANON_KEY", "clave-de-test");

const {
  dbConfigurada, iniciarSesion, cerrarSesion, cambiarPropiaClave,
  obtenerSesion, alCambiarSesion, obtenerPerfil,
} = await import("../../src/services/supabase.js");

describe("dbConfigurada", () => {
  it("es true cuando VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY están cargadas", () => {
    expect(dbConfigurada).toBe(true);
  });
});

describe("iniciarSesion", () => {
  beforeEach(() => { auth.signInWithPassword.mockReset(); });

  it("llama a signInWithPassword con email y contraseña, y devuelve la sesión", async () => {
    const sesionFalsa = { user: { id: "u1" } };
    auth.signInWithPassword.mockResolvedValue({ data: { session: sesionFalsa }, error: null });
    const resultado = await iniciarSesion("juani@lanuna.com", "clave123");
    expect(auth.signInWithPassword).toHaveBeenCalledWith({ email: "juani@lanuna.com", password: "clave123" });
    expect(resultado).toBe(sesionFalsa);
  });

  it("si Supabase devuelve error, lo relanza", async () => {
    const errorFalso = new Error("Invalid login credentials");
    auth.signInWithPassword.mockResolvedValue({ data: {}, error: errorFalso });
    await expect(iniciarSesion("juani@lanuna.com", "mal")).rejects.toThrow("Invalid login credentials");
  });
});

describe("cerrarSesion / cambiarPropiaClave / obtenerSesion / alCambiarSesion", () => {
  it("cerrarSesion llama a auth.signOut", async () => {
    auth.signOut.mockResolvedValue({});
    await cerrarSesion();
    expect(auth.signOut).toHaveBeenCalled();
  });

  it("cambiarPropiaClave llama a auth.updateUser con la nueva contraseña", async () => {
    auth.updateUser.mockResolvedValue({ error: null });
    await cambiarPropiaClave("nuevaClave123");
    expect(auth.updateUser).toHaveBeenCalledWith({ password: "nuevaClave123" });
  });

  it("cambiarPropiaClave relanza el error si Supabase lo devuelve", async () => {
    auth.updateUser.mockResolvedValue({ error: new Error("Contraseña muy corta") });
    await expect(cambiarPropiaClave("123")).rejects.toThrow("Contraseña muy corta");
  });

  it("obtenerSesion devuelve la sesión actual", async () => {
    const sesionFalsa = { user: { id: "u2" } };
    auth.getSession.mockResolvedValue({ data: { session: sesionFalsa } });
    expect(await obtenerSesion()).toBe(sesionFalsa);
  });

  it("alCambiarSesion suscribe un callback y devuelve una función para desuscribirse", () => {
    const unsubscribe = vi.fn();
    auth.onAuthStateChange.mockReturnValue({ data: { subscription: { unsubscribe } } });
    const callback = vi.fn();
    const desuscribir = alCambiarSesion(callback);
    expect(auth.onAuthStateChange).toHaveBeenCalled();
    desuscribir();
    expect(unsubscribe).toHaveBeenCalled();
  });
});

describe("obtenerPerfil", () => {
  it("consulta la tabla 'perfiles' por id y devuelve rol y nombre", async () => {
    const single = vi.fn().mockResolvedValue({ data: { rol: "admin", nombre: "Juani" }, error: null });
    const eq = vi.fn(() => ({ single }));
    const select = vi.fn(() => ({ eq }));
    fromMock.mockReturnValue({ select });

    const resultado = await obtenerPerfil("u1");
    expect(fromMock).toHaveBeenCalledWith("perfiles");
    expect(select).toHaveBeenCalledWith("rol, nombre");
    expect(eq).toHaveBeenCalledWith("id", "u1");
    expect(resultado).toEqual({ rol: "admin", nombre: "Juani" });
  });

  it("si Supabase devuelve error, lo relanza", async () => {
    const single = vi.fn().mockResolvedValue({ data: null, error: new Error("no encontrado") });
    fromMock.mockReturnValue({ select: () => ({ eq: () => ({ single }) }) });
    await expect(obtenerPerfil("u-inexistente")).rejects.toThrow("no encontrado");
  });
});
