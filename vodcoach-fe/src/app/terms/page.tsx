import { Container, Stack, Text, Title } from "@mantine/core";

export default function TermsPage() {
  return (
    <main>
      <Container size="md" py="xl">
        <Stack gap="lg">
          <Stack gap={6}>
            <Title order={1}>Terms of Use</Title>
            <Text c="dimmed" size="sm">
              Last updated: June 30, 2026
            </Text>
          </Stack>

          <Text>
            VODCoach is a gameplay review tool for uploading VODs, creating
            notes and drawings, and sharing review sessions with invited guests.
          </Text>

          <Text>
            You are responsible for the videos and feedback you upload or share.
            Do not upload content you do not have permission to use, and do not
            use share links to distribute content in ways that violate another
            service&apos;s rules or rights.
          </Text>

          <Text>
            Share links can grant view or comment access to a specific VOD.
            Anyone with a valid share link may access that shared VOD according
            to the permissions you selected until the link is revoked or no
            longer valid.
          </Text>

          <Text>
            The service is provided as-is during development. Features,
            availability, storage behavior, and limits may change as the product
            evolves.
          </Text>

          <Text>
            For terms or product questions, use the contact form in the footer.
          </Text>
        </Stack>
      </Container>
    </main>
  );
}
