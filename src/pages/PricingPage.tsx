import { useNavigate } from 'react-router-dom';
import { useSubscription } from '@/context/SubscriptionContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle2, AlertCircle } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { apiClient } from '@/lib/apiClient';

declare global {
  interface Window {
    Razorpay: any;
  }
}

export default function PricingPage() {
  const navigate = useNavigate();
  const { subscription, isLoading, refreshSubscription } = useSubscription();
  const { toast } = useToast();
  const [processingPayment, setProcessingPayment] = useState(false);
  const [paymentType, setPaymentType] = useState<'recurring' | 'onetime'>('recurring');

  // Load Razorpay script
  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    document.body.appendChild(script);
    return () => {
      if (document.body.contains(script)) {
        document.body.removeChild(script);
      }
    };
  }, []);

  const handleUpgradeRecurring = async () => {
    try {
      setProcessingPayment(true);
      console.log('[Upgrade] Starting recurring subscription flow...');

      // Step 1: Create Razorpay subscription
      console.log('[Upgrade] Creating recurring subscription...');
      const subscriptionResponse = await apiClient.createRazorpaySubscription(true);
      const paymentLink = subscriptionResponse.subscription.paymentLink;
      console.log('[Upgrade] Subscription created:', subscriptionResponse.subscription.subscriptionId);

      // Step 2: Redirect to payment link
      console.log('[Upgrade] Redirecting to payment link:', paymentLink);
      window.location.href = paymentLink;
    } catch (error) {
      console.error('[Upgrade] Recurring subscription error:', error);
      setProcessingPayment(false);
      const errorMessage = error instanceof Error ? error.message : 'Failed to create subscription';
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
    }
  };

  const handleUpgradeOneTime = async () => {
    try {
      setProcessingPayment(true);
      console.log('[Upgrade] Starting one-time payment flow...');

      // Step 1: Create Razorpay order
      console.log('[Upgrade] Creating Razorpay order...');
      const orderResponse = await apiClient.createRazorpayOrder();
      const orderId = orderResponse.order.orderId;
      console.log('[Upgrade] Order created:', orderId);

      // Step 2: Initialize Razorpay checkout
      const razorpayKey = import.meta.env.VITE_RAZORPAY_KEY_ID;
      console.log('[Upgrade] Razorpay Key loaded:', !!razorpayKey);
      if (!razorpayKey) {
        throw new Error('Razorpay key not configured');
      }

      const options = {
        key: razorpayKey,
        amount: orderResponse.order.amount,
        currency: orderResponse.order.currency,
        name: 'Canvas Creator',
        description: 'Professional Plan - One-Time Payment',
        order_id: orderId,
        handler: async (response: any) => {
          console.log('[Upgrade] Payment successful, verifying...', response);
          try {
            // Step 3: Verify payment on backend
            const verifyResponse = await apiClient.verifyRazorpayPayment(
              orderId,
              response.razorpay_payment_id,
              response.razorpay_signature
            );
            console.log('[Upgrade] Payment verified:', verifyResponse);

            // Refresh subscription context immediately
            await refreshSubscription();
            console.log('[Upgrade] Subscription refreshed');

            toast({
              title: 'Success!',
              description: 'Your subscription has been upgraded to Professional plan.',
            });

            // Wait for state to propagate before redirecting
            await new Promise(resolve => setTimeout(resolve, 300));
            navigate('/profile');
          } catch (error) {
            console.error('[Upgrade] Verification error:', error);
            const errorMessage = error instanceof Error ? error.message : 'Payment verification failed';
            toast({
              title: 'Error',
              description: errorMessage,
              variant: 'destructive',
            });
            setProcessingPayment(false);
          }
        },
        prefill: {
          name: 'User',
          email: 'user@example.com',
        },
        theme: {
          color: '#2563eb',
        },
        modal: {
          ondismiss: () => {
            console.log('[Upgrade] Payment modal dismissed');
            setProcessingPayment(false);
          },
        },
      };

      if (window.Razorpay) {
        console.log('[Upgrade] Opening Razorpay modal...');
        const razorpay = new window.Razorpay(options);
        razorpay.open();
        console.log('[Upgrade] Razorpay modal opened');
        razorpay.on('payment.failed', (response: any) => {
          console.error('[Upgrade] Payment failed:', response);
          setProcessingPayment(false);
          toast({
            title: 'Payment Failed',
            description: response.error.description || 'Payment was cancelled',
            variant: 'destructive',
          });
        });
      } else {
        throw new Error('Razorpay script not loaded');
      }
    } catch (error) {
      console.error('[Upgrade] Outer catch error:', error);
      setProcessingPayment(false);
      const errorMessage = error instanceof Error ? error.message : 'Failed to initiate payment';
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
    }
  };

  const handleUpgrade = () => {
    if (paymentType === 'recurring') {
      handleUpgradeRecurring();
    } else {
      handleUpgradeOneTime();
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
                <div className="space-y-3">
                  {/* Payment type toggle */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => setPaymentType('recurring')}
                      className={`flex-1 px-3 py-2 text-sm rounded-md font-medium transition ${
                        paymentType === 'recurring'
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      Auto-Renewing
                    </button>
                    <button
                      onClick={() => setPaymentType('onetime')}
                      className={`flex-1 px-3 py-2 text-sm rounded-md font-medium transition ${
                        paymentType === 'onetime'
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      One-Time
                    </button>
                  </div>

                  {/* Payment type info */}
                  <div className="text-xs text-gray-600 text-center">
                    {paymentType === 'recurring' 
                      ? 'Auto-renews every 30 days, cancel anytime'
                      : 'One-time payment, 30 days access'}
                  </div>

                  {/* Upgrade button */}
                  <Button
                    onClick={handleUpgrade}
                    disabled={processingPayment || isLoading}
                    className="w-full bg-blue-600 hover:bg-blue-700"
                  >
                    {processingPayment ? 'Processing...' : 'Upgrade Now'}
                  </Button>
                </div>
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
          <div className="max-w-2xl mx-auto bg-blue-50 border border-blue-200 rounded-lg p-4 flex gap-3">
            <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-blue-900 mb-1">
                Your subscription expires in {subscription.daysRemaining} days
              </p>
              <p className="text-sm text-blue-800">
                {subscription.autoRenewal 
                  ? '✓ Auto-renewal is enabled. Your subscription will automatically renew on the expiry date.'
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
              <h3 className="font-semibold text-gray-900 mb-2">What's the difference between Auto-Renewing and One-Time payment?</h3>
              <p className="text-gray-600">
                <strong>Auto-Renewing:</strong> Your subscription automatically renews every 30 days. You'll receive a reminder 3 days before renewal and can cancel anytime.
                <br/>
                <strong>One-Time:</strong> A single 30-day subscription for ₹400. After 30 days, you can purchase again if needed.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Can I cancel my subscription anytime?</h3>
              <p className="text-gray-600">
                Yes, you can cancel your auto-renewing subscription at any time from your profile. You'll have access to all professional features until the end of your current billing period. For one-time payments, you can reach out to support for a refund within 7 days of purchase.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">What happens when my subscription expires?</h3>
              <p className="text-gray-600">
                If auto-renewal is enabled, your subscription will automatically renew on the expiry date and you'll be charged ₹400. If not enabled or if the payment fails, your account will automatically downgrade to the free plan. You can export your diagrams before the downgrade takes effect.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">What if my auto-renewal payment fails?</h3>
              <p className="text-gray-600">
                Razorpay will attempt to retry the payment up to 2 more times. If all attempts fail, your subscription will be halted and your account will downgrade to the free plan. You can update your payment method and try again from your profile.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Are there any setup fees?</h3>
              <p className="text-gray-600">
                No, there are no setup fees or hidden charges. You only pay ₹400 per 30 days for the professional plan.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Is my payment secure?</h3>
              <p className="text-gray-600">
                Yes, we use Razorpay for all payments, which is PCI DSS compliant and uses industry-standard encryption to protect your payment information. Your card details are never stored on our servers.
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
