import { Container, Stack, Text, Title } from "@mantine/core";
import { VodReviewWorkspace } from "@/features/vod-review/components/VodReviewWorkspace";

type VodReviewPageProps = {
  params: Promise<{
    vodId: string;
  }>;
};

export default async function VodReviewPage({ params }: VodReviewPageProps) {
  const { vodId } = await params;

  return (
    <main>
      <Container size="xl" py="xl">
        <Stack gap="xl">
          <Stack gap={4}>
            <Title order={1}>Review workspace</Title>
            <Text c="dimmed">VOD id: {vodId}</Text>
          </Stack>
          <VodReviewWorkspace videoId={vodId} />
        </Stack>
      </Container>
    </main>
  );
}
