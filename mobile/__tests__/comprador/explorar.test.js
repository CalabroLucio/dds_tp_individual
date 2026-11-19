import { router } from 'expo-router';
import { screen, fireEvent, waitFor } from '@testing-library/react-native';
import PantallaExplorar from '../../src/app/comprador/explorar';
import { renderConProviders } from '../utils/renderConProviders';
import { categorias, eventoResumen, mockFetch } from '../utils/fixtures';

jest.mock('expo-router', () => ({ router: { push: jest.fn() } }));

const busquedas = () =>
  global.fetch.mock.calls.map(([url]) => url).filter((url) => new URL(url).pathname === '/eventos');
const ultimaBusqueda = () => new URL(busquedas().at(-1)).searchParams;

describe('explorar eventos (comprador)', () => {
  beforeEach(() => {
    router.push.mockClear();
  });

  function montar(
    eventos = [
      eventoResumen(),
      eventoResumen({
        id: 'evt-jazz',
        nombre: 'Noche de Jazz',
        organizador: { ...eventoResumen().organizador, puntaje: null, cantidadResenias: 0 },
      }),
    ],
  ) {
    global.fetch = mockFetch({
      'GET /categorias': [200, categorias],
      'GET /eventos': [200, eventos],
    });
    return renderConProviders(<PantallaExplorar />);
  }

  it('lista los eventos con precio y puntaje del organizador', async () => {
    await montar();
    expect(await screen.findByText('Rock en el Estadio')).toBeOnTheScreen();
    expect(screen.getByText('Noche de Jazz')).toBeOnTheScreen();
    expect(screen.getAllByText(/Desde/).length).toBe(2);
    expect(screen.getByLabelText('Puntaje del organizador: 4.5 de 5 (2 reseñas)')).toBeOnTheScreen();
    expect(screen.getByText('Sin reseñas')).toBeOnTheScreen();
  });

  it('busca por texto (con espera) y filtra por categoría', async () => {
    await montar();
    await screen.findByText('Rock en el Estadio');

    await fireEvent.changeText(screen.getByLabelText('Buscar eventos'), 'rock');
    await waitFor(() => expect(ultimaBusqueda().get('q')).toBe('rock'));

    await fireEvent.press(screen.getByText('Teatro'));
    await waitFor(() => expect(ultimaBusqueda().get('categoriaId')).toBe(categorias[1].id));
  });

  it('cambia el orden y filtra por precio', async () => {
    await montar();
    await screen.findByText('Rock en el Estadio');

    await fireEvent.press(screen.getByText('Precio'));
    await waitFor(() => expect(ultimaBusqueda().get('orden')).toBe('precio'));

    await fireEvent.press(screen.getByText('Puntaje'));
    await waitFor(() => expect(ultimaBusqueda().get('orden')).toBe('puntaje'));

    await fireEvent.press(screen.getByLabelText('Filtrar por precio'));
    await fireEvent.changeText(screen.getByLabelText('Precio mínimo'), '1000');
    await fireEvent.changeText(screen.getByLabelText('Precio máximo'), '9000');
    await waitFor(() => {
      expect(ultimaBusqueda().get('precioMin')).toBe('1000');
      expect(ultimaBusqueda().get('precioMax')).toBe('9000');
    });
  });

  it('muestra un estado vacío claro si no hay coincidencias', async () => {
    await montar([]);
    expect(await screen.findByText('No encontramos eventos')).toBeOnTheScreen();
  });

  it('abre el detalle al tocar un evento', async () => {
    await montar();
    await fireEvent.press(await screen.findByLabelText('Evento Rock en el Estadio'));
    expect(router.push).toHaveBeenCalledWith('/evento/evt-rock');
  });
});
