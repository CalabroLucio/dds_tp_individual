import { router } from 'expo-router';
import { screen, fireEvent, waitFor } from '@testing-library/react-native';
import PantallaEvento from '../../src/app/evento/[id]';
import { renderConProviders } from '../utils/renderConProviders';
import {
  compraFixture,
  conSesion,
  eventoDetalle,
  mockFetch,
  usuarioAna,
  usuarioMartina,
} from '../utils/fixtures';

jest.mock('expo-router', () => ({
  router: { push: jest.fn() },
  useLocalSearchParams: () => ({ id: 'evt-rock' }),
  Stack: { Screen: () => null },
}));

describe('comprar entradas desde el detalle del evento', () => {
  beforeEach(() => {
    router.push.mockClear();
  });

  async function montar({ evento = eventoDetalle(), usuario = usuarioAna, alComprar } = {}) {
    global.fetch = mockFetch(
      conSesion(usuario, {
        'GET /eventos/evt-rock': [200, evento],
        'POST /compras': alComprar ?? [201, compraFixture()],
      }),
    );
    await renderConProviders(<PantallaEvento />, { usuario });
    await screen.findByText('Rock en el Estadio');
  }

  it('limita la cantidad al cupo disponible y no ofrece tipos agotados', async () => {
    await montar();
    await fireEvent.press(await screen.findByLabelText('Elegir Campo'));
    expect(screen.queryByLabelText('Elegir VIP')).toBeNull();

    const sumar = screen.getByLabelText('Sumar una entrada');
    for (let i = 0; i < 10; i++) await fireEvent.press(sumar);
    expect(screen.getByLabelText('Cantidad: 8')).toBeOnTheScreen();
    expect(screen.getByText(/Total/)).toBeOnTheScreen();
  });

  it('crea la compra con el tipo y la cantidad elegidos y abre su detalle', async () => {
    let cuerpo;
    await montar({
      alComprar: (opciones) => {
        cuerpo = JSON.parse(opciones.body);
        return [201, compraFixture()];
      },
    });
    await fireEvent.press(await screen.findByLabelText('Elegir Campo'));
    await fireEvent.press(screen.getByLabelText('Sumar una entrada'));
    await fireEvent.press(screen.getByRole('button', { name: /Comprar/ }));

    await waitFor(() => expect(router.push).toHaveBeenCalledWith('/compra/c1'));
    expect(cuerpo).toEqual({ eventoId: 'evt-rock', tipoEntradaId: 'tipo-campo', cantidad: 2 });
  });

  it('avisa antes de confirmar si la compra ya no se podrá cancelar', async () => {
    await montar({ evento: eventoDetalle({ avisoNoCancelable: true }) });
    await fireEvent.press(await screen.findByLabelText('Elegir Campo'));
    await fireEvent.press(screen.getByRole('button', { name: /Comprar/ }));

    expect(await screen.findByText(/no se podrá cancelar/)).toBeOnTheScreen();
    expect(router.push).not.toHaveBeenCalled();

    await fireEvent.press(screen.getByText('Comprar igual'));
    await waitFor(() => expect(router.push).toHaveBeenCalledWith('/compra/c1'));
  });

  it('muestra el mensaje del backend si no hay cupo', async () => {
    await montar({
      alComprar: [
        409,
        { error: { codigo: 'CUPO_INSUFICIENTE', mensaje: 'Solo quedan 1 entradas de este tipo' } },
      ],
    });
    await fireEvent.press(await screen.findByLabelText('Elegir Campo'));
    await fireEvent.press(screen.getByRole('button', { name: /Comprar/ }));
    expect(await screen.findByText('Solo quedan 1 entradas de este tipo')).toBeOnTheScreen();
  });

  it('no muestra la sección de compra a un organizador', async () => {
    await montar({ usuario: usuarioMartina });
    expect(screen.queryByRole('button', { name: /Comprar/ })).toBeNull();
  });

  it('no deja comprar si el evento ya empezó', async () => {
    await montar({ evento: eventoDetalle({ compraAbierta: false }) });
    expect(screen.getByText('La venta de entradas para este evento terminó')).toBeOnTheScreen();
    expect(screen.queryByRole('button', { name: /Comprar/ })).toBeNull();
  });
});
