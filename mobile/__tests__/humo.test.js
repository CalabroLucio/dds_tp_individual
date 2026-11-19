import { Text } from 'react-native';
import { render, screen } from '@testing-library/react-native';

describe('entorno de tests mobile', () => {
  it('renderiza un componente de React Native', async () => {
    await render(<Text>AI Ticket It</Text>);
    expect(screen.getByText('AI Ticket It')).toBeOnTheScreen();
  });
});
