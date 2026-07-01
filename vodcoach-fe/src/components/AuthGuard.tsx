"use client";

import { ReactNode, useEffect } from "react";
import { Center, Loader } from "@mantine/core";
import { useRouter } from "next/navigation";
import { clearAuth, isAuthTokenExpired } from "@/lib/auth-storage";
import { useAuthToken } from "@/lib/use-auth";

type AuthGuardProps = {
  children: ReactNode;
};

export function AuthGuard({ children }: AuthGuardProps) {
  const router = useRouter();
  const token = useAuthToken();
  const isExpired = token ? isAuthTokenExpired(token) : false;
  const shouldRedirectToLogin = token === null || isExpired;

  useEffect(() => {
    if (!shouldRedirectToLogin) {
      return;
    }

    if (isExpired) {
      clearAuth();
    }

    router.replace("/login");
  }, [isExpired, router, shouldRedirectToLogin]);

  if (token === undefined || shouldRedirectToLogin) {
    return (
      <Center h="100vh">
        <Loader />
      </Center>
    );
  }

  return children;
}
