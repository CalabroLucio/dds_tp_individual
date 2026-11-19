import { useState } from 'react';
import { IconButton } from 'react-native-paper';
import { useAlternarFavorito } from '../hooks/useFavoritos';

import { colores } from '../theme/tema';

const ROJO = colores.error;

export function BotonFavorito({ eventoId, esFavorito }) {
  const [marcado, setMarcado] = useState(esFavorito);
  const alternar = useAlternarFavorito(eventoId);
  return (
    <IconButton
      icon={marcado ? 'heart' : 'heart-outline'}
      iconColor={ROJO}
      accessibilityLabel={marcado ? 'Quitar de favoritos' : 'Agregar a favoritos'}
      disabled={alternar.isPending}
      onPress={() => alternar.mutate(!marcado, { onSuccess: () => setMarcado(!marcado) })}
    />
  );
}
