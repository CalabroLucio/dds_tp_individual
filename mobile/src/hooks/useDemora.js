import { useEffect, useState } from 'react';

// Devuelve el valor recién cuando dejó de cambiar durante `ms` (evita una búsqueda por tecla).
export function useDemora(valor, ms = 350) {
  const [demorado, setDemorado] = useState(valor);
  useEffect(() => {
    const id = setTimeout(() => setDemorado(valor), ms);
    return () => clearTimeout(id);
  }, [valor, ms]);
  return demorado;
}
