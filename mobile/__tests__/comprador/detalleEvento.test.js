import { screen } from '@testing-library/react-native';
import PantallaEvento from '../../src/app/evento/[id]';
import { renderConProviders } from '../utils/renderConProviders';
import { eventoDetalle, mockFetch } from '../utils/fixtures';

jest.mock('expo-router', () => ({
  router: { push: jest.fn() },
  useLocalSearchParams: () => ({ id: 'evt-rock' }),
  Stack: { Screen: () => null },
}));

describe('detalle de evento', () => {
  it('muestra tipos de entrada con cupo, agotados, puntaje y reseñas del organizador', async () => {
    global.fetch = mockFetch({ 'GET /eventos/evt-rock': [200, eventoDetalle()] });
    await renderConProviders(<PantallaEvento />);

    expect(await screen.findByText('Rock en el Estadio')).toBeOnTheScreen();
    expect(screen.getByText('La mejor noche de rock')).toBeOnTheScreen();
    expect(screen.getByText('Campo')).toBeOnTheScreen();
    expect(screen.getByText('Quedan 8')).toBeOnTheScreen();
    expect(screen.getByText('Agotado')).toBeOnTheScreen();
    expect(screen.getByLabelText('Puntaje del organizador: 4.5 de 5 (2 reseñas)')).toBeOnTheScreen();
    expect(screen.getByText('Impecable la organización')).toBeOnTheScreen();
    expect(screen.getByText(/Festival de verano/)).toBeOnTheScreen();
  });

  it('indica cuando el organizador todavía no tiene reseñas', async () => {
    const sinResenias = eventoDetalle();
    sinResenias.organizador = {
      ...sinResenias.organizador,
      puntaje: null,
      cantidadResenias: 0,
      resenias: [],
    };
    global.fetch = mockFetch({ 'GET /eventos/evt-rock': [200, sinResenias] });
    await renderConProviders(<PantallaEvento />);

    expect(await screen.findByText('Este organizador todavía no tiene reseñas')).toBeOnTheScreen();
  });
});
