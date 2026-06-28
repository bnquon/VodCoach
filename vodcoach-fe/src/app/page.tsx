import { AuthGuard } from "@/components/AuthGuard";
import { HomeDashboard } from "@/features/vod-dashboard/components/HomeDashboard";

export default function Home() {
  return (
    <AuthGuard>
      <HomeDashboard />
    </AuthGuard>
  );
}
