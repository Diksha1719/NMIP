'use client';
import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
export function useAction() {
  const client = useQueryClient();
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  async function run<T>(action: () => Promise<T>, success = 'Changes saved.'): Promise<T|undefined> {
    setBusy(true); setError(''); setMessage('');
    try { const result = await action(); await client.invalidateQueries(); setMessage(success); return result; }
    catch (e) { setError(e instanceof Error ? e.message : 'Unable to complete this request.'); }
    finally { setBusy(false); }
  }
  return { run, busy, message, error };
}
