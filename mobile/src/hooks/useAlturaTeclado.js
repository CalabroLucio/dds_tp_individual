import { useEffect, useState } from 'react';
import { Keyboard, Platform } from 'react-native';

// Altura del teclado en Android. Con edge-to-edge la ventana no se achica al abrirlo, así que KeyboardAvoidingView no
// alcanza: se sube el contenido a mano con esta altura. En iOS se usa KeyboardAvoidingView y esto devuelve 0.
export function useAlturaTeclado() {
  const [altura, setAltura] = useState(0);
  useEffect(() => {
    if (Platform.OS !== 'android') return undefined;
    const mostrar = Keyboard.addListener('keyboardDidShow', (e) => setAltura(e.endCoordinates.height));
    const ocultar = Keyboard.addListener('keyboardDidHide', () => setAltura(0));
    return () => {
      mostrar.remove();
      ocultar.remove();
    };
  }, []);
  return altura;
}
