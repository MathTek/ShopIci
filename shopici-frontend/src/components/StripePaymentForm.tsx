import React, { useState } from 'react';
import { useStripe, useElements, PaymentElement, Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);

interface StripePaymentFormProps {
  clientSecret: string;
  onSuccess: () => void;
  onBack: () => void;
  loading?: boolean;
}

const PaymentFormContent: React.FC<StripePaymentFormProps> = ({
  clientSecret,
  onSuccess,
  onBack,
  loading = false,
}) => {
  const stripe = useStripe();
  const elements = useElements();
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      setError('Stripe is not loaded');
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      const { error: submitError } = await elements.submit();
      if (submitError) {
        console.error('Submit error:', submitError);
        setError(submitError.message || 'Form submission failed');
        setIsProcessing(false);
        return;
      }
      
      const result = await stripe.confirmPayment({
        elements,
        clientSecret,
        confirmParams: {
          return_url: `${window.location.origin}/order-confirmation`,
        },
      });


      if (result?.error) {
        console.error('Payment error:', result.error);
        setError(result.error.message || 'Payment failed');
        setIsProcessing(false);
      } else {
      }
    } catch (err) {
      console.error('Exception:', err);
      setError(err instanceof Error ? err.message : 'Unexpected error');
      setIsProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <PaymentElement />

      {error && (
        <p className="text-sm text-red-300 rounded-md bg-red-500/10 border border-red-400/30 px-3 py-2">
             {error}
        </p>
      )}

      <button
        type="submit"
        disabled={!stripe}
        className="w-full px-4 py-3 rounded-xl bg-gradient-to-r from-indigo-400 to-purple-400 text-white font-semibold transition duration-200 shadow-lg shadow-indigo-600/20 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
      >
        Pay Now
      </button>

      <button
        type="button"
        onClick={onBack}
        disabled={isProcessing || loading}
        className="w-full px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-slate-200 transition cursor-pointer disabled:opacity-50"
      >
        Back
      </button>
    </form>
  );
};

const StripePaymentForm: React.FC<StripePaymentFormProps> = ({
  clientSecret,
  onSuccess,
  onBack,
  loading = false,
}) => {
  const options = {
    clientSecret,
    appearance: { theme: 'night' as const },
  };

  return (
    <Elements stripe={stripePromise} options={options}>
      <PaymentFormContent
        clientSecret={clientSecret}
        onSuccess={onSuccess}
        onBack={onBack}
        loading={loading}
      />
    </Elements>
  );
};

export default StripePaymentForm;
