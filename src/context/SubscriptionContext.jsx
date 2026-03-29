import { createContext, useContext, useState, useEffect } from 'react';
import { apiClient } from '@/lib/apiClient.js';
import { useAuth } from '@/context/AuthContext.jsx';

const SubscriptionContext = createContext(undefined);

export function SubscriptionProvider({ children }) {
  const { isAuthenticated, user } = useAuth();
  const [subscription, setSubscription] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

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

  const upgradeSubscription = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await apiClient.upgradeSubscription();
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

  const isFreeUser = () => subscription?.plan === 'free' || subscription?.status === 'cancelled';
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
