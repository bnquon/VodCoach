"use client";

import { ReactNode, useState } from "react";
import { createTheme, MantineProvider } from "@mantine/core";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const theme = createTheme({
  primaryColor: "vodcoachOrange",
  colors: {
    vodcoachOrange: [
      "#fff7ed",
      "#ffedd5",
      "#fed7aa",
      "#fdba74",
      "#fb923c",
      "#f97316",
      "#ea580c",
      "#c2410c",
      "#9a3412",
      "#7c2d12",
    ],
  },
});

type ProvidersProps = {
  children: ReactNode;
};

export function Providers({ children }: ProvidersProps) {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <QueryClientProvider client={queryClient}>
      <MantineProvider defaultColorScheme="dark" theme={theme}>
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
