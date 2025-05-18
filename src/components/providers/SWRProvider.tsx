'use client';

import { SWRConfig } from 'swr';

export function SWRProvider({ children }: { children: React.ReactNode }) {
  return (
    <SWRConfig
      value={{
        fetcher: (resource, init) =>
          fetch(resource, init).then(res => {
            if (!res.ok) throw new Error('Network response was not ok');
            return res.json();
          }),
        onError: err => {
          console.error('SWR error:', err);
        },
        revalidateOnFocus: true,
        shouldRetryOnError: true,
      }}
    >
      {children}
    </SWRConfig>
  );
}
