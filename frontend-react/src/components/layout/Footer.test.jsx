import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Footer from './Footer';

describe('Footer Component', () => {
  test('renders the footer text', () => {
    render(
      <BrowserRouter>
        <Footer />
      </BrowserRouter>
    );
    expect(screen.getByText(/Thirasara Property/i)).toBeInTheDocument();
  });
});
