import { screen, fireEvent, waitFor } from '@testing-library/react-native';
import PantallaCompra from '../../src/app/compra/[id]';
import { renderConProviders } from '../utils/renderConProviders';
import { compraFixture, conSesion, mockFetch, usuarioMartina } from '../utils/fixtures';

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

describe('el organizador marca una entrada como utilizada', () => {
  it('muestra el botón solo si el backend lo habilita y actualiza el estado', async () => {
    let compra = compraFixture({
      estado: 'CONFIRMADA',
      expiraEn: null,
      acciones: acciones({ puedeMarcarUtilizada: true }),
    });
    global.fetch = mockFetch(
      conSesion(usuarioMartina, {
        'GET /compras/c1': () => [200, compra],
        'GET /compras/c1/mensajes': [200, []],
        'POST /compras/c1/uso': () => {
          compra = { ...compra, estado: 'UTILIZADA', acciones: acciones() };
          return [200, compra];
        },
      }),
    );
    await renderConProviders(<PantallaCompra />, { usuario: usuarioMartina });

    expect(await screen.findByText('Ana Gómez')).toBeOnTheScreen();
    await fireEvent.press(screen.getByRole('button', { name: /Marcar como utilizada/ }));

    await waitFor(() => expect(screen.getByLabelText('Estado: Utilizada')).toBeOnTheScreen());
    expect(screen.queryByRole('button', { name: /Marcar como utilizada/ })).toBeNull();
  });

  it('no muestra el botón si todavía no está habilitado', async () => {
    global.fetch = mockFetch(
      conSesion(usuarioMartina, {
        'GET /compras/c1': [
          200,
          compraFixture({ estado: 'CONFIRMADA', expiraEn: null, acciones: acciones() }),
        ],
        'GET /compras/c1/mensajes': [200, []],
      }),
    );
    await renderConProviders(<PantallaCompra />, { usuario: usuarioMartina });
    expect(await screen.findByText('Confirmada')).toBeOnTheScreen();
    expect(screen.queryByRole('button', { name: /Marcar como utilizada/ })).toBeNull();
  });
});
