import { useNavigate } from 'react-router-dom';
import { useSubscription } from '@/context/SubscriptionContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle2, AlertCircle } from 'lucide-react';
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';

export default function PricingPage() {
  const navigate = useNavigate();
  const { subscription, upgradeSubscription, isLoading } = useSubscription();
  const { toast } = useToast();
  const [processingPayment, setProcessingPayment] = useState(false);

  const handleUpgrade = async () => {
    try {
      setProcessingPayment(true);
      
      // Simulate Razorpay payment (in production, integrate with Razorpay payment gateway)
      // For now, we'll use a dummy transaction ID
      const transactionId = `TXN_${Date.now()}`;
      
      // Show processing message
      toast({
        title: 'Processing Payment',
        description: 'Your payment is being processed...',
      });

      // Call upgrade endpoint
      await upgradeSubscription('credit_card', transactionId);

      toast({
        title: 'Success!',
        description: 'Your subscription has been upgraded to Professional plan.',
      });

      // Redirect to profile
      navigate('/profile');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to upgrade subscription';
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setProcessingPayment(false);
    }
  };

  const features = [
    { name: 'Icons per project', free: '20', professional: 'Unlimited' },
    { name: 'Projects', free: 'Unlimited', professional: 'Unlimited' },
    { name: 'Export Options', free: 'PNG, SVG', professional: 'PNG, SVG, PDF' },
    { name: 'Cloud Storage', free: '100 MB', professional: '1 GB' },
    { name: 'Support', free: 'Community', professional: 'Priority Email' },
    { name: 'Auto-save', free: 'Every 30s', professional: 'Real-time' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      <div className="container mx-auto px-4 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Simple, Transparent Pricing
          </h1>
          <p className="text-xl text-gray-600">
            Choose the plan that works best for you
          </p>
        </div>

        {/* Current Plan Badge */}
        {subscription && (
          <div className="mb-8 flex justify-center">
            <div className="bg-blue-100 border border-blue-200 rounded-lg px-4 py-2">
              <p className="text-blue-900 font-semibold">
                Current Plan: <span className="capitalize">{subscription.plan}</span>
              </p>
            </div>
          </div>
        )}

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto mb-12">
          {/* Free Plan */}
          <Card className={`relative ${subscription?.plan === 'free' ? 'ring-2 ring-blue-500' : ''}`}>
            {subscription?.plan === 'free' && (
              <div className="absolute top-0 left-0 right-0 bg-blue-500 text-white py-2 text-center rounded-t-lg">
                <span className="text-sm font-semibold">Current Plan</span>
              </div>
            )}
            <CardHeader className={subscription?.plan === 'free' ? 'pt-16' : ''}>
              <CardTitle>Free Plan</CardTitle>
              <CardDescription>Perfect for getting started</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <div className="text-3xl font-bold text-gray-900">₹0</div>
                <p className="text-gray-600 text-sm">Always free</p>
              </div>

              <Button disabled className="w-full" variant="outline">
                Current Plan
              </Button>

              <ul className="space-y-4">
                {features.map((feature) => (
                  <li key={feature.name} className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium text-gray-900">{feature.name}</p>
                      <p className="text-sm text-gray-600">{feature.free}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          {/* Professional Plan */}
          <Card className={`relative ${subscription?.plan === 'professional' ? 'ring-2 ring-blue-500' : 'border-blue-200'}`}>
            {subscription?.plan === 'professional' && (
              <div className="absolute top-0 left-0 right-0 bg-blue-500 text-white py-2 text-center rounded-t-lg">
                <span className="text-sm font-semibold">Current Plan</span>
              </div>
            )}
            <CardHeader className={subscription?.plan === 'professional' ? 'pt-16' : ''}>
              <CardTitle>Professional Plan</CardTitle>
              <CardDescription>For power users and teams</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <div className="text-3xl font-bold text-gray-900">
                  ₹400 <span className="text-base font-normal text-gray-600">/month</span>
                </div>
                <p className="text-gray-600 text-sm">Billed monthly, cancel anytime</p>
              </div>

              {subscription?.plan === 'professional' ? (
                <Button disabled className="w-full" variant="outline">
                  Current Plan
                </Button>
              ) : (
                <Button
                  onClick={handleUpgrade}
                  disabled={processingPayment || isLoading}
                  className="w-full bg-blue-600 hover:bg-blue-700"
                >
                  {processingPayment ? 'Processing...' : 'Upgrade Now'}
                </Button>
              )}

              <ul className="space-y-4">
                {features.map((feature) => (
                  <li key={feature.name} className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium text-gray-900">{feature.name}</p>
                      <p className="text-sm text-gray-600">{feature.professional}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>

        {/* Subscription Status Info */}
        {subscription && subscription.plan === 'professional' && subscription.daysRemaining !== null && (
          <div className="max-w-2xl mx-auto bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex gap-3">
            <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-yellow-900 mb-1">
                Your subscription expires in {subscription.daysRemaining} days
              </p>
              <p className="text-sm text-yellow-800">
                {subscription.autoRenewal 
                  ? 'Auto-renewal is enabled. Your subscription will automatically renew.'
                  : 'Auto-renewal is disabled. You will need to renew your subscription manually.'}
              </p>
            </div>
          </div>
        )}

        {/* FAQ Section */}
        <div className="max-w-2xl mx-auto mt-16">
          <h2 className="text-2xl font-bold text-gray-900 mb-8">Frequently Asked Questions</h2>
          <div className="space-y-6">
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Can I cancel my subscription anytime?</h3>
              <p className="text-gray-600">
                Yes, you can cancel your subscription at any time. You'll have access to all professional features until the end of your billing period.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">What happens when my subscription expires?</h3>
              <p className="text-gray-600">
                Your account will automatically downgrade to the free plan. You can export your diagrams before the downgrade takes effect.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Are there any setup fees?</h3>
              <p className="text-gray-600">
                No, there are no setup fees or hidden charges. You only pay the monthly subscription cost.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">How do I get an invoice?</h3>
              <p className="text-gray-600">
                You'll receive an invoice via email after each payment. You can also view all your invoices in your account profile.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
