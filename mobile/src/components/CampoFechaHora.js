import { useState } from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import { Button, Text } from 'react-native-paper';
import DateTimePicker, { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import { formatearFecha } from '../utils/formato';

// En Android el selector es imperativo: primero la fecha y después la hora.
export function CampoFechaHora({ valor, onCambiar, etiqueta = 'Fecha y hora' }) {
  const [mostrarIos, setMostrarIos] = useState(false);

  function abrir() {
    if (Platform.OS !== 'android') {
      setMostrarIos(true);
      return;
    }
    DateTimePickerAndroid.open({
      value: valor,
      mode: 'date',
      minimumDate: new Date(),
      onChange: (evento, fecha) => {
        if (evento.type !== 'set' || !fecha) return;
        DateTimePickerAndroid.open({
          value: fecha,
          mode: 'time',
          is24Hour: true,
          onChange: (eventoHora, conHora) => {
            if (eventoHora.type === 'set' && conHora) onCambiar(conHora);
          },
        });
      },
    });
  }

  return (
    <View style={estilos.contenedor}>
      <Text variant="labelLarge">{etiqueta}</Text>
      <View style={estilos.fila}>
        <Text variant="bodyLarge" accessibilityLabel={`${etiqueta}: ${formatearFecha(valor.toISOString())}`}>
          {formatearFecha(valor.toISOString())}
        </Text>
        <Button mode="text" icon="calendar-edit" onPress={abrir}>
          Cambiar
        </Button>
      </View>
      {mostrarIos ? (
        <DateTimePicker
          value={valor}
          mode="datetime"
          minimumDate={new Date()}
          onChange={(_e, fecha) => {
            setMostrarIos(false);
            if (fecha) onCambiar(fecha);
          }}
        />
      ) : null}
    </View>
  );
}

const estilos = StyleSheet.create({
  contenedor: { gap: 4 },
  fila: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
});
