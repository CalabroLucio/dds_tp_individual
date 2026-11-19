import * as SecureStore from 'expo-secure-store';
import { router } from 'expo-router';
import { screen, fireEvent, waitFor } from '@testing-library/react-native';
import PantallaLogin from '../src/app/login';
import { rutaInicial } from '../src/session/rutas';
import { renderConProviders } from './utils/renderConProviders';
import { respuestaJson, usuarioAna } from './utils/fixtures';

jest.mock('expo-router', () => ({ router: { replace: jest.fn() } }));

describe('pantalla de login', () => {
  beforeEach(() => {
    SecureStore.__reiniciar();
    global.fetch = jest.fn();
    router.replace.mockClear();
  });

  it('valida los campos antes de llamar a la API', async () => {
    await renderConProviders(<PantallaLogin />);
    await fireEvent.press(await screen.findByRole('button', { name: 'Ingresar' }));

    expect(screen.getByText('Ingresá tu email')).toBeOnTheScreen();
    expect(screen.getByText('Ingresá tu contraseña')).toBeOnTheScreen();
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('muestra el mensaje del backend ante credenciales inválidas', async () => {
    global.fetch.mockResolvedValue(
      respuestaJson(401, {
        error: { codigo: 'CREDENCIALES_INVALIDAS', mensaje: 'Email o contraseña incorrectos' },
      }),
    );
    await renderConProviders(<PantallaLogin />);

    await fireEvent.changeText(await screen.findByLabelText('Email'), 'ana@tickets.test');
    await fireEvent.changeText(screen.getByLabelText('Contraseña'), 'mala');
    await fireEvent.press(screen.getByRole('button', { name: 'Ingresar' }));

    expect(await screen.findByText('Email o contraseña incorrectos')).toBeOnTheScreen();
    expect(router.replace).not.toHaveBeenCalled();
  });

  it('inicia sesión y redirige al inicio', async () => {
    global.fetch.mockResolvedValue(respuestaJson(200, { token: 'tkn', usuario: usuarioAna }));
    await renderConProviders(<PantallaLogin />);

    await fireEvent.changeText(await screen.findByLabelText('Email'), 'ana@tickets.test');
    await fireEvent.changeText(screen.getByLabelText('Contraseña'), 'demo1234');
    await fireEvent.press(screen.getByRole('button', { name: 'Ingresar' }));

    await waitFor(() => expect(router.replace).toHaveBeenCalledWith('/'));
  });
});

describe('rutaInicial según el rol', () => {
  it('lleva al login sin sesión', () => {
    expect(rutaInicial(null)).toBe('/login');
  });
  it('lleva al catálogo al comprador', () => {
    expect(rutaInicial({ rol: 'COMPRADOR' })).toBe('/comprador/explorar');
  });
  it('lleva a sus eventos al organizador', () => {
    expect(rutaInicial({ rol: 'ORGANIZADOR' })).toBe('/organizador/mis-eventos');
  });
});
