import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import InsightsPage from '@/app/insights/page';
import { useSession } from '@/components/providers/SessionProvider';

// Mock fetch
global.fetch = jest.fn();

const mockUseSession = useSession as jest.MockedFunction<typeof useSession>;

describe('<InsightsPage />', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Default to authenticated user
    mockUseSession.mockReturnValue({
      user: {
        getIdToken: jest.fn().mockResolvedValue('test-token'),
      },
      loading: false,
    });
    // Default successful fetch mock for all calls
    (global.fetch as jest.Mock).mockImplementationOnce(() =>
      Promise.resolve({
        ok: true,
        json: async () => ({
          insights: [
            {
              title: 'AI Insight 1',
              description: 'Desc 1',
              actionItems: ['Action 1'],
              priority: 'high',
            },
          ],
          summary: 'Test Summary',
          nextSteps: ['Test Next Step'],
          metrics: {
            netWorth: 10000,
            totalAssets: 15000,
            totalLiabilities: 5000,
            spendingByCategory: { Food: 200, Travel: 300 },
            monthlySpending: { '2024-01': 500, '2024-02': 600 },
          },
          plaidDataAvailable: true,
        }),
      })
    );
  });

  test('should display loading state initially', () => {
    mockUseSession.mockReturnValueOnce({ user: null, loading: true });
    render(<InsightsPage />);
    expect(screen.getByText('Loading insights...')).toBeInTheDocument();
  });

  test('should display error message if user is not logged in', async () => {
    mockUseSession.mockReturnValue({ user: null, loading: false });
    render(<InsightsPage />);
    await waitFor(() => {
      expect(screen.getByText('Please log in to view insights')).toBeInTheDocument();
    });
  });

  test('should fetch and display insights successfully', async () => {
    render(<InsightsPage />);

    await waitFor(() => {
      expect(screen.getByText('Financial Insights')).toBeInTheDocument();
    });

    // Check for summary and next steps
    expect(screen.getByText(/Test Summary/)).toBeInTheDocument();
    expect(screen.getByText(/Test Next Step/)).toBeInTheDocument();

    // Check for an insight title
    expect(screen.getByText('AI Insight 1')).toBeInTheDocument();
    expect(screen.getByText('Desc 1')).toBeInTheDocument();

    // Check metrics
    expect(screen.getByText('$10,000')).toBeInTheDocument(); // Net worth
    expect(screen.getByText('$1,100')).toBeInTheDocument(); // Total Monthly Spending (500+600)

    // Check spending category
    expect(screen.getByText('Food')).toBeInTheDocument();
    expect(screen.getByText('$200')).toBeInTheDocument();

    // Check Plaid data available (no warning should be shown)
    expect(screen.queryByText('Limited Insight Accuracy')).not.toBeInTheDocument();
  });

  test('should display Plaid data unavailable warning if plaidDataAvailable is false', async () => {
    (global.fetch as jest.Mock).mockReset(); // Clear previous default mock
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        insights: [],
        summary: 'Summary with no plaid',
        nextSteps: [],
        metrics: {
          netWorth: 100,
          totalAssets: 100,
          totalLiabilities: 0,
          spendingByCategory: {},
          monthlySpending: {},
        },
        plaidDataAvailable: false,
      }),
    });
    render(<InsightsPage />);
    await waitFor(() => {
      expect(screen.getByText('Limited Insight Accuracy')).toBeInTheDocument();
    });
  });

  test('refresh button should re-fetch insights', async () => {
    // Set up fetch to return different results for first and second call
    (global.fetch as jest.Mock).mockReset();
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          insights: [
            {
              title: 'AI Insight 1',
              description: 'Desc 1',
              actionItems: ['Action 1'],
              priority: 'high',
            },
          ],
          summary: 'Test Summary',
          nextSteps: ['Test Next Step'],
          metrics: {
            netWorth: 10000,
            totalAssets: 15000,
            totalLiabilities: 5000,
            spendingByCategory: { Food: 200, Travel: 300 },
            monthlySpending: { '2024-01': 500, '2024-02': 600 },
          },
          plaidDataAvailable: true,
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          insights: [
            {
              title: 'Refreshed Insight',
              description: 'Fresh Desc',
              actionItems: [],
              priority: 'medium',
            },
          ],
          summary: 'Refreshed Summary',
          nextSteps: [],
          metrics: {
            netWorth: 20000,
            totalAssets: 0,
            totalLiabilities: 0,
            spendingByCategory: {},
            monthlySpending: {},
          },
          plaidDataAvailable: true,
        }),
      });

    render(<InsightsPage />);
    await waitFor(() => {
      expect(screen.getByText('AI Insight 1')).toBeInTheDocument();
    });

    const refreshButton = screen.getByRole('button', { name: /Refresh Insights/i });
    await act(async () => {
      userEvent.click(refreshButton);
    });

    await waitFor(() => {
      expect(screen.getByText('Refreshed Insight')).toBeInTheDocument();
    });
    // Allow for additional fetch calls that may occur during the test
    expect((global.fetch as jest.Mock).mock.calls.length).toBeGreaterThanOrEqual(2);
  });

  test('accordion for action items should expand and collapse', async () => {
    render(<InsightsPage />);
    await waitFor(() => {
      expect(screen.getByText('AI Insight 1')).toBeInTheDocument();
    });

    const actionButton = screen.getByRole('button', { name: /Actionable Steps/i });
    expect(screen.queryByText('Action 1')).not.toBeInTheDocument();

    // Expand
    await act(async () => {
      userEvent.click(actionButton);
    });
    await waitFor(() => {
      expect(screen.getByText('Action 1')).toBeVisible();
    });

    // Collapse
    await act(async () => {
      userEvent.click(actionButton);
    });
    await waitFor(() => {
      expect(screen.queryByText('Action 1')).not.toBeInTheDocument();
    });
  });

  // Add tests for error state from fetch, different priorities rendering, etc.
});
