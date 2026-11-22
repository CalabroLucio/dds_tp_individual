import { useEffect, useState } from 'react';
import { Keyboard, Platform } from 'react-native';

// Altura del teclado en Android. La ventana ya se achica sola al abrirlo (softwareKeyboardLayoutMode "resize"), así que
// NO hay que sumar esta altura como relleno (se duplicaría): solo sirve para saber si el teclado está abierto y quitar el
// margen inferior de la barra de navegación. En iOS se usa KeyboardAvoidingView y esto devuelve 0.
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
