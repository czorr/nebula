"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Provider as ReduxProvider } from "react-redux";
import store from "./redux/store";
import { useState } from "react";

export default function Providers({ children }) {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <ReduxProvider store={store}>
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    </ReduxProvider>
  );
} 