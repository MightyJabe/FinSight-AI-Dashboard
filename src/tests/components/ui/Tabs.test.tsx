import '@testing-library/jest-dom';

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs';

describe('Tabs', () => {
  it('renders tabs with content', () => {
    render(
      <Tabs defaultValue="tab1">
        <TabsList>
          <TabsTrigger value="tab1">Tab 1</TabsTrigger>
          <TabsTrigger value="tab2">Tab 2</TabsTrigger>
        </TabsList>
        <TabsContent value="tab1">Content 1</TabsContent>
        <TabsContent value="tab2">Content 2</TabsContent>
      </Tabs>
    );

    // Check if tabs are rendered
    expect(screen.getByRole('tab', { name: 'Tab 1' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Tab 2' })).toBeInTheDocument();

    // Check if initial content is rendered
    expect(screen.getByText('Content 1')).toBeVisible();

    // Find all tabpanels
    const tabpanels = screen.getAllByRole('tabpanel', { hidden: true });

    // The first panel should be active and visible
    const activePanel = screen.getByRole('tabpanel', { hidden: false });
    expect(activePanel).toHaveTextContent('Content 1');
    expect(activePanel).toHaveAttribute('data-state', 'active');

    // The second panel should be inactive and hidden
    const inactivePanel = tabpanels.find(panel => panel.getAttribute('data-state') === 'inactive');
    expect(inactivePanel).toHaveTextContent('Content 2');
    expect(inactivePanel).toHaveAttribute('data-state', 'inactive');
    expect(inactivePanel).toHaveAttribute('hidden');
  });

  it('switches content when clicking tabs', async () => {
    const user = userEvent.setup();
    render(
      <Tabs defaultValue="tab1">
        <TabsList>
          <TabsTrigger value="tab1">Tab 1</TabsTrigger>
          <TabsTrigger value="tab2">Tab 2</TabsTrigger>
        </TabsList>
        <TabsContent value="tab1">Content 1</TabsContent>
        <TabsContent value="tab2">Content 2</TabsContent>
      </Tabs>
    );

    // Initially, Tab 1 should be active
    expect(screen.getByRole('tab', { name: 'Tab 1' })).toHaveAttribute('data-state', 'active');
    expect(screen.getByText('Content 1')).toBeVisible();

    // Click Tab 2
    await user.click(screen.getByRole('tab', { name: 'Tab 2' }));

    // Tab 2 should now be active
    expect(screen.getByRole('tab', { name: 'Tab 2' })).toHaveAttribute('data-state', 'active');
    expect(screen.getByText('Content 2')).toBeVisible();
  });

  it('applies custom className', () => {
    render(
      <Tabs defaultValue="tab1">
        <TabsList className="custom-list">
          <TabsTrigger value="tab1" className="custom-trigger">
            Tab 1
          </TabsTrigger>
        </TabsList>
        <TabsContent value="tab1" className="custom-content">
          Content 1
        </TabsContent>
      </Tabs>
    );

    expect(screen.getByRole('tablist')).toHaveClass('custom-list');
    expect(screen.getByRole('tab')).toHaveClass('custom-trigger');
    expect(screen.getByText('Content 1')).toHaveClass('custom-content');
  });
});
