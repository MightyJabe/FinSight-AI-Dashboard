'use client';

import { AlertCircle, BarChart3, Bot, CheckCircle2, Clock, Copy, Download, Edit3, History, PiggyBank, Plus, RefreshCw, RotateCcw, Send, ThumbsDown, ThumbsUp, TrendingDown, TrendingUp, Trash2, Wifi, WifiOff } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';

import { ChatVisualization } from '@/components/chat/ChatVisualization';
import { useSession } from '@/components/providers/SessionProvider';
import { CardSkeleton } from '@/components/common/SkeletonLoader';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  status?: 'sending' | 'sent' | 'error';
  error?: string | undefined;
  rating?: 'like' | 'dislike' | null;
  visualizationData?: {
    type: 'spending' | 'networth' | 'budget' | 'trend' | 'accounts' | 'transactions';
    data: any;
  } | null;
}

interface Conversation {
  id: string;
  title: string;
  updatedAt: Date;
  messageCount: number;
}

// Types for API responses
type APIConversation = {
  id: string;
  title: string;
  updatedAt: string;
  messageCount: number;
};

type APIMessage = {
  role: 'user' | 'assistant';
  content: string;
};

/**
 *
 */
export default function ChatPage() {
  const { firebaseUser } = useSession();
  const [messages, setMessages] = useState<Message[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingConversations, setIsLoadingConversations] = useState(true);
  const [showConversationList, setShowConversationList] = useState(false);
  const [hasLoadedInitialConversation, setHasLoadedInitialConversation] = useState(false);
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);
  const [retryingMessageId, setRetryingMessageId] = useState<string | null>(null);
  const [regeneratingMessageId, setRegeneratingMessageId] = useState<string | null>(null);
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editingContent, setEditingContent] = useState('');
  const [messageRatings, setMessageRatings] = useState<Record<string, 'like' | 'dislike'>>({});
  const [isOnline, setIsOnline] = useState(true);
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'connecting' | 'disconnected'>('connected');
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [financialOverview, setFinancialOverview] = useState<{
    netWorth: number;
    monthlyIncome: number;
    monthlyExpenses: number;
    savingsRate: number;
    emergencyFund: number;
  } | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const copyMessageToClipboard = async (content: string, messageId: string) => {
    try {
      await navigator.clipboard.writeText(content);
      setCopiedMessageId(messageId);
      setTimeout(() => setCopiedMessageId(null), 2000);
    } catch (error) {
      console.error('Failed to copy message:', error);
    }
  };

  const retryMessage = async (messageId: string) => {
    const failedMessage = messages.find(msg => msg.id === messageId);
    if (!failedMessage || failedMessage.role !== 'user') return;

    setRetryingMessageId(messageId);
    
    // Update message status to sending
    setMessages(prev => prev.map(msg => 
      msg.id === messageId ? { ...msg, status: 'sending' as const, error: undefined } : msg
    ));
    
    setIsLoading(true);
    
    try {
      const token = await firebaseUser?.getIdToken();
      if (!token) throw new Error('Authentication required');
      
      const requestBody: Record<string, unknown> = {
        message: failedMessage.content,
        history: messages.filter(msg => msg.id !== messageId && !msg.id.startsWith('delete-error-')).map(m => ({ role: m.role, content: m.content })),
      };
      if (typeof currentConversationId === 'string') {
        requestBody.conversationId = currentConversationId;
      }

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        throw new Error('Failed to retry message');
      }

      const data = await response.json();
      
      // Update message status to sent
      setMessages(prev => prev.map(msg => 
        msg.id === messageId ? { ...msg, status: 'sent' } : msg
      ));
      
      // Extract visualization data from the response
      const visualizationData = extractVisualizationData(data.response);
      
      // Add AI response
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.response,
        timestamp: new Date(),
        status: 'sent',
        visualizationData,
      };
      
      setMessages(prev => [...prev, assistantMessage]);
      
      // Update conversation ID if this is a new conversation
      if (!currentConversationId && data.conversationId) {
        setCurrentConversationId(data.conversationId);
        await loadConversations();
      }
    } catch (error) {
      // Mark message as failed again
      setMessages(prev => prev.map(msg => 
        msg.id === messageId ? { ...msg, status: 'error', error: error instanceof Error ? error.message : 'Retry failed' } : msg
      ));
    } finally {
      setIsLoading(false);
      setRetryingMessageId(null);
    }
  };

  const regenerateResponse = async (messageId: string) => {
    const assistantMessage = messages.find(msg => msg.id === messageId);
    if (!assistantMessage || assistantMessage.role !== 'assistant') return;

    // Find the user message that prompted this response
    const messageIndex = messages.findIndex(msg => msg.id === messageId);
    if (messageIndex <= 0) return;
    
    const userMessage = messages[messageIndex - 1];
    if (!userMessage || userMessage.role !== 'user') return;

    setRegeneratingMessageId(messageId);
    setIsLoading(true);

    try {
      const token = await firebaseUser?.getIdToken();
      if (!token) throw new Error('Authentication required');

      const requestBody: Record<string, unknown> = {
        message: userMessage.content,
        history: messages.slice(0, messageIndex).map(m => ({ role: m.role, content: m.content })),
      };
      if (typeof currentConversationId === 'string') {
        requestBody.conversationId = currentConversationId;
      }

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        throw new Error('Failed to regenerate response');
      }

      const data = await response.json();

      // Extract visualization data from the response
      const visualizationData = extractVisualizationData(data.response);

      // Replace the assistant message with the new response
      setMessages(prev => prev.map(msg => 
        msg.id === messageId 
          ? { ...msg, content: data.response, timestamp: new Date(), status: 'sent' as const, visualizationData }
          : msg
      ));
    } catch (error) {
      // Show error message
      const errorMessage: Message = {
        id: Date.now().toString(),
        role: 'assistant',
        content: error instanceof Error ? `Failed to regenerate: ${error.message}` : 'Failed to regenerate response. Please try again.',
        timestamp: new Date(),
        status: 'error',
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
      setRegeneratingMessageId(null);
    }
  };

  const startEditMessage = (messageId: string, content: string) => {
    setEditingMessageId(messageId);
    setEditingContent(content);
  };

  const cancelEditMessage = () => {
    setEditingMessageId(null);
    setEditingContent('');
  };

  const saveEditMessage = (messageId: string) => {
    if (!editingContent.trim()) return;
    
    // Update the message content
    setMessages(prev => prev.map(msg => 
      msg.id === messageId 
        ? { ...msg, content: editingContent.trim() }
        : msg
    ));
    
    setEditingMessageId(null);
    setEditingContent('');
  };

  const deleteMessage = (messageId: string) => {
    // Find the message and remove it along with any subsequent assistant responses
    const messageIndex = messages.findIndex(msg => msg.id === messageId);
    if (messageIndex === -1) return;
    
    // Remove the message and any assistant responses that came after it
    setMessages(prev => prev.slice(0, messageIndex));
  };

  const rateMessage = (messageId: string, rating: 'like' | 'dislike') => {
    const currentRating = messageRatings[messageId];
    const newRating = currentRating === rating ? undefined : rating;
    
    if (newRating) {
      setMessageRatings(prev => ({ ...prev, [messageId]: newRating }));
    } else {
      setMessageRatings(prev => {
        const newRatings = { ...prev };
        delete newRatings[messageId];
        return newRatings;
      });
    }
    
    // Update message with rating
    setMessages(prev => prev.map(msg => 
      msg.id === messageId 
        ? { ...msg, rating: newRating || null }
        : msg
    ));
  };

  const exportConversation = () => {
    if (messages.length === 0) return;
    
    const conversationText = messages
      .map(msg => {
        const timestamp = new Date(msg.timestamp).toLocaleString();
        const role = msg.role === 'user' ? 'You' : 'AI Assistant';
        const rating = msg.rating ? ` [${msg.rating === 'like' ? '👍' : '👎'}]` : '';
        return `[${timestamp}] ${role}${rating}:\n${msg.content}\n`;
      })
      .join('\n---\n\n');
    
    const conversationTitle = getCurrentConversationTitle() || 'Chat Conversation';
    const exportText = `${conversationTitle}\n${'='.repeat(conversationTitle.length)}\n\n${conversationText}`;
    
    const blob = new Blob([exportText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${conversationTitle.replace(/[^a-z0-9]/gi, '_')}_${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Online/offline detection
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setConnectionStatus('connected');
    };

    const handleOffline = () => {
      setIsOnline(false);
      setConnectionStatus('disconnected');
    };

    // Check initial state
    setIsOnline(navigator.onLine);
    setConnectionStatus(navigator.onLine ? 'connected' : 'disconnected');

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Load financial overview data
  const loadFinancialOverview = useCallback(async () => {
    if (!firebaseUser) return;

    try {
      const token = await firebaseUser.getIdToken();
      
      // Fetch from the accounts endpoint which has overview data
      const response = await fetch('/api/accounts', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setFinancialOverview({
          netWorth: data.netWorth || 0,
          monthlyIncome: data.monthlyIncome || 0,
          monthlyExpenses: data.monthlyExpenses || 0,
          savingsRate: data.savingsRate || 0,
          emergencyFund: data.emergencyFundStatus || 0,
        });
      }
    } catch (error) {
      console.error('Error loading financial overview:', error);
      // Silently fail - this is supplementary data
    }
  }, [firebaseUser]);

  // Load conversations on mount
  const loadConversations = useCallback(async () => {
    if (!firebaseUser) return;

    try {
      setIsLoadingConversations(true);
      const token = await firebaseUser.getIdToken();
      const response = await fetch('/api/chat', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        const conversationsWithDates = (data.conversations || []).map((conv: APIConversation) => ({
          ...conv,
          updatedAt: new Date(conv.updatedAt),
        }));
        setConversations(conversationsWithDates);
      }
    } catch (error) {
      console.error('Error loading conversations:', error);
      // Silently fail for conversation loading - don't interrupt user experience
    } finally {
      setIsLoadingConversations(false);
    }
  }, [firebaseUser]);

  useEffect(() => {
    if (firebaseUser) {
      loadConversations();
      loadFinancialOverview();
    }
  }, [firebaseUser, loadConversations, loadFinancialOverview]);

  const loadConversation = useCallback(
    async (conversationId: string) => {
      if (!firebaseUser) return;

      try {
        setIsLoading(true);
        const token = await firebaseUser.getIdToken();
        const response = await fetch(`/api/chat?conversationId=${conversationId}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          const loadedMessages = data.messages.map((msg: APIMessage, index: number) => ({
            id: `${conversationId}-${index}`,
            role: msg.role,
            content: msg.content,
            timestamp: new Date(),
            status: 'sent' as const,
          }));
          setMessages(loadedMessages);
          setCurrentConversationId(conversationId);
          setShowConversationList(false);

          // Update conversation ID if this is a new conversation
          if (!currentConversationId && data.conversationId) {
            setCurrentConversationId(data.conversationId);
            // Reload conversations to show the new one
            await loadConversations();
          }
        }
      } catch (error) {
        console.error('Error loading conversation:', error);
        setMessages([{
          id: 'error-' + Date.now(),
          role: 'assistant',
          content: 'Unable to load this conversation. It may have been deleted or you may not have access to it.',
          timestamp: new Date(),
          status: 'error',
        }]);
      } finally {
        setIsLoading(false);
      }
    },
    [firebaseUser, loadConversations, currentConversationId]
  );

  // Auto-load most recent conversation only once when first loading
  useEffect(() => {
    if (
      conversations.length > 0 &&
      !currentConversationId &&
      !hasLoadedInitialConversation &&
      !isLoadingConversations
    ) {
      console.log('Auto-loading most recent conversation');
      const mostRecent = conversations[0]; // Already sorted by updatedAt desc
      if (mostRecent) {
        loadConversation(mostRecent.id);
      }
      setHasLoadedInitialConversation(true);
    }
  }, [
    conversations,
    currentConversationId,
    hasLoadedInitialConversation,
    isLoadingConversations,
    loadConversation,
  ]);

  const startNewConversation = () => {
    console.log('Starting new conversation');
    setMessages([]);
    setCurrentConversationId(null);
    setShowConversationList(false);
    setInput(''); // Clear any input
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!input.trim() || !firebaseUser) return;
    
    // Show offline message if not online
    if (!isOnline) {
      const offlineMessage: Message = {
        id: Date.now().toString(),
        role: 'assistant',
        content: 'You are currently offline. Your message will be sent when your connection is restored. Please check your internet connection.',
        timestamp: new Date(),
        status: 'error',
      };
      setMessages(prev => [...prev, offlineMessage]);
      return;
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
      timestamp: new Date(),
      status: 'sending',
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
    setConnectionStatus('connecting');
    
    // Update message status to sent after a short delay
    setTimeout(() => {
      setMessages(prev => prev.map(msg => 
        msg.id === userMessage.id ? { ...msg, status: 'sent' } : msg
      ));
    }, 500);

    try {
      const token = await firebaseUser.getIdToken();

      const requestBody: Record<string, unknown> = {
        message: userMessage.content,
        history: messages.map(m => ({ role: m.role, content: m.content })),
      };
      if (typeof currentConversationId === 'string') {
        requestBody.conversationId = currentConversationId;
      }

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        
        let errorMessage = 'Unable to send message';
        let errorDetails = '';
        
        switch (response.status) {
          case 401:
            errorMessage = 'Authentication error';
            errorDetails = 'Please sign out and sign back in to continue.';
            break;
          case 429:
            errorMessage = 'Too many requests';
            errorDetails = 'Please wait a moment before sending another message.';
            break;
          case 500:
          case 502:
          case 503:
            errorMessage = 'Server error';
            errorDetails = 'Our servers are experiencing issues. Please try again in a few moments.';
            break;
          case 400:
            if (errorData.details?.fieldErrors?.message) {
              errorMessage = 'Invalid message';
              errorDetails = errorData.details.fieldErrors.message[0];
            } else {
              errorMessage = 'Invalid request';
              errorDetails = 'There was an issue with your message. Please try rephrasing.';
            }
            break;
          default:
            errorMessage = 'Connection error';
            errorDetails = 'Please check your internet connection and try again.';
        }
        
        throw new Error(`${errorMessage}: ${errorDetails}`);
      }

      const data = await response.json();

      // Extract visualization data from the response
      const visualizationData = extractVisualizationData(data.response);

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.response,
        timestamp: new Date(),
        status: 'sent',
        visualizationData,
      };

      setMessages(prev => [...prev, assistantMessage]);
      setConnectionStatus('connected');

      // Update conversation ID if this is a new conversation
      if (!currentConversationId && data.conversationId) {
        setCurrentConversationId(data.conversationId);
        // Reload conversations to show the new one
        await loadConversations();
      }
    } catch (error) {
      console.error('Error sending message:', error);
      // Mark user message as error with retry capability
      setMessages(prev => prev.map(msg => 
        msg.id === userMessage.id ? { ...msg, status: 'error', error: error instanceof Error ? error.message : 'Unknown error' } : msg
      ));
      
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: error instanceof Error ? error.message : 'Sorry, I encountered an unexpected error. Please try again.',
        timestamp: new Date(),
        status: 'error',
      };
      setMessages(prev => [...prev, errorMessage]);
      setConnectionStatus(isOnline ? 'connected' : 'disconnected');
    } finally {
      setIsLoading(false);
    }
  };

  // Extract visualization data from AI response
  const extractVisualizationData = (content: string) => {
    const lowerContent = content.toLowerCase();
    
    // Net worth visualization
    if (lowerContent.includes('net worth') || lowerContent.includes('assets') || lowerContent.includes('liabilities')) {
      const netWorthMatch = content.match(/\$([0-9,]+(?:\.[0-9]{2})?)/g);
      if (netWorthMatch && netWorthMatch.length >= 2) {
        const amounts = netWorthMatch.map(match => parseFloat(match.replace(/[$,]/g, '')));
        return {
          type: 'networth' as const,
          data: {
            netWorth: amounts[amounts.length - 1], // Last mentioned amount is usually net worth
            assets: amounts[0] || 0,
            liabilities: amounts[1] || 0,
          }
        };
      }
    }

    // Spending visualization
    if (lowerContent.includes('spending') || lowerContent.includes('expenses') || lowerContent.includes('spent')) {
      // Look for category spending patterns like "restaurants: $123" or "food $456"
      const categoryMatches = content.match(/(\w+(?:\s+\w+)*)\s*[:$]\s*\$?([0-9,]+(?:\.[0-9]{2})?)/gi);
      if (categoryMatches && categoryMatches.length > 1) {
        const categories = categoryMatches.map(match => {
          const parts = match.split(/[:$]/);
          const category = parts[0]?.trim() || 'Unknown';
          const amount = parseFloat(parts[1]?.replace(/[$,]/g, '') || '0');
          return { category, amount };
        });
        return {
          type: 'spending' as const,
          data: categories
        };
      }
    }

    // Account balances visualization
    if (lowerContent.includes('account') || lowerContent.includes('balance')) {
      // Look for account patterns like "Checking: $1,234" or "Savings Account $5,678"
      const accountMatches = content.match(/(\w+(?:\s+\w+)*)\s*[:$]\s*\$?([0-9,]+(?:\.[0-9]{2})?)/gi);
      if (accountMatches && accountMatches.length > 1) {
        const accounts = accountMatches.map(match => {
          const parts = match.split(/[:$]/);
          const name = parts[0]?.trim() || 'Unknown Account';
          const balance = parseFloat(parts[1]?.replace(/[$,]/g, '') || '0');
          return { name, balance, type: 'Account' };
        });
        return {
          type: 'accounts' as const,
          data: accounts
        };
      }
    }

    // Monthly summary visualization
    if (lowerContent.includes('income') && lowerContent.includes('expenses')) {
      const amounts = content.match(/\$([0-9,]+(?:\.[0-9]{2})?)/g);
      if (amounts && amounts.length >= 2) {
        const values = amounts.map(match => parseFloat(match.replace(/[$,]/g, '')));
        return {
          type: 'budget' as const,
          data: {
            income: values[0] || 0,
            expenses: values[1] || 0,
          }
        };
      }
    }

    return null;
  };

  const deleteConversation = async (conversationId: string) => {
    if (!firebaseUser) return;

    try {
      const token = await firebaseUser.getIdToken();
      const response = await fetch(`/api/chat/${conversationId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        // Remove from local state
        setConversations(prev => prev.filter(c => c.id !== conversationId));

        // If this was the current conversation, start a new one
        if (currentConversationId === conversationId) {
          startNewConversation();
        }
      }
    } catch (error) {
      console.error('Error deleting conversation:', error);
      // Show temporary error message
      setMessages(prev => [...prev, {
        id: 'delete-error-' + Date.now(),
        role: 'assistant',
        content: 'Unable to delete conversation. Please try again.',
        timestamp: new Date(),
        status: 'error',
      }]);
      // Remove error message after 3 seconds
      setTimeout(() => {
        setMessages(prev => prev.filter(msg => !msg.id.startsWith('delete-error-')));
      }, 3000);
    }
  };

  const getCurrentConversationTitle = () => {
    if (!currentConversationId) return null;
    const conversation = conversations.find(c => c.id === currentConversationId);
    return conversation?.title || 'Current Conversation';
  };

  return (
    <div className="w-full overflow-x-hidden">
      <div className="w-full max-w-6xl mx-auto py-4 px-0 sm:px-2 lg:px-4">
        <div className="mb-6 lg:mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-gray-900 dark:text-gray-100">
                AI Financial Assistant
              </h1>
              <p className="mt-2 text-base lg:text-lg text-gray-600 dark:text-gray-300">
                Ask me anything about your finances. Your conversations are saved for future
                reference.
              </p>
              {currentConversationId && getCurrentConversationTitle() && (
                <p className="mt-1 text-sm text-gray-500">
                  Current: {getCurrentConversationTitle()}
                </p>
              )}
              {!currentConversationId && conversations.length > 0 && (
                <p className="mt-1 text-sm text-green-600 font-medium">📝 New conversation ready</p>
              )}
              
              {/* Connection Status */}
              <div className="mt-2 flex items-center gap-2 text-xs">
                {connectionStatus === 'connected' && isOnline && (
                  <>
                    <Wifi className="w-3 h-3 text-green-500" />
                    <span className="text-green-600 dark:text-green-400">Connected</span>
                  </>
                )}
                {connectionStatus === 'connecting' && (
                  <>
                    <Wifi className="w-3 h-3 text-yellow-500 animate-pulse" />
                    <span className="text-yellow-600 dark:text-yellow-400">Connecting...</span>
                  </>
                )}
                {(connectionStatus === 'disconnected' || !isOnline) && (
                  <>
                    <WifiOff className="w-3 h-3 text-red-500" />
                    <span className="text-red-600 dark:text-red-400">Offline</span>
                  </>
                )}
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
              <button
                onClick={() => setShowConversationList(!showConversationList)}
                className={`flex items-center justify-center gap-2 px-4 py-2 rounded-lg transition-all duration-200 transform hover:scale-105 active:scale-95 ${
                  showConversationList
                    ? 'bg-primary text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                <History className="h-4 w-4" />
                <span className="sm:inline">History</span>
              </button>
              <button
                onClick={() => setShowAnalytics(!showAnalytics)}
                className={`flex items-center justify-center gap-2 px-4 py-2 rounded-lg transition-all duration-200 transform hover:scale-105 active:scale-95 ${
                  showAnalytics
                    ? 'bg-primary text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                <BarChart3 className="h-4 w-4" />
                <span className="sm:inline">Analytics</span>
              </button>
              {messages.length > 0 && (
                <button
                  onClick={exportConversation}
                  className="flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all duration-200 transform hover:scale-105 active:scale-95 shadow-md hover:shadow-lg"
                  title="Export conversation"
                >
                  <Download className="h-4 w-4" />
                  <span className="sm:inline">Export</span>
                </button>
              )}
              <button
                onClick={startNewConversation}
                className="flex items-center justify-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-all duration-200 transform hover:scale-105 active:scale-95 shadow-md hover:shadow-lg"
              >
                <Plus className="h-4 w-4" />
                <span className="sm:inline">New Chat</span>
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 lg:gap-6 w-full overflow-x-hidden">
          {/* Conversation List Sidebar */}
          {showConversationList && (
            <div className="lg:col-span-1 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 order-2 lg:order-1">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Conversation History</h3>
              {isLoadingConversations ? (
                <div className="space-y-2">
                  {Array.from({ length: 5 }).map((_, index) => (
                    <div 
                      key={index} 
                      className="p-3 rounded-lg bg-gray-50 dark:bg-gray-700 animate-pulse"
                      style={{ animationDelay: `${index * 100}ms` }}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="h-4 bg-gradient-to-r from-gray-200 to-gray-300 dark:from-gray-600 dark:to-gray-500 rounded-md w-3/4 mb-2"></div>
                          <div className="flex items-center gap-2">
                            <div className="h-3 bg-gradient-to-r from-gray-200 to-gray-300 dark:from-gray-600 dark:to-gray-500 rounded w-12"></div>
                            <div className="h-3 bg-gray-200 dark:bg-gray-600 rounded-full w-1"></div>
                            <div className="h-3 bg-gradient-to-r from-gray-200 to-gray-300 dark:from-gray-600 dark:to-gray-500 rounded w-16"></div>
                          </div>
                        </div>
                        <div className="ml-2 w-4 h-4 bg-gray-200 dark:bg-gray-600 rounded-full"></div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : conversations.length === 0 ? (
                <p className="text-gray-500 dark:text-gray-400 text-center py-8">No conversations yet</p>
              ) : (
                <div className="space-y-2">
                  {conversations.map(conversation => (
                    <div
                      key={conversation.id}
                      className={`p-3 rounded-lg cursor-pointer transition-all duration-200 transform hover:scale-[1.02] ${
                        currentConversationId === conversation.id
                          ? 'bg-primary/10 dark:bg-primary/20 border border-primary/20 dark:border-primary/30'
                          : 'hover:bg-gray-50 dark:hover:bg-gray-700'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div
                          className="flex-1 min-w-0"
                          role="button"
                          tabIndex={0}
                          onClick={() => loadConversation(conversation.id)}
                          onKeyDown={e => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              loadConversation(conversation.id);
                            }
                          }}
                        >
                          <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                            {conversation.title}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {conversation.messageCount} messages •{' '}
                            {conversation.updatedAt.toLocaleDateString()}
                          </p>
                        </div>
                        <button
                          onClick={e => {
                            e.stopPropagation();
                            deleteConversation(conversation.id);
                          }}
                          className="ml-2 p-1 text-gray-400 hover:text-red-500 transition-colors"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Analytics Sidebar */}
          {showAnalytics && (
            <div className="lg:col-span-1 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 order-3 lg:order-3">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Financial Overview</h3>
              {financialOverview ? (
                <div className="space-y-4">
                  {/* Net Worth */}
                  <div className="p-3 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <TrendingUp className="h-4 w-4 text-blue-600" />
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Net Worth</span>
                      </div>
                    </div>
                    <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                      ${financialOverview.netWorth.toLocaleString()}
                    </p>
                  </div>

                  {/* Monthly Income */}
                  <div className="p-3 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <TrendingUp className="h-4 w-4 text-green-600" />
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Monthly Income</span>
                      </div>
                    </div>
                    <p className="text-lg font-bold text-green-600 dark:text-green-400">
                      ${financialOverview.monthlyIncome.toLocaleString()}
                    </p>
                  </div>

                  {/* Monthly Expenses */}
                  <div className="p-3 bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <TrendingDown className="h-4 w-4 text-red-600" />
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Monthly Expenses</span>
                      </div>
                    </div>
                    <p className="text-lg font-bold text-red-600 dark:text-red-400">
                      ${financialOverview.monthlyExpenses.toLocaleString()}
                    </p>
                  </div>

                  {/* Savings Rate */}
                  <div className="p-3 bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <PiggyBank className="h-4 w-4 text-purple-600" />
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Savings Rate</span>
                      </div>
                    </div>
                    <p className="text-lg font-bold text-purple-600 dark:text-purple-400">
                      {(financialOverview.savingsRate * 100).toFixed(1)}%
                    </p>
                  </div>

                  {/* Emergency Fund */}
                  <div className="p-3 bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-900/20 dark:to-amber-800/20 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <AlertCircle className="h-4 w-4 text-amber-600" />
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Emergency Fund</span>
                      </div>
                    </div>
                    <p className="text-lg font-bold text-amber-600 dark:text-amber-400">
                      {(financialOverview.emergencyFund * 100).toFixed(0)}%
                    </p>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-4">
                  <CardSkeleton />
                  <CardSkeleton />
                  <CardSkeleton />
                  <CardSkeleton />
                </div>
              )}
            </div>
          )}

          {/* Chat Interface */}
          <div
            className={`bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 h-[500px] sm:h-[600px] lg:h-[700px] flex flex-col order-1 lg:order-2 w-full min-w-0 ${
              showConversationList && showAnalytics 
                ? 'lg:col-span-2' 
                : showConversationList || showAnalytics 
                  ? 'lg:col-span-3' 
                  : 'lg:col-span-4'
            }`}
          >
            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 scroll-smooth">
              {messages.length === 0 && !isLoading && (
                <div className="text-center text-gray-500 mt-8">
                  <Bot className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p className="text-lg font-medium mb-2">
                    {conversations.length === 0
                      ? 'Welcome to AI Financial Assistant!'
                      : !currentConversationId
                        ? 'New Conversation Started!'
                        : 'Start a new conversation'}
                  </p>
                  <p className="text-sm mb-6">
                    {!isOnline 
                      ? 'You are currently offline. Please check your internet connection to chat with the AI assistant.'
                      : conversations.length === 0
                        ? 'Ask me anything about your finances to get started.'
                        : !currentConversationId
                          ? 'You are starting fresh! Ask me anything about your finances.'
                          : 'Ask me anything about your finances!'}
                  </p>
                  {isOnline && (
                    <div className="space-y-2 text-sm max-w-md mx-auto">
                      <p className="flex items-center gap-2">
                        <span className="text-primary">💡</span>
                        &quot;What&apos;s my current net worth?&quot;
                      </p>
                      <p className="flex items-center gap-2">
                        <span className="text-primary">💡</span>
                        &quot;How much did I spend on restaurants this month?&quot;
                      </p>
                      <p className="flex items-center gap-2">
                        <span className="text-primary">💡</span>
                        &quot;What are my biggest expenses?&quot;
                      </p>
                      <p className="flex items-center gap-2">
                        <span className="text-primary">💡</span>
                        &quot;How much do I have in savings?&quot;
                      </p>
                    </div>
                  )}
                  {!isOnline && (
                    <div className="mt-4 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                      <div className="flex items-center gap-2 text-yellow-800 dark:text-yellow-200">
                        <WifiOff className="w-5 h-5" />
                        <span className="font-medium">Offline Mode</span>
                      </div>
                      <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
                        Chat functionality is unavailable while offline. Your conversations will sync when you reconnect.
                      </p>
                    </div>
                  )}
                </div>
              )}

              {messages.map((message, index) => (
                <div
                  key={message.id}
                  className={`flex items-start gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2 duration-500 ease-out`}
                  style={{ animationDelay: `${Math.min(index * 100, 300)}ms` }}
                >
                  {/* Assistant Avatar */}
                  {message.role === 'assistant' && (
                    <div className="flex-shrink-0">
                      <div className="relative">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/90 to-primary flex items-center justify-center shadow-lg ring-2 ring-white dark:ring-gray-800">
                          <Bot className="h-5 w-5 text-white" />
                        </div>
                        <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white dark:border-gray-800"></div>
                      </div>
                    </div>
                  )}
                  
                  {/* Message Container */}
                  <div className={`flex flex-col ${message.role === 'user' ? 'items-end' : 'items-start'} max-w-[85%] sm:max-w-[75%]`}>
                    {/* Message Bubble */}
                    <div
                      className={`relative rounded-2xl px-5 py-3 shadow-sm transition-all duration-300 ease-out hover:shadow-lg hover:scale-[1.02] group ${
                        message.role === 'user'
                          ? 'bg-gradient-to-br from-primary to-primary/90 text-white rounded-tr-sm'
                          : 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100 rounded-tl-sm hover:border-gray-300 dark:hover:border-gray-600'
                      }`}
                    >
                      {/* Message Content */}
                      <div className="space-y-2">
                        <div className="flex items-start justify-between gap-3">
                          {editingMessageId === message.id ? (
                            <div className="flex-1 space-y-2">
                              <textarea
                                value={editingContent}
                                onChange={(e) => setEditingContent(e.target.value)}
                                className="w-full p-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 resize-none"
                                rows={3}
                                autoFocus
                              />
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => saveEditMessage(message.id)}
                                  disabled={!editingContent.trim()}
                                  className="px-3 py-1 text-xs bg-primary text-white rounded hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                >
                                  Save
                                </button>
                                <button
                                  onClick={cancelEditMessage}
                                  className="px-3 py-1 text-xs bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors"
                                >
                                  Cancel
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div className="flex-1">
                              <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">{message.content}</p>
                              
                              {/* Chat Visualization for assistant messages */}
                              {message.role === 'assistant' && message.visualizationData && (
                                <ChatVisualization 
                                  data={message.visualizationData.data} 
                                  type={message.visualizationData.type} 
                                />
                              )}
                            </div>
                          )}
                          
                          {editingMessageId !== message.id && (
                            <div className="flex items-center gap-1 flex-shrink-0">
                              {/* Edit button for user messages */}
                              {message.role === 'user' && (
                                <button
                                  onClick={() => startEditMessage(message.id, message.content)}
                                  className="opacity-0 group-hover:opacity-100 transition-all duration-300 ease-out transform group-hover:scale-110 p-1 rounded hover:bg-black/10 dark:hover:bg-white/10"
                                  title="Edit message"
                                >
                                  <Edit3 className="w-4 h-4 text-white/70 hover:text-white" />
                                </button>
                              )}
                              
                              {/* Delete button for user messages */}
                              {message.role === 'user' && (
                                <button
                                  onClick={() => deleteMessage(message.id)}
                                  className="opacity-0 group-hover:opacity-100 transition-all duration-300 ease-out transform group-hover:scale-110 p-1 rounded hover:bg-black/10 dark:hover:bg-white/10"
                                  title="Delete message"
                                >
                                  <Trash2 className="w-4 h-4 text-white/70 hover:text-red-400" />
                                </button>
                              )}
                              
                              {/* Rating buttons for assistant messages */}
                              {message.role === 'assistant' && message.status !== 'error' && (
                                <>
                                  <button
                                    onClick={() => rateMessage(message.id, 'like')}
                                    className={`opacity-0 group-hover:opacity-100 transition-all duration-300 ease-out transform group-hover:scale-110 p-1 rounded hover:bg-black/10 dark:hover:bg-white/10 ${
                                      messageRatings[message.id] === 'like' ? 'opacity-100' : ''
                                    }`}
                                    title="Like this response"
                                  >
                                    <ThumbsUp className={`w-4 h-4 ${
                                      messageRatings[message.id] === 'like' 
                                        ? 'text-green-600 dark:text-green-400 fill-current'
                                        : 'text-gray-500 dark:text-gray-400 hover:text-green-600 dark:hover:text-green-400'
                                    }`} />
                                  </button>
                                  <button
                                    onClick={() => rateMessage(message.id, 'dislike')}
                                    className={`opacity-0 group-hover:opacity-100 transition-all duration-300 ease-out transform group-hover:scale-110 p-1 rounded hover:bg-black/10 dark:hover:bg-white/10 ${
                                      messageRatings[message.id] === 'dislike' ? 'opacity-100' : ''
                                    }`}
                                    title="Dislike this response"
                                  >
                                    <ThumbsDown className={`w-4 h-4 ${
                                      messageRatings[message.id] === 'dislike'
                                        ? 'text-red-600 dark:text-red-400 fill-current'
                                        : 'text-gray-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400'
                                    }`} />
                                  </button>
                                </>
                              )}
                              
                              {/* Regenerate button for assistant messages */}
                              {message.role === 'assistant' && message.status !== 'error' && (
                                <button
                                  onClick={() => regenerateResponse(message.id)}
                                  disabled={regeneratingMessageId === message.id || isLoading}
                                  className="opacity-0 group-hover:opacity-100 transition-all duration-300 ease-out transform group-hover:scale-110 p-1 rounded hover:bg-black/10 dark:hover:bg-white/10 disabled:opacity-50"
                                  title="Regenerate response"
                                >
                                  <RotateCcw className={`w-4 h-4 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 ${
                                    regeneratingMessageId === message.id ? 'animate-spin' : ''
                                  }`} />
                                </button>
                              )}
                              
                              {/* Copy button */}
                              <button
                                onClick={() => copyMessageToClipboard(message.content, message.id)}
                                className="opacity-0 group-hover:opacity-100 transition-all duration-300 ease-out transform group-hover:scale-110 p-1 rounded hover:bg-black/10 dark:hover:bg-white/10"
                                title="Copy message"
                              >
                                {copiedMessageId === message.id ? (
                                  <svg className="w-4 h-4 text-green-600 dark:text-green-400" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                  </svg>
                                ) : (
                                  <Copy className={`w-4 h-4 ${
                                    message.role === 'user' ? 'text-white/70 hover:text-white' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                                  }`} />
                                )}
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      {/* Message tail */}
                      {message.role === 'user' ? (
                        <div className="absolute -right-2 top-3 w-3 h-3 bg-gradient-to-br from-primary to-primary/90 transform rotate-45 rounded-sm"></div>
                      ) : (
                        <div className="absolute -left-2 top-3 w-3 h-3 bg-white dark:bg-gray-800 border-l border-t border-gray-200 dark:border-gray-700 transform rotate-45 rounded-sm"></div>
                      )}
                    </div>
                    
                    {/* Timestamp and Status */}
                    <div className={`mt-1 px-2 flex items-center gap-2 text-xs ${
                      message.role === 'user' ? 'text-gray-600 dark:text-gray-400' : 'text-gray-500 dark:text-gray-400'
                    }`}>
                      <span>{new Date(message.timestamp).toLocaleTimeString([], { 
                        hour: 'numeric', 
                        minute: '2-digit',
                        hour12: true 
                      })}</span>
                      {message.role === 'user' && message.status && (
                        <span className="flex items-center gap-1">
                          {message.status === 'sending' && (
                            <>
                              <Clock className="w-3 h-3 animate-spin" />
                              <span className="text-xs">Sending...</span>
                            </>
                          )}
                          {message.status === 'sent' && (
                            <>
                              <CheckCircle2 className="w-3 h-3 text-green-500" />
                              <span className="text-xs text-green-600 dark:text-green-400">Sent</span>
                            </>
                          )}
                          {message.status === 'error' && (
                            <>
                              <AlertCircle className="w-3 h-3 text-red-500" />
                              <span className="text-xs text-red-600 dark:text-red-400">Failed</span>
                              <button
                                onClick={() => retryMessage(message.id)}
                                disabled={retryingMessageId === message.id}
                                className="ml-2 text-xs text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 disabled:opacity-50 flex items-center gap-1 transition-colors"
                                title="Retry message"
                              >
                                <RefreshCw className={`w-3 h-3 ${retryingMessageId === message.id ? 'animate-spin' : ''}`} />
                                {retryingMessageId === message.id ? 'Retrying...' : 'Retry'}
                              </button>
                            </>
                          )}
                        </span>
                      )}
                      {message.role === 'assistant' && message.status === 'error' && (
                        <span className="flex items-center gap-1">
                          <AlertCircle className="w-3 h-3 text-red-500" />
                          <span className="text-xs text-red-600 dark:text-red-400">Error</span>
                        </span>
                      )}
                    </div>
                  </div>
                  
                  {/* User Avatar */}
                  {message.role === 'user' && (
                    <div className="flex-shrink-0">
                      <div className="relative">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-sm font-semibold shadow-lg ring-2 ring-white dark:ring-gray-800">
                          {firebaseUser?.displayName?.charAt(0)?.toUpperCase() || firebaseUser?.email?.charAt(0)?.toUpperCase() || 'U'}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
              {isLoading && (
                <div className="flex items-start gap-3 justify-start animate-in fade-in slide-in-from-bottom-2 duration-700 ease-out">
                  {/* Assistant Avatar */}
                  <div className="flex-shrink-0">
                    <div className="relative">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/90 to-primary flex items-center justify-center shadow-lg ring-2 ring-white dark:ring-gray-800">
                        <Bot className="h-5 w-5 text-white" />
                      </div>
                      <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-yellow-500 rounded-full border-2 border-white dark:border-gray-800 animate-pulse"></div>
                    </div>
                  </div>
                  
                  {/* Typing Indicator */}
                  <div className="flex flex-col items-start max-w-[85%] sm:max-w-[75%]">
                    <div className="relative bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl rounded-tl-sm px-5 py-3 shadow-sm">
                      <div className="flex items-center gap-3">
                        <div className="flex gap-1.5">
                          <div className="w-2.5 h-2.5 bg-primary/60 rounded-full animate-pulse" style={{ animationDelay: '0ms' }}></div>
                          <div className="w-2.5 h-2.5 bg-primary/60 rounded-full animate-pulse" style={{ animationDelay: '200ms' }}></div>
                          <div className="w-2.5 h-2.5 bg-primary/60 rounded-full animate-pulse" style={{ animationDelay: '400ms' }}></div>
                        </div>
                        <span className="text-sm text-gray-600 dark:text-gray-400 italic">AI is composing a response...</span>
                      </div>
                      
                      {/* Message tail */}
                      <div className="absolute -left-2 top-3 w-3 h-3 bg-white dark:bg-gray-800 border-l border-t border-gray-200 dark:border-gray-700 transform rotate-45 rounded-sm"></div>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
            {/* Input */}
            <div className="border-t border-gray-200 dark:border-gray-700 p-3 sm:p-4">
              <form onSubmit={handleSubmit} className="flex gap-2">
                <input
                  type="text"
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  placeholder={isOnline ? "Ask about your finances..." : "Offline - Check your connection"}
                  className="flex-1 px-3 sm:px-4 py-2 text-sm sm:text-base border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 disabled:bg-gray-100 dark:disabled:bg-gray-800 disabled:text-gray-500"
                  disabled={isLoading}
                />
                <button
                  type="submit"
                  disabled={isLoading || !input.trim() || !isOnline}
                  className="px-3 sm:px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-105 active:scale-95 disabled:hover:scale-100 shadow-md hover:shadow-lg"
                >
                  <Send className="h-4 w-4" />
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
