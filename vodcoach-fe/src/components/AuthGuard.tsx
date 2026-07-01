"use client";

import { ReactNode } from "react";
import { Center, Loader } from "@mantine/core";
import { redirect } from "next/navigation";
import { clearAuth, isAuthTokenExpired } from "@/lib/auth-storage";
import { useAuthToken } from "@/lib/use-auth";

type AuthGuardProps = {
  children: ReactNode;
};

export function AuthGuard({ children }: AuthGuardProps) {
  const token = useAuthToken();
  const isExpired = token ? isAuthTokenExpired(token) : false;

  if (token === undefined) {
    return (
      <Center h="100vh">
        <Loader />
      </Center>
    );
  }

  if (isExpired) {
    clearAuth();
  }

  if (!token || isExpired) {
    redirect("/login");
  }

  return children;
}
