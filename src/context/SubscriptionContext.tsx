import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { apiClient } from '@/lib/apiClient';
import { useAuth } from '@/context/AuthContext';

export interface SubscriptionInfo {
  plan: 'free' | 'professional';
  status: 'active' | 'inactive' | 'cancelled' | 'expired';
  currentPeriodStart: string;
  currentPeriodEnd?: string;
  daysRemaining: number | null;
}

interface SubscriptionContextType {
  subscription: SubscriptionInfo | null;
  isLoading: boolean;
  error: string | null;
  refreshSubscription: () => Promise<void>;
  upgradeSubscription: (paymentMethod: string, transactionId: string) => Promise<void>;
  downgradeSubscription: () => Promise<void>;
  cancelSubscription: () => Promise<void>;
  isFreeUser: () => boolean;
  isProfessionalUser: () => boolean;
  isSubscriptionExpired: () => boolean;
}

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(undefined);

export function SubscriptionProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated, user } = useAuth();
  const [subscription, setSubscription] = useState<SubscriptionInfo | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch subscription whenever user changes
  useEffect(() => {
    if (!isAuthenticated) {
      // Clear subscription when user logs out
      setSubscription(null);
      return;
    }
    
    // Fetch subscription for current user
    refreshSubscription();
  }, [isAuthenticated, user?.id]);

  const refreshSubscription = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await apiClient.getSubscriptionInfo();
      setSubscription(response.subscription);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch subscription';
      setError(errorMessage);
      console.error('Error fetching subscription:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const upgradeSubscription = async (paymentMethod: string, transactionId: string) => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await apiClient.upgradeSubscription(paymentMethod, transactionId);
      setSubscription(response.subscription);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to upgrade subscription';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const downgradeSubscription = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await apiClient.downgradeSubscription();
      setSubscription(response.subscription);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to downgrade subscription';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const cancelSubscription = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await apiClient.cancelSubscription();
      setSubscription(response.subscription);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to cancel subscription';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const isFreeUser = () => subscription?.plan === 'free';
  const isProfessionalUser = () => subscription?.plan === 'professional' && subscription?.status === 'active';
  const isSubscriptionExpired = () => subscription?.status === 'expired';

  return (
    <SubscriptionContext.Provider
      value={{
        subscription,
        isLoading,
        error,
        refreshSubscription,
        upgradeSubscription,
        downgradeSubscription,
        cancelSubscription,
        isFreeUser,
        isProfessionalUser,
        isSubscriptionExpired,
      }}
    >
      {children}
    </SubscriptionContext.Provider>
  );
}

export function useSubscription() {
  const context = useContext(SubscriptionContext);
  if (context === undefined) {
    throw new Error('useSubscription must be used within SubscriptionProvider');
  }
  return context;
}
