import { useEffect, useState } from 'react';
import { db } from '@/lib/db';
import { PAYMENT_DETAILS } from '@/lib/constants';

export interface PaymentDetails {
  bankName: string;
  accountNumber: string;
  accountName: string;
}

export const usePaymentDetails = () => {
  const [details, setDetails] = useState<PaymentDetails>(PAYMENT_DETAILS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    (async () => {
      const { data } = await db
        .from('site_settings')
        .select('bank_name, account_number, account_name')
        .eq('id', 'payment')
        .maybeSingle();
      if (active && data) {
        setDetails({
          bankName: data.bank_name || PAYMENT_DETAILS.bankName,
          accountNumber: data.account_number || PAYMENT_DETAILS.accountNumber,
          accountName: data.account_name || PAYMENT_DETAILS.accountName,
        });
      }
      if (active) setLoading(false);
    })();
    return () => {
      active = false;
    };
  }, []);

  return { details, loading };
};
