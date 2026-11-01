/** @file useWhatsAppConsent.js @description Identity-local consent loading and serialized saving. */
import { useCallback, useEffect, useState } from 'react';
import { getWhatsAppConsent, updateWhatsAppConsent } from '../services/notificationService';
/** Mount inside an identity-keyed dialog so responses cannot cross account changes. */
export default function useWhatsAppConsent() {
  const [consent, setConsent] = useState(null);
  const [error, setError] = useState(false);
  useEffect(() => {
    let active = true;
    getWhatsAppConsent().then(({ data }) => { if (active) setConsent(data.data); })
      .catch(() => { if (active) setError(true); });
    return () => { active = false; };
  }, []);
  const save = useCallback(async (input) => {
    setError(false);
    try {
      const { data } = await updateWhatsAppConsent(input);
      setConsent(data.data);
      return data.data;
    } catch (failure) { setError(true); throw failure; }
  }, []);
  return { consent, error, save };
}
