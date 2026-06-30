"use client";

import { SubmitEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Button,
  Container,
  Text,
  Paper,
  PasswordInput,
  Stack,
  TextInput,
  Title,
} from "@mantine/core";
import { useMutation } from "@tanstack/react-query";
import { toast } from "react-toastify";
import { loginUser } from "@/lib/auth-api";
import { saveAuth } from "@/lib/auth-storage";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const loginMutation = useMutation({
    mutationFn: loginUser,
    onSuccess: ([response, error]) => {
      if (error) {
        toast.error(error.message);
        return;
      }

      saveAuth(response);
      router.replace("/");
    },
  });

  function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    loginMutation.mutate({ email, password });
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
              Login
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
            <Button type="submit" loading={loginMutation.isPending}>
              Continue
            </Button>
            <Text size="sm" c="dimmed">
              Need an account?{" "}
              <Text component={Link} href="/register" inherit c="blue">
                Register
              </Text>
            </Text>
          </Stack>
        </Paper>
      </Container>
    </main>
  );
}
