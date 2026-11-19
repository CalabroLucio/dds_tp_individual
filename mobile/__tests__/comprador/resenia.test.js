import { screen, fireEvent, waitFor } from '@testing-library/react-native';
import PantallaCompra from '../../src/app/compra/[id]';
import { renderConProviders } from '../utils/renderConProviders';
import { compraFixture, conSesion, mockFetch, usuarioAna } from '../utils/fixtures';

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

describe('reseñar una compra utilizada', () => {
  it('envía puntaje y comentario y después muestra la reseña en lugar del formulario', async () => {
    let compra = compraFixture({
      estado: 'UTILIZADA',
      expiraEn: null,
      acciones: acciones({ puedeResenar: true }),
    });
    let enviada;
    global.fetch = mockFetch(
      conSesion(usuarioAna, {
        'GET /compras/c1': () => [200, compra],
        'GET /compras/c1/mensajes': [200, []],
        'POST /compras/c1/resenia': (opciones) => {
          enviada = JSON.parse(opciones.body);
          const resenia = {
            id: 'r1',
            compraId: 'c1',
            comprador: { id: usuarioAna.id, nombre: 'Ana', apellido: 'Gómez' },
            evento: { id: 'evt-rock', nombre: 'Rock en el Estadio' },
            ...enviada,
            creadaEn: '2026-12-11T12:00:00.000Z',
          };
          compra = { ...compra, resenia, acciones: acciones() };
          return [201, resenia];
        },
      }),
    );
    await renderConProviders(<PantallaCompra />, { usuario: usuarioAna });

    await fireEvent.press(await screen.findByLabelText('Puntaje 4 de 5'));
    await fireEvent.changeText(screen.getByLabelText('Comentario'), 'Muy buena organización');
    await fireEvent.press(screen.getByRole('button', { name: /Enviar reseña/ }));

    await waitFor(() => expect(screen.getByText('Tu reseña')).toBeOnTheScreen());
    expect(enviada).toEqual({ puntaje: 4, comentario: 'Muy buena organización' });
    expect(screen.getByText('Muy buena organización')).toBeOnTheScreen();
    expect(screen.queryByRole('button', { name: /Enviar reseña/ })).toBeNull();
  });

  it('no muestra el formulario si la compra no se puede reseñar', async () => {
    global.fetch = mockFetch(
      conSesion(usuarioAna, {
        'GET /compras/c1': [
          200,
          compraFixture({ estado: 'CONFIRMADA', expiraEn: null, acciones: acciones() }),
        ],
        'GET /compras/c1/mensajes': [200, []],
      }),
    );
    await renderConProviders(<PantallaCompra />, { usuario: usuarioAna });
    expect(await screen.findByText('Confirmada')).toBeOnTheScreen();
    expect(screen.queryByRole('button', { name: /Enviar reseña/ })).toBeNull();
  });
});
