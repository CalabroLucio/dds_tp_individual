import { router } from 'expo-router';
import { screen, fireEvent } from '@testing-library/react-native';
import PantallaMisCompras from '../../src/app/comprador/mis-compras';
import { renderConProviders } from '../utils/renderConProviders';
import { compraFixture, conSesion, mockFetch, usuarioAna } from '../utils/fixtures';

jest.mock('expo-router', () => ({ router: { push: jest.fn() } }));

const sinAcciones = {
  puedePagar: false,
  puedeCancelar: false,
  puedeMarcarUtilizada: false,
  puedeResenar: false,
};

describe('Mis compras', () => {
  it('diferencia los estados y muestra los días solo en las confirmadas', async () => {
    global.fetch = mockFetch(
      conSesion(usuarioAna, {
        'GET /compras': [
          200,
          [
            compraFixture({
              id: 'c1',
              estado: 'CONFIRMADA',
              expiraEn: null,
              diasParaEvento: 20,
              acciones: sinAcciones,
            }),
            compraFixture({
              id: 'c2',
              estado: 'CONFIRMADA',
              expiraEn: null,
              diasParaEvento: 0,
              evento: { id: 'e2', nombre: 'Show de hoy', fecha: '2026-12-02T01:00:00.000Z' },
              acciones: sinAcciones,
            }),
            compraFixture({
              id: 'c3',
              estado: 'CONFIRMADA',
              expiraEn: null,
              eventoRealizado: true,
              evento: { id: 'e3', nombre: 'Show de anoche', fecha: '2026-11-30T01:00:00.000Z' },
              acciones: sinAcciones,
            }),
            compraFixture({ id: 'c4', estado: 'PENDIENTE' }),
            compraFixture({ id: 'c5', estado: 'REEMBOLSADA', expiraEn: null, acciones: sinAcciones }),
          ],
        ],
      }),
    );
    await renderConProviders(<PantallaMisCompras />, { usuario: usuarioAna });

    expect(await screen.findByText('Faltan 20 días')).toBeOnTheScreen();
    expect(screen.getByText('¡Es hoy!')).toBeOnTheScreen();
    expect(screen.getByText('Evento realizado')).toBeOnTheScreen();
    expect(screen.getByLabelText('Estado: Pendiente de pago')).toBeOnTheScreen();
    expect(screen.getByLabelText('Estado: Reembolsada')).toBeOnTheScreen();
    expect(screen.getAllByText(/Faltan|¡Es hoy!/)).toHaveLength(2);
  });

  it('abre el detalle de una compra', async () => {
    global.fetch = mockFetch(conSesion(usuarioAna, { 'GET /compras': [200, [compraFixture()]] }));
    await renderConProviders(<PantallaMisCompras />, { usuario: usuarioAna });
    await fireEvent.press(await screen.findByLabelText('Compra de Rock en el Estadio'));
    expect(router.push).toHaveBeenCalledWith('/compra/c1');
  });

  it('muestra un estado vacío si todavía no compró', async () => {
    global.fetch = mockFetch(conSesion(usuarioAna, { 'GET /compras': [200, []] }));
    await renderConProviders(<PantallaMisCompras />, { usuario: usuarioAna });
    expect(await screen.findByText('Todavía no compraste entradas')).toBeOnTheScreen();
  });
});
