import { render, screen } from '@testing-library/react-native';
import { PaperProvider } from 'react-native-paper';
import { ChipEstado, ESTADOS } from '../../src/components/ChipEstado';
import { tema } from '../../src/theme/tema';

describe('ChipEstado', () => {
  it.each([
    ['PENDIENTE', 'Pendiente de pago'],
    ['CONFIRMADA', 'Confirmada'],
    ['UTILIZADA', 'Utilizada'],
    ['CANCELADA', 'Cancelada'],
    ['REEMBOLSADA', 'Reembolsada'],
  ])('muestra %s como "%s"', async (estado, rotulo) => {
    await render(
      <PaperProvider theme={tema}>
        <ChipEstado estado={estado} />
      </PaperProvider>,
    );
    expect(screen.getByText(rotulo)).toBeOnTheScreen();
    expect(screen.getByLabelText(`Estado: ${rotulo}`)).toBeOnTheScreen();
  });

  it('usa un color distinto para cada estado', () => {
    const colores = Object.values(ESTADOS).map((e) => e.color);
    expect(new Set(colores).size).toBe(colores.length);
  });
});
