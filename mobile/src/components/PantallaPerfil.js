import { StyleSheet, View } from 'react-native';
import { Avatar, Button, Card, Text } from 'react-native-paper';
import { useSession } from '../session/SessionProvider';

const ROTULO_ROL = { COMPRADOR: 'Comprador', ORGANIZADOR: 'Organizador' };

// Perfil común a ambos roles: datos de la cuenta y cierre de sesión.
export function PantallaPerfil() {
  const { usuario, logout } = useSession();
  if (!usuario) return null;
  const iniciales = `${usuario.nombre[0] ?? ''}${usuario.apellido[0] ?? ''}`;

  return (
    <View style={estilos.contenedor}>
      <Card mode="contained">
        <Card.Title
          title={`${usuario.nombre} ${usuario.apellido}`}
          subtitle={usuario.email}
          left={(props) => <Avatar.Text {...props} label={iniciales} />}
        />
        <Card.Content>
          <Text variant="bodyMedium">Rol: {ROTULO_ROL[usuario.rol]}</Text>
        </Card.Content>
      </Card>
      <Button mode="outlined" icon="logout" onPress={logout} style={estilos.boton}>
        Cerrar sesión
      </Button>
    </View>
  );
}

const estilos = StyleSheet.create({
  contenedor: { flex: 1, padding: 16, gap: 16 },
  boton: { alignSelf: 'stretch' },
});
