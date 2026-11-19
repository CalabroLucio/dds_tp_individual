import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import * as SecureStore from 'expo-secure-store';
import { QueryClientContext } from '@tanstack/react-query';
import { authApi } from '../api/auth';
import { configurarSesionCliente } from '../api/cliente';

const CLAVE = 'sesion';
const SessionContext = createContext(null);

// Sesión del usuario: el token vive en expo-secure-store y se verifica con /auth/me al abrir la app (R5).
export function SessionProvider({ children }) {
  const queryClient = useContext(QueryClientContext);
  const [estado, setEstado] = useState('cargando');
  const [sesion, setSesion] = useState(null);

  const logout = useCallback(async () => {
    configurarSesionCliente({ token: null });
    setSesion(null);
    queryClient?.clear();
    await SecureStore.deleteItemAsync(CLAVE);
  }, [queryClient]);

  useEffect(() => {
    configurarSesionCliente({ alVencer: () => logout() });
  }, [logout]);

  useEffect(() => {
    let activo = true;
    (async () => {
      try {
        const guardada = await SecureStore.getItemAsync(CLAVE);
        if (guardada) {
          const { token } = JSON.parse(guardada);
          configurarSesionCliente({ token });
          const usuario = await authApi.me();
          if (activo) setSesion({ token, usuario });
        }
      } catch {
        await logout();
      } finally {
        if (activo) setEstado('listo');
      }
    })();
    return () => {
      activo = false;
    };
    // Solo al montar: restaurar la sesión guardada.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const login = useCallback(async (email, password) => {
    const respuesta = await authApi.login(email, password);
    configurarSesionCliente({ token: respuesta.token });
    await SecureStore.setItemAsync(CLAVE, JSON.stringify(respuesta));
    setSesion(respuesta);
    return respuesta.usuario;
  }, []);

  const valor = useMemo(
    () => ({ estado, usuario: sesion?.usuario ?? null, token: sesion?.token ?? null, login, logout }),
    [estado, sesion, login, logout],
  );

  return <SessionContext.Provider value={valor}>{children}</SessionContext.Provider>;
}

export function useSession() {
  const contexto = useContext(SessionContext);
  if (!contexto) throw new Error('useSession debe usarse dentro de SessionProvider');
  return contexto;
}
