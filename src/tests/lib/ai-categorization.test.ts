import { jest } from '@jest/globals';
import { categorizeTransaction, categorizeTransactionsBatch, EXPENSE_CATEGORIES, INCOME_CATEGORIES } from '@/lib/ai-categorization';
import { generateChatCompletion } from '@/lib/openai';

const mockGenerateChatCompletion = generateChatCompletion as jest.MockedFunction<typeof generateChatCompletion>;

describe('AI Categorization', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Ensure server-side environment for AI categorization
    if (global.isServerSide) {
      global.isServerSide();
    }
  });

  afterEach(() => {
    // Restore window for other tests
    if (global.restoreWindow) {
      global.restoreWindow();
    }
  });

  describe('categorizeTransaction', () => {
    it('should call OpenAI and parse valid JSON response', async () => {
      // Mock AI response with specific category
      mockGenerateChatCompletion.mockResolvedValueOnce({
        content: JSON.stringify({
          category: EXPENSE_CATEGORIES.GROCERIES,
          confidence: 95,
          reasoning: 'Transaction at supermarket for food items'
        }),
        role: 'assistant'
      });

      const transaction = {
        amount: 45.67,
        description: 'WHOLE FOODS MARKET',
        date: '2024-01-15',
        merchant_name: 'Whole Foods',
        payment_channel: 'in store'
      };

      const result = await categorizeTransaction(transaction);

      expect(result).toEqual({
        category: EXPENSE_CATEGORIES.GROCERIES,
        confidence: 95,
        reasoning: 'Transaction at supermarket for food items'
      });

      expect(mockGenerateChatCompletion).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({ role: 'system' }),
          expect.objectContaining({ role: 'user' })
        ]),
        expect.objectContaining({
          model: 'gpt-4o',
          temperature: 0.3,
          maxTokens: 300
        })
      );
    });

    it('should categorize an income transaction correctly', async () => {
      // Mock AI response
      mockGenerateChatCompletion.mockResolvedValueOnce({
        content: JSON.stringify({
          category: INCOME_CATEGORIES.SALARY,
          confidence: 98,
          reasoning: 'Regular payroll deposit'
        }),
        role: 'assistant'
      });

      const transaction = {
        amount: -3000.00, // Negative amount indicates income in Plaid
        description: 'PAYROLL DEPOSIT',
        date: '2024-01-01'
      };

      const result = await categorizeTransaction(transaction);

      expect(result).toEqual({
        category: INCOME_CATEGORIES.SALARY,
        confidence: 98,
        reasoning: 'Regular payroll deposit'
      });
    });

    it('should handle AI errors gracefully with fallback categorization', async () => {
      // Mock AI error
      mockGenerateChatCompletion.mockRejectedValueOnce(new Error('API Error'));

      const transaction = {
        amount: 50.00,
        description: 'STARBUCKS COFFEE',
        date: '2024-01-15'
      };

      const result = await categorizeTransaction(transaction);

      expect(result.category).toBe(EXPENSE_CATEGORIES.DINING_OUT);
      expect(result.confidence).toBeLessThan(100);
      expect(result.reasoning).toContain('Pattern match');
    });

    it('should handle invalid JSON response with fallback', async () => {
      // Mock invalid JSON response
      mockGenerateChatCompletion.mockResolvedValueOnce({
        content: 'Invalid JSON response',
        role: 'assistant'
      });

      const transaction = {
        amount: 25.00,
        description: 'GROCERY STORE',
        date: '2024-01-15'
      };

      const result = await categorizeTransaction(transaction);

      expect(result.category).toBe(EXPENSE_CATEGORIES.GROCERIES);
      expect(result.confidence).toBeLessThan(100);
      expect(result.reasoning).toContain('Pattern match');
    });
  });

  describe('categorizeTransactionsBatch', () => {
    it('should process multiple transactions in batches', async () => {
      // Mock AI responses for each transaction
      mockGenerateChatCompletion
        .mockResolvedValueOnce({
          content: JSON.stringify({
            category: EXPENSE_CATEGORIES.GROCERIES,
            confidence: 95,
            reasoning: 'Grocery store purchase'
          }),
          role: 'assistant'
        })
        .mockResolvedValueOnce({
          content: JSON.stringify({
            category: EXPENSE_CATEGORIES.TRANSPORTATION,
            confidence: 90,
            reasoning: 'Gas station purchase'
          }),
          role: 'assistant'
        });

      const transactions = [
        {
          id: '1',
          amount: 45.67,
          description: 'WHOLE FOODS',
          date: '2024-01-15'
        },
        {
          id: '2',
          amount: 35.00,
          description: 'SHELL GAS STATION',
          date: '2024-01-14'
        }
      ];

      const results = await categorizeTransactionsBatch(transactions);

      expect(results).toHaveLength(2);
      expect(results[0]).toMatchObject({
        id: '1',
        aiCategory: EXPENSE_CATEGORIES.GROCERIES,
        aiConfidence: 95,
        type: 'expense'
      });
      expect(results[1]).toMatchObject({
        id: '2',
        aiCategory: EXPENSE_CATEGORIES.TRANSPORTATION,
        aiConfidence: 90,
        type: 'expense'
      });
    });

    it('should handle empty transaction array', async () => {
      const results = await categorizeTransactionsBatch([]);
      expect(results).toEqual([]);
      expect(mockGenerateChatCompletion).not.toHaveBeenCalled();
    });
  });

  describe('fallback categorization', () => {
    it('should categorize common expense patterns correctly', async () => {
      const testCases = [
        { description: 'RENT PAYMENT', expected: EXPENSE_CATEGORIES.HOUSING },
        { description: 'ELECTRIC BILL', expected: EXPENSE_CATEGORIES.UTILITIES },
        { description: 'UBER RIDE', expected: EXPENSE_CATEGORIES.TRANSPORTATION },
        { description: 'NETFLIX SUBSCRIPTION', expected: EXPENSE_CATEGORIES.ENTERTAINMENT }
      ];

      for (const testCase of testCases) {
        // Mock AI error for each test case
        mockGenerateChatCompletion.mockRejectedValueOnce(new Error('API Error'));
        
        const result = await categorizeTransaction({
          amount: 50.00,
          description: testCase.description,
          date: '2024-01-15'
        });

        expect(result.category).toBe(testCase.expected);
        expect(result.confidence).toBeLessThan(100);
        expect(result.reasoning).toContain('Pattern match');
      }
    });

    it('should categorize income patterns correctly', async () => {
      const testCases = [
        { description: 'SALARY DEPOSIT', expected: INCOME_CATEGORIES.SALARY },
        { description: 'FREELANCE PAYMENT', expected: INCOME_CATEGORIES.FREELANCE }
      ];

      for (const testCase of testCases) {
        // Mock AI error for each test case
        mockGenerateChatCompletion.mockRejectedValueOnce(new Error('API Error'));
        
        const result = await categorizeTransaction({
          amount: -3000.00, // Negative for income
          description: testCase.description,
          date: '2024-01-15'
        });

        expect(result.category).toBe(testCase.expected);
        expect(result.confidence).toBeLessThan(100);
        expect(result.reasoning).toContain('Pattern match');
      }
    });
  });
});