import { StyleSheet, View } from 'react-native';
import { Avatar, Button, Icon, Text } from 'react-native-paper';
import { useSession } from '../session/SessionProvider';
import { Encabezado } from './Encabezado';
import { colores, radios } from '../theme/tema';

const ROTULO_ROL = { COMPRADOR: 'Comprador', ORGANIZADOR: 'Organizador' };

// Perfil común a ambos roles: datos de la cuenta y cierre de sesión.
export function PantallaPerfil() {
  const { usuario, logout } = useSession();
  if (!usuario) return null;
  const iniciales = `${usuario.nombre[0] ?? ''}${usuario.apellido[0] ?? ''}`;

  return (
    <View style={estilos.contenedor}>
      <Encabezado antetitulo="Tu cuenta" titulo="Perfil" />
      <View style={estilos.tarjeta}>
        <Avatar.Text size={72} label={iniciales} style={estilos.avatar} color={colores.sobreMarca} />
        <Text variant="titleLarge">{`${usuario.nombre} ${usuario.apellido}`}</Text>
        <Text variant="bodyMedium" style={estilos.secundario}>
          {usuario.email}
        </Text>
        <View style={estilos.rol}>
          <Icon
            source={usuario.rol === 'ORGANIZADOR' ? 'calendar-star' : 'ticket-outline'}
            size={16}
            color={colores.marca}
          />
          <Text variant="labelLarge" style={estilos.textoRol}>{`Rol: ${ROTULO_ROL[usuario.rol]}`}</Text>
        </View>
      </View>
      <Button
        mode="outlined"
        icon="logout"
        onPress={logout}
        contentStyle={estilos.boton}
        textColor={colores.error}
      >
        Cerrar sesión
      </Button>
    </View>
  );
}

const estilos = StyleSheet.create({
  contenedor: { flex: 1, paddingHorizontal: 16, gap: 16 },
  tarjeta: {
    alignItems: 'center',
    gap: 6,
    paddingVertical: 28,
    borderRadius: radios.tarjeta,
    backgroundColor: colores.superficie,
  },
  avatar: { backgroundColor: colores.marca, marginBottom: 8 },
  secundario: { color: colores.textoSecundario },
  rol: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radios.pildora,
    backgroundColor: colores.marcaSuave,
  },
  textoRol: { color: colores.marca },
  boton: { paddingVertical: 6 },
});
