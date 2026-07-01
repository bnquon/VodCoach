"use client";

import { SubmitEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { PasswordInput, Stack, Text, TextInput } from "@mantine/core";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";
import { AuthSplitLayout } from "@/components/AuthSplitLayout";
import { registerUser } from "@/lib/auth-api";
import { saveAuth } from "@/lib/auth-storage";
import {
  PASSWORD_REQUIREMENTS,
  getPasswordStrengthError,
} from "@/lib/password-policy";

export default function RegisterPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const registerMutation = useMutation({
    mutationFn: registerUser,
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

  function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();

    const passwordError = getPasswordStrengthError(password);
    if (passwordError) {
      toast.error(passwordError);
      return;
    }

    registerMutation.mutate({ email, password });
  }

  return (
    <AuthSplitLayout
      isSubmitting={registerMutation.isPending}
      switchHref="/login"
      switchLabel="Login"
      switchPrompt="Already have an account?"
      submitLabel="Create account"
      subtitle="Create an account with your email and password."
      title="Create an account"
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
        description={
          <Stack gap={2} mt={4}>
            {PASSWORD_REQUIREMENTS.map((requirement) => (
              <Text key={requirement} c="dimmed" size="xs">
                {requirement}
              </Text>
            ))}
          </Stack>
        }
        error={password ? getPasswordStrengthError(password) : null}
        value={password}
        onChange={(event) => setPassword(event.currentTarget.value)}
        required
      />
    </AuthSplitLayout>
  );
}
