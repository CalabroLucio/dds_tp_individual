import { screen, fireEvent, waitFor } from '@testing-library/react-native';
import PantallaCompra from '../../src/app/compra/[id]';
import { renderConProviders } from '../utils/renderConProviders';
import { compraFixture, conSesion, mediosPago, mockFetch, usuarioAna } from '../utils/fixtures';

jest.mock('expo-router', () => ({
  router: { push: jest.fn() },
  useLocalSearchParams: () => ({ id: 'c1' }),
  Stack: { Screen: () => null },
}));

const acciones = (cambios) => ({
  puedePagar: false,
  puedeCancelar: false,
  puedeMarcarUtilizada: false,
  puedeResenar: false,
  ...cambios,
});
const confirmada = (cambios = {}) =>
  compraFixture({
    estado: 'CONFIRMADA',
    expiraEn: null,
    diasParaEvento: 1,
    acciones: acciones({ puedeCancelar: true }),
    ...cambios,
  });

describe('cancelar una compra', () => {
  it('pide confirmación, cancela y muestra REEMBOLSADA con el historial', async () => {
    let compra = confirmada();
    global.fetch = mockFetch(
      conSesion(usuarioAna, {
        'GET /compras/c1': () => [200, compra],
        'GET /medios-pago': [200, mediosPago],
        'GET /compras/c1/mensajes': [200, []],
        'POST /compras/c1/cancelacion': () => {
          compra = confirmada({
            estado: 'REEMBOLSADA',
            diasParaEvento: null,
            acciones: acciones(),
            historial: [
              ...compra.historial,
              {
                estado: 'REEMBOLSADA',
                quien: { tipo: 'COMPRADOR', id: 'u', nombre: 'Ana Gómez' },
                fechaHora: '2026-12-01T19:00:00.000Z',
              },
            ],
          });
          return [200, compra];
        },
      }),
    );
    await renderConProviders(<PantallaCompra />, { usuario: usuarioAna });

    await fireEvent.press(await screen.findByRole('button', { name: /Cancelar compra/ }));
    expect(await screen.findByText(/reembolso/)).toBeOnTheScreen();
    await fireEvent.press(screen.getByText('Sí, cancelar'));

    await waitFor(() => expect(screen.getByLabelText('Estado: Reembolsada')).toBeOnTheScreen());
    expect(screen.getByText(/Reembolsada · Ana Gómez/)).toBeOnTheScreen();
    expect(screen.queryByRole('button', { name: /Cancelar compra/ })).toBeNull();
  });

  it('no muestra el botón si el backend no habilita la cancelación', async () => {
    global.fetch = mockFetch(
      conSesion(usuarioAna, {
        'GET /compras/c1': [200, confirmada({ acciones: acciones() })],
        'GET /compras/c1/mensajes': [200, []],
      }),
    );
    await renderConProviders(<PantallaCompra />, { usuario: usuarioAna });
    expect(await screen.findByText('Confirmada')).toBeOnTheScreen();
    expect(screen.queryByRole('button', { name: /Cancelar compra/ })).toBeNull();
  });

  it('muestra el motivo si el backend rechaza (fuera de plazo)', async () => {
    global.fetch = mockFetch(
      conSesion(usuarioAna, {
        'GET /compras/c1': [200, confirmada()],
        'GET /compras/c1/mensajes': [200, []],
        'POST /compras/c1/cancelacion': [
          409,
          {
            error: {
              codigo: 'FUERA_DE_PLAZO',
              mensaje: 'Ya no se puede cancelar: el límite es 30 minutos antes del evento',
            },
          },
        ],
      }),
    );
    await renderConProviders(<PantallaCompra />, { usuario: usuarioAna });
    await fireEvent.press(await screen.findByRole('button', { name: /Cancelar compra/ }));
    await fireEvent.press(await screen.findByText('Sí, cancelar'));
    expect(await screen.findByText(/el límite es 30 minutos/)).toBeOnTheScreen();
  });
});
