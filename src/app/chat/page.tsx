'use client';

import { Bot, History, Loader2, Plus, Send, Trash2, User } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';

import { useSession } from '@/components/providers/SessionProvider';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
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
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

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
    } finally {
      setIsLoadingConversations(false);
    }
  }, [firebaseUser]);

  useEffect(() => {
    if (firebaseUser) {
      loadConversations();
    }
  }, [firebaseUser, loadConversations]);

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
      } finally {
        setIsLoading(false);
      }
    },
    [firebaseUser, loadConversations]
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

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

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
        console.error('API Error:', errorData);
        console.error('Field Errors:', errorData.details?.fieldErrors);
        console.error('Form Errors:', errorData.details?.formErrors);

        // Show error in alert for debugging
        alert(
          `API Error: ${response.status}\nError: ${errorData.error}\nField Errors: ${JSON.stringify(errorData.details?.fieldErrors)}\nForm Errors: ${JSON.stringify(errorData.details?.formErrors)}`
        );

        throw new Error(`API Error: ${response.status} - ${errorData.error || 'Unknown error'}`);
      }

      const data = await response.json();

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.response,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, assistantMessage]);

      // Update conversation ID if this is a new conversation
      if (!currentConversationId && data.conversationId) {
        setCurrentConversationId(data.conversationId);
        // Reload conversations to show the new one
        await loadConversations();
      }
    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `Sorry, I encountered an error: ${error instanceof Error ? error.message : 'Unknown error'}. Please try again.`,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
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
    }
  };

  const getCurrentConversationTitle = () => {
    if (!currentConversationId) return null;
    const conversation = conversations.find(c => c.id === currentConversationId);
    return conversation?.title || 'Current Conversation';
  };

  return (
    <div className="pl-72">
      <div className="container max-w-6xl py-8">
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold tracking-tight text-gray-900">
                AI Financial Assistant
              </h1>
              <p className="mt-2 text-lg text-gray-600">
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
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setShowConversationList(!showConversationList)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                  showConversationList
                    ? 'bg-primary text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <History className="h-4 w-4" />
                History
              </button>
              <button
                onClick={startNewConversation}
                className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
              >
                <Plus className="h-4 w-4" />
                New Chat
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Conversation List Sidebar */}
          {showConversationList && (
            <div className="lg:col-span-1 bg-white rounded-xl shadow-sm border border-gray-200 p-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Conversation History</h3>
              {isLoadingConversations ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
                </div>
              ) : conversations.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No conversations yet</p>
              ) : (
                <div className="space-y-2">
                  {conversations.map(conversation => (
                    <div
                      key={conversation.id}
                      className={`p-3 rounded-lg cursor-pointer transition-colors ${
                        currentConversationId === conversation.id
                          ? 'bg-primary/10 border border-primary/20'
                          : 'hover:bg-gray-50'
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
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {conversation.title}
                          </p>
                          <p className="text-xs text-gray-500">
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

          {/* Chat Interface */}
          <div
            className={`bg-white rounded-xl shadow-sm border border-gray-200 h-[600px] flex flex-col ${
              showConversationList ? 'lg:col-span-3' : 'lg:col-span-4'
            }`}
          >
            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
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
                    {conversations.length === 0
                      ? 'Ask me anything about your finances to get started.'
                      : !currentConversationId
                        ? 'You are starting fresh! Ask me anything about your finances.'
                        : 'Ask me anything about your finances!'}
                  </p>
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
                </div>
              )}

              {messages.map(message => (
                <div
                  key={message.id}
                  className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] rounded-lg px-4 py-2 ${
                      message.role === 'user'
                        ? 'bg-primary text-white'
                        : 'bg-gray-100 text-gray-900'
                    }`}
                  >
                    <div className="flex items-start gap-2">
                      {message.role === 'assistant' && (
                        <Bot className="h-4 w-4 mt-0.5 text-gray-500" />
                      )}
                      <div className="flex-1">
                        <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                        <p className="text-xs opacity-70 mt-1">
                          {message.timestamp.toLocaleTimeString()}
                        </p>
                      </div>
                      {message.role === 'user' && <User className="h-4 w-4 mt-0.5 text-white/70" />}
                    </div>
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-gray-100 rounded-lg px-4 py-2">
                    <div className="flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin text-gray-500" />
                      <span className="text-sm text-gray-600">Thinking...</span>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
            {/* Input */}
            <div className="border-t border-gray-200 p-4">
              <form onSubmit={handleSubmit} className="flex gap-2">
                <input
                  type="text"
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  placeholder="Ask about your finances..."
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  disabled={isLoading}
                />
                <button
                  type="submit"
                  disabled={isLoading || !input.trim()}
                  className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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
