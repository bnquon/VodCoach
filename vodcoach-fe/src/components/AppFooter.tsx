"use client";

import { SubmitEvent, useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Anchor,
  Button,
  Group,
  SimpleGrid,
  Stack,
  Text,
  Textarea,
  TextInput,
  Title,
} from "@mantine/core";
import { toast } from "react-toastify";

const footerLinks = [
  { href: "/privacy", label: "Privacy" },
  { href: "/terms", label: "Terms" },
];
const WEB3FORMS_ACCESS_KEY = "3ccb779a-1b40-496b-aecb-0cd51f1e98d5";

export function AppFooter() {
  const pathname = usePathname();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [currentYear, setCurrentYear] = useState<number | null>(null);

  useEffect(() => {
    const timeoutID = window.setTimeout(() => {
      setCurrentYear(new Date().getFullYear());
    }, 0);

    return () => window.clearTimeout(timeoutID);
  }, []);

  if (
    pathname === "/login" ||
    pathname === "/register" ||
    pathname === "/privacy" ||
    pathname === "/terms" ||
    pathname.startsWith("/shared/") ||
    pathname.startsWith("/vods/")
  ) {
    return null;
  }

  async function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();

    setIsSending(true);

    const formData = new FormData(event.currentTarget);
    formData.append("access_key", WEB3FORMS_ACCESS_KEY);
    formData.append("subject", "New VODCoach contact form message");

    try {
      const response = await fetch("https://api.web3forms.com/submit", {
        method: "POST",
        body: formData,
      });
      const data = (await response.json()) as { success?: boolean };

      if (!response.ok || !data.success) {
        throw new Error("Failed to send message");
      }

      toast.success("Message sent");
      setName("");
      setEmail("");
      setMessage("");
    } catch {
      toast.error("Failed to send message");
    } finally {
      setIsSending(false);
    }
  }

  return (
    <footer className="vc-footer">
      <SimpleGrid
        className="vc-footer-inner"
        cols={{ base: 1, sm: 2 }}
        spacing="xl"
      >
        <Stack gap="lg">
          <Stack gap={6}>
            <Title order={2} size="h3">
              VODCoach
            </Title>
            <Text c="dimmed" maw={430} size="sm">
              Review gameplay, add coaching notes, draw timestamped feedback,
              and share focused VOD sessions with teammates or coaches.
            </Text>
          </Stack>

          <Group gap="lg">
            {footerLinks.map((link) => (
              <Anchor
                key={link.href}
                className="vc-footer-link"
                component={Link}
                href={link.href}
                size="sm"
              >
                {link.label}
              </Anchor>
            ))}
          </Group>

          <Text c="dimmed" size="xs">
            Copyright {currentYear ?? ""} VODCoach. All rights reserved.
          </Text>
        </Stack>

        <form onSubmit={handleSubmit}>
          <Stack gap="sm" className="vc-footer-contact">
            <Stack gap={2}>
              <Title order={3} size="h4">
                Contact
              </Title>
              <Text c="dimmed" size="sm">
                Questions, feedback, or early access requests.
              </Text>
            </Stack>

            <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="sm">
              <TextInput
                required
                label="Name"
                name="name"
                placeholder="Your name"
                value={name}
                onChange={(event) => setName(event.currentTarget.value)}
              />
              <TextInput
                required
                label="Email"
                name="email"
                placeholder="you@example.com"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.currentTarget.value)}
              />
            </SimpleGrid>
            <Textarea
              required
              autosize
              label="Message"
              minRows={3}
              name="message"
              placeholder="How can we help?"
              value={message}
              onChange={(event) => setMessage(event.currentTarget.value)}
            />
            <Button loading={isSending} type="submit" w="fit-content">
              Send message
            </Button>
          </Stack>
        </form>
      </SimpleGrid>
    </footer>
  );
}
