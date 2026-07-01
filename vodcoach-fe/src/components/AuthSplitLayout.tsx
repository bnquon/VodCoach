"use client";

import { type SubmitEvent, type ReactNode } from "react";
import Link from "next/link";
import { Box, Button, Paper, Stack, Text, Title } from "@mantine/core";

type AuthSplitLayoutProps = {
  children: ReactNode;
  isSubmitting: boolean;
  switchHref: string;
  switchLabel: string;
  switchPrompt: string;
  submitLabel: string;
  subtitle: string;
  title: string;
  onSubmit: (event: SubmitEvent<HTMLFormElement>) => void;
};

export function AuthSplitLayout({
  children,
  isSubmitting,
  switchHref,
  switchLabel,
  switchPrompt,
  submitLabel,
  subtitle,
  title,
  onSubmit,
}: AuthSplitLayoutProps) {
  return (
    <main className="vc-auth-page">
      <Box className="vc-auth-shell">
        <Paper
          className="vc-auth-card"
          component="form"
          radius="lg"
          onSubmit={onSubmit}
        >
          <Stack gap="xl">
            <Stack gap={2}>
              <Text fw={700}>VODCoach</Text>
              <Text size="sm" c="dimmed">
                {switchPrompt}{" "}
                <Text
                  className="vc-auth-inline-link"
                  component={Link}
                  href={switchHref}
                  inherit
                >
                  {switchLabel}
                </Text>
              </Text>
            </Stack>

            <Stack gap={6}>
              <Title order={1} size="h2">
                {title}
              </Title>
              <Text c="dimmed" size="sm">
                {subtitle}
              </Text>
            </Stack>

            <Stack gap="md">
              {children}
              <Button type="submit" loading={isSubmitting} fullWidth>
                {submitLabel}
              </Button>
            </Stack>

            <Text c="dimmed" size="xs" ta="center">
              By continuing, you agree to the{" "}
              <Text
                className="vc-auth-inline-link"
                component={Link}
                href="/terms"
                inherit
              >
                Terms
              </Text>{" "}
              and{" "}
              <Text
                className="vc-auth-inline-link"
                component={Link}
                href="/privacy"
                inherit
              >
                Privacy Policy
              </Text>
              .
            </Text>
          </Stack>
        </Paper>

        <Box className="vc-auth-image-panel">
          <Box
            alt="Gameplay review workspace"
            className="vc-auth-image"
            component="img"
            src="/authPicture.jpg"
          />
          <Box className="vc-auth-image-overlay" />
        </Box>
      </Box>
    </main>
  );
}
