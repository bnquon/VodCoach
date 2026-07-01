"use client";

import { SubmitEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Button,
  Container,
  Paper,
  PasswordInput,
  Stack,
  Text,
  TextInput,
  Title,
} from "@mantine/core";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";
import { registerUser } from "@/lib/auth-api";
import { saveAuth } from "@/lib/auth-storage";

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
    registerMutation.mutate({ email, password });
  }

  return (
    <main>
      <Container size={420} py="xl">
        <Paper
          className="vc-elevated-card"
          component="form"
          p="lg"
          radius="md"
          onSubmit={handleSubmit}
        >
          <Stack gap="md">
            <Title order={1} size="h2">
              Register
            </Title>

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
            <Button type="submit" loading={registerMutation.isPending}>
              Create account
            </Button>
            <Text size="sm" c="dimmed">
              Already have an account?{" "}
              <Text component={Link} href="/login" inherit c="blue">
                Login
              </Text>
            </Text>
          </Stack>
        </Paper>
      </Container>
    </main>
  );
}
