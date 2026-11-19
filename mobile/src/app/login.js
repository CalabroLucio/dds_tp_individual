import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';
import { Button, HelperText, Surface, Text, TextInput } from 'react-native-paper';
import { router } from 'expo-router';
import { useSession } from '../session/SessionProvider';
import { colores } from '../theme/tema';

function validar({ email, password }) {
  const errores = {};
  if (!email.trim()) errores.email = 'Ingresá tu email';
  else if (!/^\S+@\S+\.\S+$/.test(email.trim())) errores.email = 'Ingresá un email válido';
  if (!password) errores.password = 'Ingresá tu contraseña';
  return errores;
}

export default function PantallaLogin() {
  const { login } = useSession();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errores, setErrores] = useState({});
  const [errorGeneral, setErrorGeneral] = useState(null);
  const [enviando, setEnviando] = useState(false);
  const [verPassword, setVerPassword] = useState(false);

  async function ingresar() {
    const encontrados = validar({ email, password });
    setErrores(encontrados);
    setErrorGeneral(null);
    if (Object.keys(encontrados).length > 0) return;

    setEnviando(true);
    try {
      await login(email.trim(), password);
      router.replace('/');
    } catch (error) {
      setErrorGeneral(error.mensaje ?? 'No se pudo iniciar sesión');
    } finally {
      setEnviando(false);
    }
  }

  return (
    <KeyboardAvoidingView style={estilos.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={estilos.contenedor} keyboardShouldPersistTaps="handled">
        <View style={estilos.marca}>
          <Surface style={estilos.logo} elevation={2}>
            <Text style={estilos.logoTexto}>AI</Text>
          </Surface>
          <Text variant="headlineMedium" style={estilos.titulo}>
            Ticket <Text style={{ color: colores.marca }}>It</Text>
          </Text>
          <Text variant="labelLarge" style={estilos.lema}>
            ENTRADAS A UN CLICK
          </Text>
        </View>

        <TextInput
          label="Email"
          accessibilityLabel="Email"
          mode="outlined"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          autoComplete="email"
          keyboardType="email-address"
          error={Boolean(errores.email)}
        />
        <HelperText type="error" visible={Boolean(errores.email)}>
          {errores.email}
        </HelperText>

        <TextInput
          label="Contraseña"
          accessibilityLabel="Contraseña"
          mode="outlined"
          value={password}
          onChangeText={setPassword}
          secureTextEntry={!verPassword}
          right={
            <TextInput.Icon
              icon={verPassword ? 'eye-off' : 'eye'}
              onPress={() => setVerPassword((v) => !v)}
              accessibilityLabel={verPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
            />
          }
          error={Boolean(errores.password)}
          onSubmitEditing={ingresar}
        />
        <HelperText type="error" visible={Boolean(errores.password)}>
          {errores.password}
        </HelperText>

        {errorGeneral ? (
          <HelperText type="error" visible style={estilos.errorGeneral}>
            {errorGeneral}
          </HelperText>
        ) : null}

        <Button
          mode="contained"
          onPress={ingresar}
          loading={enviando}
          disabled={enviando}
          style={estilos.boton}
        >
          Ingresar
        </Button>

        <Text variant="bodySmall" style={estilos.ayuda}>
          Usuarios de prueba: ana@tickets.test (comprador) o martina@tickets.test (organizador), contraseña
          demo1234
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const estilos = StyleSheet.create({
  flex: { flex: 1 },
  contenedor: { flexGrow: 1, justifyContent: 'center', padding: 24 },
  marca: { alignItems: 'center', marginBottom: 32 },
  logo: {
    backgroundColor: colores.marca,
    borderRadius: 16,
    paddingHorizontal: 22,
    paddingVertical: 10,
    marginBottom: 12,
  },
  logoTexto: { color: '#FFFFFF', fontSize: 32, fontWeight: '800' },
  titulo: { fontWeight: '800' },
  lema: { letterSpacing: 3, opacity: 0.6, marginTop: 4 },
  errorGeneral: { textAlign: 'center' },
  boton: { marginTop: 8, paddingVertical: 4 },
  ayuda: { marginTop: 24, textAlign: 'center', opacity: 0.6 },
});
