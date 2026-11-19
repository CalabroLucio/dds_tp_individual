import { MD3LightTheme } from 'react-native-paper';

// Paleta de AI Ticket It: verde de la marca con un primario más oscuro para que el texto blanco contraste.
export const colores = {
  marca: '#6BD43F',
  primario: '#2E7D1F',
  texto: '#1B1B1B',
  fondo: '#F7F9F5',
};

export const tema = {
  ...MD3LightTheme,
  roundness: 3,
  colors: {
    ...MD3LightTheme.colors,
    primary: colores.primario,
    onPrimary: '#FFFFFF',
    primaryContainer: '#C8F2B4',
    onPrimaryContainer: '#0B3A04',
    secondary: '#4F6447',
    secondaryContainer: '#D1E8C5',
    background: colores.fondo,
    surface: '#FFFFFF',
    surfaceVariant: '#E8EFE3',
  },
};
