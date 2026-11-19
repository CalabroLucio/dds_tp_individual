import { screen, fireEvent, waitFor } from '@testing-library/react-native';
import PantallaFavoritos from '../../src/app/comprador/favoritos';
import { BotonFavorito } from '../../src/components/BotonFavorito';
import { renderConProviders } from '../utils/renderConProviders';
import { conSesion, eventoResumen, mockFetch, usuarioAna } from '../utils/fixtures';

jest.mock('expo-router', () => ({ router: { push: jest.fn() } }));

describe('favoritos', () => {
  it('el corazón marca y desmarca el evento', async () => {
    const llamadas = [];
    global.fetch = mockFetch(
      conSesion(usuarioAna, {
        'PUT /favoritos/evt-rock': () => {
          llamadas.push('PUT');
          return [204];
        },
        'DELETE /favoritos/evt-rock': () => {
          llamadas.push('DELETE');
          return [204];
        },
      }),
    );
    await renderConProviders(<BotonFavorito eventoId="evt-rock" esFavorito={false} />, {
      usuario: usuarioAna,
    });

    await fireEvent.press(await screen.findByLabelText('Agregar a favoritos'));
    await waitFor(() => expect(screen.getByLabelText('Quitar de favoritos')).toBeOnTheScreen());
    await fireEvent.press(screen.getByLabelText('Quitar de favoritos'));
    await waitFor(() => expect(screen.getByLabelText('Agregar a favoritos')).toBeOnTheScreen());
    expect(llamadas).toEqual(['PUT', 'DELETE']);
  });

  it('la pantalla de favoritos lista los guardados y muestra un estado vacío al no tener', async () => {
    let favoritos = [eventoResumen({ esFavorito: true })];
    global.fetch = mockFetch(
      conSesion(usuarioAna, {
        'GET /favoritos': () => [200, favoritos],
        'DELETE /favoritos/evt-rock': () => {
          favoritos = [];
          return [204];
        },
      }),
    );
    await renderConProviders(<PantallaFavoritos />, { usuario: usuarioAna });

    expect(await screen.findByText('Rock en el Estadio')).toBeOnTheScreen();
    await fireEvent.press(screen.getByLabelText('Quitar de favoritos'));
    expect(await screen.findByText('Todavía no guardaste favoritos')).toBeOnTheScreen();
  });
});
