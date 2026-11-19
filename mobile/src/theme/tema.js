import { MD3DarkTheme, configureFonts } from 'react-native-paper';

// Sistema de diseño "nocturno premium" (ver .claude/skills/ticketit-ui/SKILL.md). Toda pantalla toma colores,
// fuentes y medidas de acá: nada de hex ni tamaños sueltos.
export const colores = {
  fondo: '#0E0F12',
  superficie: '#17191E',
  superficieAlta: '#21242B',
  borde: '#2C3039',
  texto: '#F3F5F7',
  textoSecundario: '#9BA3AE',
  marca: '#6BD43F',
  sobreMarca: '#0B1A05',
  marcaSuave: 'rgba(107, 212, 63, 0.16)',
  error: '#FF5A6E',
  estrella: '#FFC53D',
};

export const fuentes = {
  regular: 'Poppins_400Regular',
  media: 'Poppins_500Medium',
  semi: 'Poppins_600SemiBold',
  negrita: 'Poppins_700Bold',
};

export const espacio = { xs: 4, s: 8, m: 12, l: 16, xl: 24, xxl: 32 };
export const radios = { tarjeta: 18, input: 14, pildora: 999 };

// Espacio que dejan las listas para no quedar debajo de la tab bar flotante.
export const ESPACIO_TAB = 112;

// fontWeight 'normal': en Android, combinar una fuente custom con un peso distinto hace caer a la fuente del sistema.
const variante = (fontFamily, fontSize, lineHeight, letterSpacing = 0) => ({
  fontFamily,
  fontSize,
  lineHeight,
  letterSpacing,
  fontWeight: 'normal',
});

const tipografia = configureFonts({
  config: {
    displayLarge: variante(fuentes.negrita, 48, 56),
    displayMedium: variante(fuentes.negrita, 40, 48),
    displaySmall: variante(fuentes.negrita, 32, 40),
    headlineLarge: variante(fuentes.negrita, 30, 38),
    headlineMedium: variante(fuentes.negrita, 26, 34),
    headlineSmall: variante(fuentes.negrita, 22, 30),
    titleLarge: variante(fuentes.semi, 20, 28),
    titleMedium: variante(fuentes.semi, 16, 24),
    titleSmall: variante(fuentes.semi, 14, 20),
    labelLarge: variante(fuentes.media, 14, 20, 0.2),
    labelMedium: variante(fuentes.media, 12, 16, 0.4),
    labelSmall: variante(fuentes.media, 11, 16, 0.6),
    bodyLarge: variante(fuentes.regular, 16, 24),
    bodyMedium: variante(fuentes.regular, 14, 20),
    bodySmall: variante(fuentes.regular, 12, 16),
    default: variante(fuentes.regular, 14, 20),
  },
});

export const tema = {
  ...MD3DarkTheme,
  dark: true,
  roundness: 4,
  fonts: tipografia,
  colors: {
    ...MD3DarkTheme.colors,
    primary: colores.marca,
    onPrimary: colores.sobreMarca,
    primaryContainer: colores.marcaSuave,
    onPrimaryContainer: colores.marca,
    secondary: colores.textoSecundario,
    onSecondary: colores.fondo,
    secondaryContainer: colores.superficieAlta,
    onSecondaryContainer: colores.texto,
    background: colores.fondo,
    onBackground: colores.texto,
    surface: colores.superficie,
    onSurface: colores.texto,
    surfaceVariant: colores.superficieAlta,
    onSurfaceVariant: colores.textoSecundario,
    surfaceDisabled: 'rgba(243, 245, 247, 0.12)',
    onSurfaceDisabled: 'rgba(243, 245, 247, 0.38)',
    outline: colores.borde,
    outlineVariant: colores.borde,
    error: colores.error,
    onError: '#1A0005',
    errorContainer: 'rgba(255, 90, 110, 0.14)',
    onErrorContainer: '#FFB3BD',
    backdrop: 'rgba(0, 0, 0, 0.6)',
    elevation: {
      level0: 'transparent',
      level1: colores.superficie,
      level2: colores.superficie,
      level3: colores.superficieAlta,
      level4: colores.superficieAlta,
      level5: colores.superficieAlta,
    },
  },
};
