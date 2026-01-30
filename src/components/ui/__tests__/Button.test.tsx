import { render } from '@testing-library/react';
import { axe } from 'jest-axe';

import { Button } from '../button';

describe('Button Accessibility', () => {
  it('should not have accessibility violations with default variant', async () => {
    const { container } = render(<Button>Click me</Button>);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('should not have accessibility violations with primary variant', async () => {
    const { container } = render(<Button variant="primary">Primary Button</Button>);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('should not have accessibility violations with destructive variant', async () => {
    const { container } = render(<Button variant="destructive">Delete</Button>);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('should not have accessibility violations with outline variant', async () => {
    const { container } = render(<Button variant="outline">Outline Button</Button>);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('should not have accessibility violations with ghost variant', async () => {
    const { container } = render(<Button variant="ghost">Ghost Button</Button>);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('should not have accessibility violations when disabled', async () => {
    const { container } = render(<Button disabled>Disabled Button</Button>);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('should not have accessibility violations when loading', async () => {
    const { container } = render(<Button loading>Loading...</Button>);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('should not have accessibility violations with different sizes', async () => {
    const { container: smContainer } = render(<Button size="sm">Small</Button>);
    const smResults = await axe(smContainer);
    expect(smResults).toHaveNoViolations();

    const { container: mdContainer } = render(<Button size="md">Medium</Button>);
    const mdResults = await axe(mdContainer);
    expect(mdResults).toHaveNoViolations();

    const { container: lgContainer } = render(<Button size="lg">Large</Button>);
    const lgResults = await axe(lgContainer);
    expect(lgResults).toHaveNoViolations();
  });

  it('should not have accessibility violations with icon button', async () => {
    const { container } = render(
      <Button size="icon" aria-label="Close dialog">
        ×
      </Button>
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('should not have accessibility violations with left icon', async () => {
    const { container } = render(
      <Button leftIcon={<span>→</span>}>Button with Icon</Button>
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('should not have accessibility violations with right icon', async () => {
    const { container } = render(
      <Button rightIcon={<span>→</span>}>Button with Icon</Button>
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('should not have accessibility violations as link variant', async () => {
    const { container } = render(<Button variant="link">Link Button</Button>);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('should not have accessibility violations with success variant', async () => {
    const { container } = render(<Button variant="success">Success</Button>);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('should have proper focus styles', async () => {
    const { container } = render(<Button>Focus Test</Button>);
    const button = container.querySelector('button');

    // Check for focus-visible styles
    expect(button?.className).toContain('focus-visible:outline-none');
    expect(button?.className).toContain('focus-visible:ring-2');
    expect(button?.className).toContain('focus-visible:ring-ring');

    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('should have proper disabled state styling', async () => {
    const { container } = render(<Button disabled>Disabled</Button>);
    const button = container.querySelector('button');

    // Check for disabled styling
    expect(button?.className).toContain('disabled:pointer-events-none');
    expect(button?.className).toContain('disabled:opacity-50');
    expect(button?.disabled).toBe(true);

    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
