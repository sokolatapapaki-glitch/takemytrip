import BatchConsole from "@/components/BatchConsole";

export const dynamic = "force-dynamic";

export default function BatchPage() {
  return (
    <div>
      <a href="/" style={{ fontSize: 13 }}>← Πόλεις</a>
      <BatchConsole />
    </div>
  );
}
