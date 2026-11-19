import { useRef, useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';
import { Button, Card, Chip, IconButton, Text, TextInput } from 'react-native-paper';
import { router, Stack } from 'expo-router';
import { useCategorias, useCrearEvento } from '../../hooks/useEventos';
import { CampoFechaHora } from '../../components/CampoFechaHora';
import { ErroresFormulario } from '../../components/ErroresFormulario';
import { Cargando } from '../../components/Cargando';

function mananaALas21() {
  const fecha = new Date();
  fecha.setDate(fecha.getDate() + 1);
  fecha.setHours(21, 0, 0, 0);
  return fecha;
}

const tipoVacio = (clave, nombre = '') => ({ clave, nombre, descripcion: '', precio: '', cupo: '' });
// Los números se envían tal cual los escribió el usuario: las reglas (≥ 0, > 0, decimales) las valida el backend.
const aNumero = (texto) => (texto.trim() === '' ? null : Number(texto.replace(',', '.')));

export default function PantallaNuevoEvento() {
  const categorias = useCategorias();
  const crear = useCrearEvento();
  const siguienteClave = useRef(2);

  const [nombre, setNombre] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [categoriaId, setCategoriaId] = useState(null);
  const [fecha, setFecha] = useState(mananaALas21);
  const [multimedia, setMultimedia] = useState([]);
  const [urlNueva, setUrlNueva] = useState('');
  const [tipos, setTipos] = useState([tipoVacio(1, 'General')]);

  // Si el usuario todavía no eligió, queda seleccionada la primera categoría.
  const categoriaElegida = categoriaId ?? categorias.data?.[0]?.id ?? null;

  const cambiarTipo = (clave, campo, valor) =>
    setTipos((actuales) => actuales.map((t) => (t.clave === clave ? { ...t, [campo]: valor } : t)));

  function agregarTipo() {
    setTipos((actuales) => [...actuales, tipoVacio(siguienteClave.current++)]);
  }

  function agregarUrl() {
    const url = urlNueva.trim();
    if (!url) return;
    setMultimedia((actuales) => [...actuales, url]);
    setUrlNueva('');
  }

  function publicar() {
    crear.mutate(
      {
        nombre,
        descripcion,
        categoriaId: categoriaElegida,
        fecha: fecha.toISOString(),
        multimedia,
        tiposEntrada: tipos.map((t) => ({
          nombre: t.nombre,
          descripcion: t.descripcion,
          precio: aNumero(t.precio),
          cupo: aNumero(t.cupo),
        })),
      },
      { onSuccess: () => router.replace('/organizador/mis-eventos') },
    );
  }

  if (categorias.isPending) return <Cargando />;

  return (
    <KeyboardAvoidingView style={estilos.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <Stack.Screen options={{ title: 'Nuevo evento' }} />
      <ScrollView contentContainerStyle={estilos.contenido} keyboardShouldPersistTaps="handled">
        <TextInput
          label="Nombre del evento"
          accessibilityLabel="Nombre del evento"
          mode="outlined"
          value={nombre}
          onChangeText={setNombre}
        />
        <TextInput
          label="Descripción"
          accessibilityLabel="Descripción"
          mode="outlined"
          value={descripcion}
          onChangeText={setDescripcion}
          multiline
          numberOfLines={4}
        />

        <Text variant="labelLarge">Categoría</Text>
        <View style={estilos.chips}>
          {(categorias.data ?? []).map((c) => (
            <Chip
              key={c.id}
              selected={c.id === categoriaElegida}
              showSelectedOverlay
              onPress={() => setCategoriaId(c.id)}
            >
              {c.nombre}
            </Chip>
          ))}
        </View>

        <CampoFechaHora valor={fecha} onCambiar={setFecha} />

        <Text variant="labelLarge">Imágenes (enlaces)</Text>
        <View style={estilos.fila}>
          <TextInput
            style={estilos.flex}
            dense
            mode="outlined"
            label="https://…"
            accessibilityLabel="Enlace de imagen"
            value={urlNueva}
            onChangeText={setUrlNueva}
            autoCapitalize="none"
            keyboardType="url"
          />
          <IconButton icon="plus" mode="contained" onPress={agregarUrl} accessibilityLabel="Agregar imagen" />
        </View>
        <View style={estilos.chips}>
          {multimedia.map((url, i) => (
            <Chip
              key={`${url}-${i}`}
              icon="image-outline"
              onClose={() => setMultimedia((actuales) => actuales.filter((_, j) => j !== i))}
            >
              {`Imagen ${i + 1}`}
            </Chip>
          ))}
        </View>

        <Text variant="titleMedium" style={estilos.seccion}>
          Tipos de entrada
        </Text>
        {tipos.map((tipo, i) => (
          <Card key={tipo.clave} mode="outlined">
            <Card.Title
              title={`Tipo ${i + 1}`}
              right={() =>
                tipos.length > 1 ? (
                  <IconButton
                    icon="delete-outline"
                    accessibilityLabel={`Quitar tipo ${i + 1}`}
                    onPress={() => setTipos((actuales) => actuales.filter((t) => t.clave !== tipo.clave))}
                  />
                ) : null
              }
            />
            <Card.Content style={estilos.tipo}>
              <TextInput
                label="Nombre (General, Platea, VIP…)"
                accessibilityLabel={`Nombre del tipo ${i + 1}`}
                mode="outlined"
                dense
                value={tipo.nombre}
                onChangeText={(v) => cambiarTipo(tipo.clave, 'nombre', v)}
              />
              <TextInput
                label="Descripción (opcional)"
                accessibilityLabel={`Descripción del tipo ${i + 1}`}
                mode="outlined"
                dense
                value={tipo.descripcion}
                onChangeText={(v) => cambiarTipo(tipo.clave, 'descripcion', v)}
              />
              <View style={estilos.fila}>
                <TextInput
                  style={estilos.flex}
                  label="Precio"
                  accessibilityLabel={`Precio del tipo ${i + 1}`}
                  mode="outlined"
                  dense
                  keyboardType="decimal-pad"
                  left={<TextInput.Affix text="$" />}
                  value={tipo.precio}
                  onChangeText={(v) => cambiarTipo(tipo.clave, 'precio', v)}
                />
                <TextInput
                  style={estilos.flex}
                  label="Cupo"
                  accessibilityLabel={`Cupo del tipo ${i + 1}`}
                  mode="outlined"
                  dense
                  keyboardType="number-pad"
                  value={tipo.cupo}
                  onChangeText={(v) => cambiarTipo(tipo.clave, 'cupo', v)}
                />
              </View>
            </Card.Content>
          </Card>
        ))}
        <Button mode="outlined" icon="ticket-outline" onPress={agregarTipo}>
          Agregar tipo de entrada
        </Button>

        <ErroresFormulario error={crear.error} />

        <Button
          mode="contained"
          icon="check"
          onPress={publicar}
          loading={crear.isPending}
          disabled={crear.isPending}
          style={estilos.publicar}
        >
          Publicar evento
        </Button>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const estilos = StyleSheet.create({
  flex: { flex: 1 },
  contenido: { padding: 16, gap: 12, paddingBottom: 48 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  fila: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  seccion: { marginTop: 8 },
  tipo: { gap: 8 },
  publicar: { marginTop: 8, paddingVertical: 4 },
});
