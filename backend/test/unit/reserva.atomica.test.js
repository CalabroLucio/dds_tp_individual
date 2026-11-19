import { crearStore } from '../../src/repository/store.js';
import { crearComprasRepository } from '../../src/repository/compras.repository.js';
import { entradasOcupadas } from '../../src/domain/evento.js';

const tipo = { id: 'general', cupo: 10 };
const compra = (i) => ({
  id: `c${i}`,
  eventoId: 'e1',
  tipoEntradaId: 'general',
  cantidad: 1,
  estado: 'PENDIENTE',
});

// 50 llamadores asincrónicos que compiten por el mismo cupo, como 50 solicitudes HTTP intercaladas.
async function competir(reservar) {
  const intentos = Array.from({ length: 50 }, async (_, i) => {
    await new Promise((r) => setImmediate(r));
    return reservar({ compra: compra(i), tipoEntrada: tipo });
  });
  const resultados = await Promise.all(intentos);
  return resultados.filter((r) => r.ok).length;
}

describe('reserva atómica de cupo (constitution III, R9)', () => {
  it('crearCompraReservandoCupo es síncrona: no devuelve una promesa', () => {
    const repo = crearComprasRepository(crearStore());
    const resultado = repo.crearCompraReservandoCupo({ compra: compra(1), tipoEntrada: tipo });
    expect(resultado).not.toBeInstanceOf(Promise);
    expect(resultado.ok).toBe(true);
  });

  it('con 50 intentos simultáneos sobre cupo 10 concede exactamente 10', async () => {
    const store = crearStore();
    const repo = crearComprasRepository(store);
    expect(await competir(repo.crearCompraReservandoCupo)).toBe(10);
    expect(store.compras.size).toBe(10);
  });

  it('informa cuántas quedan cuando no alcanza', () => {
    const repo = crearComprasRepository(crearStore());
    for (let i = 0; i < 8; i++) repo.crearCompraReservandoCupo({ compra: compra(i), tipoEntrada: tipo });
    const resultado = repo.crearCompraReservandoCupo({
      compra: { ...compra(99), cantidad: 3 },
      tipoEntrada: tipo,
    });
    expect(resultado).toEqual({ ok: false, disponible: 2 });
  });

  it('control: una versión con await entre el chequeo y la reserva vende de más (la prueba lo detecta)', async () => {
    const store = crearStore();
    const reservaIngenua = async ({ compra: c, tipoEntrada: t }) => {
      const ocupadas = entradasOcupadas(t.id, [...store.compras.values()]);
      await new Promise((r) => setImmediate(r)); // cede el control: otra solicitud lee el mismo cupo
      if (c.cantidad > t.cupo - ocupadas) return { ok: false };
      store.compras.set(c.id, c);
      return { ok: true };
    };
    expect(await competir(reservaIngenua)).toBeGreaterThan(10);
  });
});
