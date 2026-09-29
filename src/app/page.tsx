import { Gallery } from "@/components/gallery";
import { getSettings, getTotalVotes, getWorks } from "@/lib/queries";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [works, totalVotes, settings] = await Promise.all([getWorks(), getTotalVotes(), getSettings()]);
  return <Gallery works={works} totalVotes={totalVotes} votingOpen={settings.votingOpen} />;
}
