import { Redirect } from 'expo-router';
import { useSession } from '../session/SessionProvider';
import { rutaInicial } from '../session/rutas';

// Punto de entrada: redirige según haya sesión y según el rol.
export default function Inicio() {
  const { usuario } = useSession();
  return <Redirect href={rutaInicial(usuario)} />;
}
