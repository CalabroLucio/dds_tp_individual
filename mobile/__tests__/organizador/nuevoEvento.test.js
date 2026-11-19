import { router } from 'expo-router';
import { screen, fireEvent, waitFor } from '@testing-library/react-native';
import PantallaNuevoEvento from '../../src/app/evento/nuevo';
import { renderConProviders } from '../utils/renderConProviders';
import { categorias, mockFetch } from '../utils/fixtures';

jest.mock('expo-router', () => ({
  router: { replace: jest.fn(), back: jest.fn(), push: jest.fn() },
  Stack: { Screen: () => null },
}));
jest.mock('@react-native-community/datetimepicker', () => ({
  __esModule: true,
  default: () => null,
  DateTimePickerAndroid: { open: jest.fn() },
}));

async function completarDatosBasicos() {
  await fireEvent.changeText(await screen.findByLabelText('Nombre del evento'), 'Noche de Jazz');
  await fireEvent.changeText(screen.getByLabelText('Descripción'), 'Cuarteto en vivo');
  await fireEvent.changeText(screen.getByLabelText('Nombre del tipo 1'), 'Platea');
  await fireEvent.changeText(screen.getByLabelText('Precio del tipo 1'), '12500,50');
  await fireEvent.changeText(screen.getByLabelText('Cupo del tipo 1'), '80');
}

describe('alta de evento (organizador)', () => {
  beforeEach(() => {
    router.replace.mockClear();
  });

  it('muestra las categorías y permite agregar y quitar tipos de entrada', async () => {
    global.fetch = mockFetch({ 'GET /categorias': [200, categorias] });
    await renderConProviders(<PantallaNuevoEvento />);

    expect(await screen.findByText('Música')).toBeOnTheScreen();
    expect(screen.getByText('Teatro')).toBeOnTheScreen();
    expect(screen.getByLabelText('Nombre del tipo 1')).toBeOnTheScreen();

    await fireEvent.press(screen.getByRole('button', { name: /Agregar tipo de entrada/ }));
    expect(screen.getByLabelText('Nombre del tipo 2')).toBeOnTheScreen();

    await fireEvent.press(screen.getByLabelText('Quitar tipo 2'));
    expect(screen.queryByLabelText('Nombre del tipo 2')).toBeNull();
  });

  it('muestra los errores que devuelve el backend, campo por campo', async () => {
    global.fetch = mockFetch({
      'GET /categorias': [200, categorias],
      'POST /eventos': [
        400,
        {
          error: {
            codigo: 'VALIDACION',
            mensaje: 'Hay datos inválidos en la solicitud',
            detalles: [{ campo: 'tiposEntrada.0.cupo', mensaje: 'El cupo debe ser mayor a 0' }],
          },
        },
      ],
    });
    await renderConProviders(<PantallaNuevoEvento />);
    await completarDatosBasicos();

    await fireEvent.press(screen.getByRole('button', { name: /Publicar evento/ }));

    expect(await screen.findByText('Tipo de entrada 1 · Cupo: El cupo debe ser mayor a 0')).toBeOnTheScreen();
    expect(router.replace).not.toHaveBeenCalled();
  });

  it('envía el evento con números parseados y vuelve a "Mis eventos"', async () => {
    let enviado;
    global.fetch = mockFetch({
      'GET /categorias': [200, categorias],
      'POST /eventos': (opciones) => {
        enviado = JSON.parse(opciones.body);
        return [201, { id: 'nuevo' }];
      },
    });
    await renderConProviders(<PantallaNuevoEvento />);
    await completarDatosBasicos();
    await fireEvent.press(screen.getByText('Teatro'));

    await fireEvent.press(screen.getByRole('button', { name: /Publicar evento/ }));

    await waitFor(() => expect(router.replace).toHaveBeenCalledWith('/organizador/mis-eventos'));
    expect(enviado).toMatchObject({
      nombre: 'Noche de Jazz',
      descripcion: 'Cuarteto en vivo',
      categoriaId: categorias[1].id,
      tiposEntrada: [{ nombre: 'Platea', descripcion: '', precio: 12500.5, cupo: 80 }],
    });
    expect(new Date(enviado.fecha).getTime()).toBeGreaterThan(Date.now());
  });
});
