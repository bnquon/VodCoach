"use client";

import { ReactNode, useState } from "react";
import { MantineProvider } from "@mantine/core";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

type ProvidersProps = {
  children: ReactNode;
};

export function Providers({ children }: ProvidersProps) {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <QueryClientProvider client={queryClient}>
      <MantineProvider defaultColorScheme="dark">
        {children}
        <ToastContainer
          theme="dark"
          pauseOnFocusLoss={false}
          autoClose={2500}
          position="bottom-right"
        />
      </MantineProvider>
    </QueryClientProvider>
  );
}
