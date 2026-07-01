"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { PasswordInput, TextInput } from "@mantine/core";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";
import { AuthSplitLayout } from "@/components/AuthSplitLayout";
import { loginUser } from "@/lib/auth-api";
import { saveAuth } from "@/lib/auth-storage";

export default function LoginPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const loginMutation = useMutation({
    mutationFn: loginUser,
    onSuccess: ([response, error]) => {
      if (error) {
        toast.error(error.message);
        return;
      }

      queryClient.clear();
      saveAuth(response);
      router.replace("/");
    },
  });

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    loginMutation.mutate({ email, password });
  }

  return (
    <AuthSplitLayout
      isSubmitting={loginMutation.isPending}
      switchHref="/register"
      switchLabel="Sign up"
      switchPrompt="New here?"
      submitLabel="Login"
      subtitle="Enter your email and password to continue reviewing VODs."
      title="Welcome back"
      onSubmit={handleSubmit}
    >
      <TextInput
        label="Email"
        placeholder="you@example.com"
        type="email"
        value={email}
        onChange={(event) => setEmail(event.currentTarget.value)}
        required
      />
      <PasswordInput
        label="Password"
        placeholder="Password"
        value={password}
        onChange={(event) => setPassword(event.currentTarget.value)}
        required
      />
    </AuthSplitLayout>
  );
}
