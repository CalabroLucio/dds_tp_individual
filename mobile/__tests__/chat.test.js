import { screen, fireEvent, waitFor } from '@testing-library/react-native';
import { Chat } from '../src/components/Chat';
import { renderConProviders } from './utils/renderConProviders';
import { conSesion, mockFetch, usuarioAna } from './utils/fixtures';

const mensaje = (id, texto, rol, autorId) => ({
  id,
  autor: { id: autorId, nombre: rol === 'COMPRADOR' ? 'Ana' : 'Martina', apellido: 'X', rol },
  texto,
  enviadoEn: '2026-12-01T18:00:00.000Z',
});

describe('chat de la compra', () => {
  it('se actualiza solo con polling, envía mensajes y marca los propios', async () => {
    const mensajes = [mensaje('m1', '¿Hay estacionamiento?', 'COMPRADOR', usuarioAna.id)];
    const enviados = [];
    global.fetch = mockFetch(
      conSesion(usuarioAna, {
        'GET /compras/c1/mensajes': () => [200, mensajes],
        'POST /compras/c1/mensajes': (opciones) => {
          const { texto } = JSON.parse(opciones.body);
          enviados.push(texto);
          const nuevo = mensaje(`m${mensajes.length + 1}`, texto, 'COMPRADOR', usuarioAna.id);
          mensajes.push(nuevo);
          return [201, nuevo];
        },
      }),
    );
    await renderConProviders(<Chat compraId="c1" intervalo={50} />, { usuario: usuarioAna });

    expect(await screen.findByText('¿Hay estacionamiento?')).toBeOnTheScreen();
    expect(screen.getByLabelText('Mensaje tuyo: ¿Hay estacionamiento?')).toBeOnTheScreen();

    // El organizador responde "del otro lado": aparece sin acciones del usuario.
    mensajes.push(mensaje('m2', 'Sí, a una cuadra.', 'ORGANIZADOR', 'org'));
    expect(await screen.findByText('Sí, a una cuadra.')).toBeOnTheScreen();
    expect(screen.getByLabelText('Mensaje de Martina: Sí, a una cuadra.')).toBeOnTheScreen();

    await fireEvent.changeText(screen.getByLabelText('Escribir un mensaje'), 'Gracias');
    await fireEvent.press(screen.getByLabelText('Enviar mensaje'));
    await waitFor(() => expect(screen.getByText('Gracias')).toBeOnTheScreen());
    expect(enviados).toEqual(['Gracias']);
    expect(screen.getByLabelText('Escribir un mensaje').props.value).toBe('');
  });

  it('no envía un mensaje vacío', async () => {
    global.fetch = mockFetch(conSesion(usuarioAna, { 'GET /compras/c1/mensajes': [200, []] }));
    await renderConProviders(<Chat compraId="c1" intervalo={50} />, { usuario: usuarioAna });
    expect(await screen.findByText('Todavía no hay mensajes. Escribí tu consulta.')).toBeOnTheScreen();
    await fireEvent.changeText(screen.getByLabelText('Escribir un mensaje'), '   ');
    expect(screen.getByLabelText('Enviar mensaje')).toBeDisabled();
  });
});
