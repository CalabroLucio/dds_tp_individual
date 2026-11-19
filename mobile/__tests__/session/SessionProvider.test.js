import { Text } from 'react-native';
import { Button } from 'react-native-paper';
import * as SecureStore from 'expo-secure-store';
import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';
import { SessionProvider, useSession } from '../../src/session/SessionProvider';
import { respuestaJson, usuarioAna } from '../utils/fixtures';

function Consumidor() {
  const { estado, usuario, login, logout } = useSession();
  return (
    <>
      <Text>estado: {estado}</Text>
      <Text>usuario: {usuario ? usuario.nombre : 'ninguno'}</Text>
      <Button onPress={() => login('ana@tickets.test', 'demo1234')}>entrar</Button>
      <Button onPress={() => logout()}>salir</Button>
    </>
  );
}

describe('SessionProvider', () => {
  beforeEach(() => {
    SecureStore.__reiniciar();
    global.fetch = jest.fn();
  });

  it('arranca sin sesión si no hay nada guardado', async () => {
    await render(
      <SessionProvider>
        <Consumidor />
      </SessionProvider>,
    );
    await waitFor(() => expect(screen.getByText('estado: listo')).toBeOnTheScreen());
    expect(screen.getByText('usuario: ninguno')).toBeOnTheScreen();
  });

  it('restaura la sesión guardada y la verifica con /auth/me', async () => {
    await SecureStore.setItemAsync('sesion', JSON.stringify({ token: 'tkn', usuario: usuarioAna }));
    global.fetch.mockResolvedValue(respuestaJson(200, usuarioAna));

    await render(
      <SessionProvider>
        <Consumidor />
      </SessionProvider>,
    );

    await waitFor(() => expect(screen.getByText('usuario: Ana')).toBeOnTheScreen());
    expect(global.fetch.mock.calls[0][0]).toMatch(/\/auth\/me$/);
  });

  it('descarta la sesión guardada si el token venció', async () => {
    await SecureStore.setItemAsync('sesion', JSON.stringify({ token: 'viejo', usuario: usuarioAna }));
    global.fetch.mockResolvedValue(
      respuestaJson(401, { error: { codigo: 'NO_AUTENTICADO', mensaje: 'Venció' } }),
    );

    await render(
      <SessionProvider>
        <Consumidor />
      </SessionProvider>,
    );

    await waitFor(() => expect(screen.getByText('estado: listo')).toBeOnTheScreen());
    expect(screen.getByText('usuario: ninguno')).toBeOnTheScreen();
    expect(await SecureStore.getItemAsync('sesion')).toBeNull();
  });

  it('login guarda el token y logout lo borra', async () => {
    global.fetch.mockResolvedValue(respuestaJson(200, { token: 'nuevo', usuario: usuarioAna }));
    await render(
      <SessionProvider>
        <Consumidor />
      </SessionProvider>,
    );
    await waitFor(() => expect(screen.getByText('estado: listo')).toBeOnTheScreen());

    await fireEvent.press(screen.getByText('entrar'));
    await waitFor(() => expect(screen.getByText('usuario: Ana')).toBeOnTheScreen());
    expect(JSON.parse(await SecureStore.getItemAsync('sesion')).token).toBe('nuevo');

    await fireEvent.press(screen.getByText('salir'));
    await waitFor(() => expect(screen.getByText('usuario: ninguno')).toBeOnTheScreen());
    expect(await SecureStore.getItemAsync('sesion')).toBeNull();
  });
});
