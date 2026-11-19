import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';
import { Button, HelperText, Text, TextInput } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useSession } from '../session/SessionProvider';
import { colores, fuentes, radios } from '../theme/tema';
import { Ticket } from '../components/Ticket';

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
      <LinearGradient
        colors={[colores.marcaSuave, colores.fondo]}
        locations={[0, 0.55]}
        style={StyleSheet.absoluteFill}
      />
      <ScrollView contentContainerStyle={estilos.contenedor} keyboardShouldPersistTaps="handled">
        <View style={estilos.marca}>
          <Ticket
            anchoTalon={70}
            colorFondo={colores.marca}
            style={estilos.logo}
            talon={<Text style={estilos.logoAi}>AI</Text>}
          >
            <Text style={estilos.logoCheck}>✓</Text>
          </Ticket>
          <Text style={estilos.titulo}>
            Ticket <Text style={estilos.tituloIt}>It</Text>
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
  flex: { flex: 1, backgroundColor: colores.fondo },
  contenedor: { flexGrow: 1, justifyContent: 'center', padding: 24, gap: 2 },
  marca: { alignItems: 'center', marginBottom: 36 },
  logo: { width: 150, height: 74, marginBottom: 18 },
  logoAi: { fontFamily: fuentes.negrita, fontSize: 30, color: colores.sobreMarca },
  logoCheck: { fontFamily: fuentes.negrita, fontSize: 28, color: colores.sobreMarca, textAlign: 'center' },
  titulo: { fontFamily: fuentes.negrita, fontSize: 36, color: colores.texto },
  tituloIt: { color: colores.marca },
  lema: { letterSpacing: 4, color: colores.textoSecundario, marginTop: 4 },
  errorGeneral: { textAlign: 'center' },
  boton: { marginTop: 12, borderRadius: radios.pildora },
  contenidoBoton: { paddingVertical: 8 },
  ayuda: { marginTop: 28, textAlign: 'center', color: colores.textoSecundario },
});
