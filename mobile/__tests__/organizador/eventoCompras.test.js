import { router } from 'expo-router';
import { screen, fireEvent } from '@testing-library/react-native';
import PantallaComprasDeEvento from '../../src/app/evento/[id]/compras';
import { renderConProviders } from '../utils/renderConProviders';
import { compraFixture, conSesion, mockFetch, usuarioMartina } from '../utils/fixtures';

jest.mock('expo-router', () => ({
  router: { push: jest.fn() },
  useLocalSearchParams: () => ({ id: 'evt-rock' }),
  Stack: { Screen: () => null },
}));

const sinAcciones = {
  puedePagar: false,
  puedeCancelar: false,
  puedeMarcarUtilizada: false,
  puedeResenar: false,
};

describe('compras de un evento (organizador)', () => {
  it('muestra el cupo disponible por tipo y las compras con su estado', async () => {
    global.fetch = mockFetch(
      conSesion(usuarioMartina, {
        'GET /eventos/evt-rock/compras': [
          200,
          {
            evento: { id: 'evt-rock', nombre: 'Rock en el Estadio', fecha: '2026-12-10T23:00:00.000Z' },
            tiposEntrada: [
              {
                id: 't1',
                nombre: 'Campo',
                descripcion: '',
                precio: 100,
                cupoTotal: 20,
                cupoDisponible: 15,
                agotado: false,
              },
              {
                id: 't2',
                nombre: 'VIP',
                descripcion: '',
                precio: 500,
                cupoTotal: 5,
                cupoDisponible: 0,
                agotado: true,
              },
            ],
            compras: [
              compraFixture({ id: 'c1', estado: 'CONFIRMADA', expiraEn: null, acciones: sinAcciones }),
              compraFixture({
                id: 'c2',
                estado: 'REEMBOLSADA',
                expiraEn: null,
                comprador: { id: 'u2', nombre: 'Bruno', apellido: 'Díaz' },
                acciones: sinAcciones,
              }),
            ],
          },
        ],
      }),
    );
    await renderConProviders(<PantallaComprasDeEvento />, { usuario: usuarioMartina });

    expect(await screen.findByText('15 de 20 disponibles')).toBeOnTheScreen();
    expect(screen.getByText('Agotado · 0 de 5')).toBeOnTheScreen();
    expect(screen.getByText('Ana Gómez')).toBeOnTheScreen();
    expect(screen.getByText('Bruno Díaz')).toBeOnTheScreen();
    expect(screen.getByLabelText('Estado: Reembolsada')).toBeOnTheScreen();

    await fireEvent.press(screen.getAllByLabelText(/Compra de/)[0]);
    expect(router.push).toHaveBeenCalledWith('/compra/c1');
  });
});
