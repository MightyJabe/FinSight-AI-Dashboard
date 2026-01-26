import { render } from '@testing-library/react';
import { axe } from 'jest-axe';

import { Input } from '../input';

describe('Input Accessibility', () => {
  it('should not have accessibility violations with default variant', async () => {
    const { container } = render(<Input aria-label="Text input" />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('should not have accessibility violations with label', async () => {
    const { container } = render(<Input label="Email address" type="email" />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('should not have accessibility violations with required field', async () => {
    const { container } = render(<Input label="Username" required />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('should not have accessibility violations with error state', async () => {
    const { container } = render(
      <Input label="Email" type="email" error="Invalid email address" />
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('should not have accessibility violations with helper text', async () => {
    const { container } = render(
      <Input label="Password" type="password" helperText="Must be at least 8 characters" />
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('should not have accessibility violations when disabled', async () => {
    const { container } = render(<Input label="Disabled input" disabled />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('should not have accessibility violations with placeholder', async () => {
    const { container } = render(
      <Input label="Search" placeholder="Enter search term..." />
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('should not have accessibility violations with different sizes', async () => {
    const { container: smContainer } = render(<Input label="Small" inputSize="sm" />);
    const smResults = await axe(smContainer);
    expect(smResults).toHaveNoViolations();

    const { container: mdContainer } = render(<Input label="Medium" inputSize="md" />);
    const mdResults = await axe(mdContainer);
    expect(mdResults).toHaveNoViolations();

    const { container: lgContainer } = render(<Input label="Large" inputSize="lg" />);
    const lgResults = await axe(lgContainer);
    expect(lgResults).toHaveNoViolations();
  });

  it('should not have accessibility violations with success variant', async () => {
    const { container } = render(<Input label="Valid email" variant="success" type="email" />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('should not have accessibility violations with left icon', async () => {
    const { container } = render(
      <Input label="Search" leftIcon={<span>🔍</span>} aria-label="Search input" />
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('should not have accessibility violations with right icon', async () => {
    const { container } = render(
      <Input label="Amount" rightIcon={<span>$</span>} type="number" />
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('should not have accessibility violations with different input types', async () => {
    const types = ['text', 'email', 'password', 'number', 'tel', 'url'];

    for (const type of types) {
      const { container } = render(<Input label={`${type} input`} type={type} />);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    }
  });

  it('should have proper focus styles', async () => {
    const { container } = render(<Input label="Focus test" />);
    const input = container.querySelector('input');

    // Check for focus-visible styles
    expect(input?.className).toContain('focus-visible:outline-none');
    expect(input?.className).toContain('focus-visible:ring-1');
    expect(input?.className).toContain('focus-visible:ring-ring');

    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('should have proper disabled state styling', async () => {
    const { container } = render(<Input label="Disabled" disabled />);
    const input = container.querySelector('input');

    // Check for disabled styling
    expect(input?.className).toContain('disabled:cursor-not-allowed');
    expect(input?.className).toContain('disabled:opacity-50');
    expect(input).toBeDisabled();

    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('should properly associate label with input', () => {
    const { container } = render(<Input label="Full Name" id="fullName" />);
    const label = container.querySelector('label');
    const input = container.querySelector('input');

    // Label should be present
    expect(label).toBeInTheDocument();
    expect(label).toHaveTextContent('Full Name');

    // Input should exist
    expect(input).toBeInTheDocument();
  });

  it('should show required indicator when required', () => {
    const { container } = render(<Input label="Required field" required />);
    const requiredIndicator = container.querySelector('.text-destructive');

    expect(requiredIndicator).toBeInTheDocument();
    expect(requiredIndicator).toHaveTextContent('*');
  });

  it('should display error message with proper styling', async () => {
    const errorMessage = 'This field is required';
    const { container } = render(<Input label="Field" error={errorMessage} />);

    const errorText = container.querySelector('.text-destructive');
    expect(errorText).toBeInTheDocument();
    expect(errorText).toHaveTextContent(errorMessage);

    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('should display helper text when no error', () => {
    const helperText = 'Enter your email address';
    const { container } = render(<Input label="Email" helperText={helperText} />);

    const helper = container.querySelector('.text-muted-foreground');
    expect(helper).toBeInTheDocument();
    expect(helper).toHaveTextContent(helperText);
  });

  it('should prioritize error over helper text', () => {
    const errorMessage = 'Invalid input';
    const helperText = 'This is helper text';
    const { container } = render(
      <Input label="Field" error={errorMessage} helperText={helperText} />
    );

    // Error should be shown
    expect(container).toHaveTextContent(errorMessage);
    // Helper text should not be shown when there's an error
    const helper = container.querySelector('.text-muted-foreground');
    expect(helper).not.toBeInTheDocument();
  });
});
