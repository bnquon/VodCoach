"use client";

import { ReactNode, useEffect } from "react";
import { Center, Loader } from "@mantine/core";
import { useRouter } from "next/navigation";
import { useAuthToken } from "@/lib/use-auth";

type AuthGuardProps = {
  children: ReactNode;
};

export function AuthGuard({ children }: AuthGuardProps) {
  const router = useRouter();
  const token = useAuthToken();

  useEffect(() => {
    if (token === null) {
      router.replace("/login");
    }
  }, [router, token]);

  if (!token) {
    return (
      <Center h="100vh">
        <Loader />
      </Center>
    );
  }

  return children;
}
