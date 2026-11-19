import { useEffect, useState } from 'react';
import { Text } from 'react-native-paper';

// Solo informa el tiempo que queda para pagar; el vencimiento real lo decide el backend.
export function CuentaRegresiva({ hasta }) {
  const [ahora, setAhora] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setAhora(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);
  const restante = Math.max(0, new Date(hasta).getTime() - ahora);
  const minutos = Math.floor(restante / 60_000);
  const segundos = Math.floor((restante % 60_000) / 1000);
  return (
    <Text variant="bodyMedium">
      {restante > 0
        ? `Tenés ${minutos}:${String(segundos).padStart(2, '0')} para pagar`
        : 'El tiempo para pagar terminó'}
    </Text>
  );
}
