import { SharedVodReviewPageClient } from "@/features/vod-review/components/SharedVodReviewPageClient";

type SharedVodReviewPageProps = {
  params: Promise<{
    shareToken: string;
  }>;
};

export default async function SharedVodReviewPage({
  params,
}: SharedVodReviewPageProps) {
  const { shareToken } = await params;

  return <SharedVodReviewPageClient shareToken={shareToken} />;
}
