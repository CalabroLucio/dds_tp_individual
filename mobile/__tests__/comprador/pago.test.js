import { screen, fireEvent, waitFor } from '@testing-library/react-native';
import PantallaCompra from '../../src/app/compra/[id]';
import { renderConProviders } from '../utils/renderConProviders';
import { compraFixture, conSesion, mediosPago, mockFetch, usuarioAna } from '../utils/fixtures';

jest.mock('expo-router', () => ({
  router: { push: jest.fn() },
  useLocalSearchParams: () => ({ id: 'c1' }),
  Stack: { Screen: () => null },
}));

describe('pagar una compra pendiente', () => {
  it('un pago rechazado muestra el motivo y permite reintentar con otro medio', async () => {
    let compra = compraFixture();
    const pagos = [];
    global.fetch = mockFetch(
      conSesion(usuarioAna, {
        'GET /compras/c1': () => [200, compra],
        'GET /medios-pago': [200, mediosPago],
        'POST /compras/c1/pagos': (opciones) => {
          const { medioPago } = JSON.parse(opciones.body);
          pagos.push(medioPago);
          if (medioPago === 'TARJETA_RECHAZADA') {
            return [
              402,
              { error: { codigo: 'PAGO_RECHAZADO', mensaje: 'El pago fue rechazado. Podés reintentar' } },
            ];
          }
          compra = compraFixture({
            estado: 'CONFIRMADA',
            expiraEn: null,
            diasParaEvento: 9,
            acciones: {
              puedePagar: false,
              puedeCancelar: true,
              puedeMarcarUtilizada: false,
              puedeResenar: false,
            },
          });
          return [200, compra];
        },
      }),
    );
    await renderConProviders(<PantallaCompra />, { usuario: usuarioAna });

    expect(await screen.findByText('Pendiente de pago')).toBeOnTheScreen();
    expect(screen.getByText(/para pagar/)).toBeOnTheScreen();

    await fireEvent.press(await screen.findByText('Tarjeta rechazada (siempre falla)'));
    await fireEvent.press(screen.getByRole('button', { name: /Pagar/ }));
    expect(await screen.findByText('El pago fue rechazado. Podés reintentar')).toBeOnTheScreen();
    expect(screen.getByText('Pendiente de pago')).toBeOnTheScreen();

    await fireEvent.press(screen.getByText('Tarjeta Visa de prueba'));
    await fireEvent.press(screen.getByRole('button', { name: /Pagar/ }));

    await waitFor(() => expect(screen.getByText('Confirmada')).toBeOnTheScreen());
    expect(pagos).toEqual(['TARJETA_RECHAZADA', 'TARJETA_VISA']);
    expect(screen.queryByRole('button', { name: /Pagar/ })).toBeNull();
  });

  it('sin acciones de pago no muestra el formulario', async () => {
    global.fetch = mockFetch(
      conSesion(usuarioAna, {
        'GET /compras/c1': [
          200,
          compraFixture({
            estado: 'CANCELADA',
            expiraEn: null,
            acciones: {
              puedePagar: false,
              puedeCancelar: false,
              puedeMarcarUtilizada: false,
              puedeResenar: false,
            },
          }),
        ],
        'GET /medios-pago': [200, mediosPago],
      }),
    );
    await renderConProviders(<PantallaCompra />, { usuario: usuarioAna });
    expect(await screen.findByText('Cancelada')).toBeOnTheScreen();
    expect(screen.queryByRole('button', { name: /Pagar/ })).toBeNull();
  });
});
