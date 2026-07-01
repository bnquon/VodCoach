import { VodReviewPageClient } from "@/features/vod-review/components/VodReviewPageClient";

type VodReviewPageProps = {
  params: Promise<{
    vodId: string;
  }>;
};

export default async function VodReviewPage({ params }: VodReviewPageProps) {
  const { vodId } = await params;

  return <VodReviewPageClient vodId={vodId} />;
}
