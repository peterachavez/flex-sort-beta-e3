import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/lib/supabaseClient';

export default function PaymentSuccess() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState('Verifying payment...');

  useEffect(() => {
    const verifyPayment = async () => {
      const session_id = searchParams.get('session_id');

      if (!session_id) {
        setStatus('Missing session ID.');
        return;
      }

      try {
        const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/verify-payment`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ session_id }),
        });

        const data = await res.json();

        if (!data.success) {
          setStatus(`Verification failed: ${data.error}`);
          return;
        }

        // Update Supabase user metadata
        await supabase.auth.updateUser({
          data: { tier: data.plan }
        });

        setStatus('Payment verified. Redirecting...');
        setTimeout(() => navigate('/results'), 1500);

      } catch (err) {
        setStatus('Error verifying payment.');
      }
    };

    verifyPayment();
  }, []);

  return <div className="p-4 text-center text-lg">{status}</div>;
}
