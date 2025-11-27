import React from 'react';
import { render, screen } from '@testing-library/react';
import { StoreProvider } from '../contexts/StoreContext';
import Footer from './shared/Footer';
import '@testing-library/jest-dom';

// Mock the useStore hook to provide specific values for testing
jest.mock('../contexts/StoreContext', () => ({
  ...jest.requireActual('../contexts/StoreContext'), // Import and retain default behavior
  useStore: () => ({
    storeSettings: {
      nombre_tienda: 'Tienda de Prueba',
      direccion: 'Calle Falsa 123',
      telefono: '555-1234',
    },
  }),
}));

describe('Footer Component', () => {
  it('renders store information from context', () => {
    render(
      <StoreProvider>
        <Footer />
      </StoreProvider>
    );

    // Check if the store name is displayed
    expect(screen.getByText('Tienda de Prueba')).toBeInTheDocument();

    // Check if the address is displayed
    expect(screen.getByText('Calle Falsa 123')).toBeInTheDocument();

    // Check if the phone number is displayed
    expect(screen.getByText('555-1234')).toBeInTheDocument();
  });

  it('renders copyright information with the current year', () => {
    const currentYear = new Date().getFullYear();
    render(
      <StoreProvider>
        <Footer />
      </StoreProvider>
    );

    // Check for the copyright text, including the dynamic year and store name
    const copyrightText = screen.getByText(
      `© ${currentYear} Tienda de Prueba. Todos los derechos reservados.`
    );
    expect(copyrightText).toBeInTheDocument();
  });
});
