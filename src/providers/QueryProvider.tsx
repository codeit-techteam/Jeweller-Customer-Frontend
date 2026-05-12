import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React, { PropsWithChildren, useState } from "react";

export function QueryProvider({ children }: PropsWithChildren) {
  const [client] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            refetchOnWindowFocus: false,
            staleTime: 30_000,
            gcTime: 5 * 60_000,
            retry: 1,
            retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 4000),
            placeholderData: (previousData) => previousData,
          },
        },
      }),
  );

  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}
