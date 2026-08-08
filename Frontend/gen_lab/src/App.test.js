import { render, screen } from '@testing-library/react';
import { AuthProvider } from './AuthContext';
import App from './App';

test('renders the login screen by default', () => {
  render(
    <AuthProvider>
      <App />
    </AuthProvider>
  );
  const heading = screen.getByText(/Login to Genlab Task Manager/i);
  expect(heading).toBeInTheDocument();
});
