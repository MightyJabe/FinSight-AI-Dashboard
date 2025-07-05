'use client';

import { AlertTriangle, Bell, X } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';

import { useSession } from '@/components/providers/SessionProvider';
import type { BudgetAlert } from '@/lib/budget-recommendations';

interface BudgetAlertsProps {
  className?: string;
}

/**
 * Budget Alerts notification component for navigation/header
 */
export function BudgetAlerts({ className = '' }: BudgetAlertsProps) {
  const { firebaseUser } = useSession();
  const [alerts, setAlerts] = useState<BudgetAlert[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [dismissedAlerts, setDismissedAlerts] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);

  const fetchAlerts = useCallback(async () => {
    if (!firebaseUser) return;

    try {
      setLoading(true);
      const idToken = await firebaseUser.getIdToken();
      const response = await fetch('/api/budget-recommendations?includeAlerts=true', {
        headers: {
          Authorization: `Bearer ${idToken}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          // Filter to only high priority alerts
          const highPriorityAlerts = data.data.alerts.filter(
            (alert: BudgetAlert) => 
              alert.severity === 'critical' || alert.severity === 'high'
          );
          setAlerts(highPriorityAlerts);
        }
      }
    } catch (error) {
      console.error('Error fetching budget alerts:', error);
    } finally {
      setLoading(false);
    }
  }, [firebaseUser]);

  const dismissAlert = useCallback((alertId: string) => {
    setDismissedAlerts(prev => new Set([...prev, alertId]));
  }, []);

  useEffect(() => {
    fetchAlerts();
    
    // Refresh alerts every 5 minutes
    const interval = setInterval(fetchAlerts, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [fetchAlerts]);

  const visibleAlerts = alerts.filter(alert => !dismissedAlerts.has(alert.id));
  const criticalAlerts = visibleAlerts.filter(alert => alert.severity === 'critical');
  const hasAlerts = visibleAlerts.length > 0;

  if (!hasAlerts && !loading) {
    return null;
  }

  const getSeverityColor = (severity: BudgetAlert['severity']) => {
    switch (severity) {
      case 'critical':
        return 'bg-red-100 border-red-200 text-red-800';
      case 'high':
        return 'bg-orange-100 border-orange-200 text-orange-800';
      default:
        return 'bg-yellow-100 border-yellow-200 text-yellow-800';
    }
  };

  const getSeverityIcon = (severity: BudgetAlert['severity']) => {
    if (severity === 'critical' || severity === 'high') {
      return <AlertTriangle className="h-4 w-4" />;
    }
    return <Bell className="h-4 w-4" />;
  };

  return (
    <div className={`relative ${className}`}>
      {/* Alert Bell Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`relative p-2 rounded-lg transition-colors ${
          criticalAlerts.length > 0
            ? 'text-red-600 hover:bg-red-50'
            : hasAlerts
            ? 'text-orange-600 hover:bg-orange-50'
            : 'text-gray-600 hover:bg-gray-50'
        }`}
        title={hasAlerts ? `${visibleAlerts.length} budget alert(s)` : 'No budget alerts'}
      >
        <Bell className="h-5 w-5" />
        
        {/* Alert Badge */}
        {hasAlerts && (
          <span className={`absolute -top-1 -right-1 h-4 w-4 rounded-full flex items-center justify-center text-xs font-bold text-white ${
            criticalAlerts.length > 0 ? 'bg-red-500' : 'bg-orange-500'
          }`}>
            {visibleAlerts.length > 9 ? '9+' : visibleAlerts.length}
          </span>
        )}
      </button>

      {/* Alerts Dropdown */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setIsOpen(false)}
          />
          
          {/* Dropdown Panel */}
          <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
            <div className="p-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-gray-900">Budget Alerts</h3>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1 hover:bg-gray-100 rounded transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="max-h-96 overflow-y-auto">
              {loading ? (
                <div className="p-4 text-center text-gray-500">
                  <div className="animate-spin rounded-full h-6 w-6 border-2 border-primary border-t-transparent mx-auto mb-2" />
                  Loading alerts...
                </div>
              ) : visibleAlerts.length === 0 ? (
                <div className="p-4 text-center text-gray-500">
                  <Bell className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                  <p>No urgent budget alerts</p>
                  <p className="text-xs">You&apos;re staying on track!</p>
                </div>
              ) : (
                <div className="p-2">
                  {visibleAlerts.map((alert) => (
                    <div
                      key={alert.id}
                      className={`p-3 mb-2 rounded-lg border ${getSeverityColor(alert.severity)}`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-2 flex-1">
                          {getSeverityIcon(alert.severity)}
                          <div className="min-w-0">
                            <h4 className="font-medium text-sm leading-tight">
                              {alert.title}
                            </h4>
                            <p className="text-xs mt-1 opacity-90 line-clamp-2">
                              {alert.message}
                            </p>
                            {alert.amount > 0 && (
                              <p className="text-xs mt-1 font-medium">
                                ${Math.abs(alert.amount).toFixed(0)}
                                {alert.percentage && ` (${alert.percentage.toFixed(0)}%)`}
                              </p>
                            )}
                          </div>
                        </div>
                        <button
                          onClick={() => dismissAlert(alert.id)}
                          className="p-1 hover:bg-black/10 rounded transition-colors flex-shrink-0"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {visibleAlerts.length > 0 && (
              <div className="p-3 border-t border-gray-200 bg-gray-50">
                <button
                  onClick={() => {
                    setIsOpen(false);
                    // Navigate to budget recommendations page
                    window.location.href = '/dashboard#budget-recommendations';
                  }}
                  className="w-full text-sm text-primary hover:text-primary/80 font-medium transition-colors"
                >
                  View All Recommendations →
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}