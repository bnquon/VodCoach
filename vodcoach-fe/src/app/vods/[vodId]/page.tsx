import {
  Anchor,
  Breadcrumbs,
  Container,
  Stack,
  Text,
  Title,
} from "@mantine/core";
import { AuthGuard } from "@/components/AuthGuard";
import { VodReviewWorkspace } from "@/features/vod-review/components/VodReviewWorkspace";

type VodReviewPageProps = {
  params: Promise<{
    vodId: string;
  }>;
};

export default async function VodReviewPage({ params }: VodReviewPageProps) {
  const { vodId } = await params;
  const vodTitle = "Sample VOD";

  return (
    <AuthGuard>
      <main>
        <Container size="xl" py="xl">
          <Stack gap="xl">
            <Stack gap={4}>
              <Breadcrumbs>
                <Anchor href="/" size="sm">
                  Home
                </Anchor>
                <Text c="dimmed" size="sm">
                  {vodTitle}
                </Text>
              </Breadcrumbs>
              <Title order={1}>Review workspace</Title>
              <Text c="dimmed">VOD id: {vodId}</Text>
            </Stack>
            <VodReviewWorkspace videoId={vodId} vodTitle={vodTitle} />
          </Stack>
        </Container>
      </main>
    </AuthGuard>
  );
}
