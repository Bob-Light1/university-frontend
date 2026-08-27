/**
 * @file usePaymentReceipt.js
 * @description Downloads the PDF receipt of a fee payment.
 *
 * One hook for the three places a payment line is rendered (the campus fee
 * detail, the campus student ledger, the student's own finance page): the rule
 * for what a failure means is the same everywhere, so it is written once.
 *
 * The in-flight state is the payment id rather than a boolean, so a caller that
 * drives a whole table from one hook spins the icon of the row being downloaded
 * and not of every row at once.
 */

import { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { getPaymentReceipt } from '../services/financeService';
import { saveBlobResponse, readBlobError } from '../utils/downloadBlob';

/**
 * @param {{ campusId? }} [options] campusId is only honoured for global roles.
 * @returns {{
 *   download: (paymentId: string) => Promise<boolean>,
 *   downloadingId: string|null,
 *   error: string,
 *   clearError: () => void,
 * }}
 */
export const usePaymentReceipt = ({ campusId } = {}) => {
  const { t } = useTranslation('finance');
  const [downloadingId, setDownloadingId] = useState(null);
  const [error, setError] = useState('');

  const download = useCallback(async (paymentId) => {
    if (!paymentId) return false;
    setDownloadingId(paymentId);
    setError('');
    try {
      const response = await getPaymentReceipt(paymentId, campusId ? { campusId } : {});
      // The file name comes from the server's Content-Disposition, which carries
      // the receipt number; the fallback only covers a proxy that strips it.
      saveBlobResponse(response, { fallbackName: `receipt-${paymentId}.pdf`, type: 'application/pdf' });
      return true;
    } catch (err) {
      // The body of a failed blob request is itself a blob: without this the
      // message would always be the generic fallback, including for the 404 the
      // scope check returns.
      setError((await readBlobError(err)) || t('receipt.error'));
      return false;
    } finally {
      setDownloadingId(null);
    }
  }, [campusId, t]);

  return { download, downloadingId, error, clearError: () => setError('') };
};

export default usePaymentReceipt;
