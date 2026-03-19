import HeapSpace from "@/components/heap/HeapSpace";

export default function Dashboard() {
  return (
    <div className="max-w-[1600px] mx-auto px-6 pt-24 pb-16">
      {/* ── Heap Visualization ── */}
      <div className="relative h-[50vh] min-h-[400px] rounded-3xl overflow-hidden border border-white/[0.04]"
        style={{
          background:
            'linear-gradient(180deg, rgba(255,255,255,0.012) 0%, rgba(255,255,255,0.003) 100%)',
        }}
      >
        <HeapSpace />
      </div>

      {/* ── Content area below ── */}
      <div className="mt-6 grid grid-cols-12 gap-4">
        <div className="col-span-12 glass rounded-2xl p-8 flex items-center justify-center min-h-[180px]">
          <p className="text-white/10 text-sm tracking-wide">
            Content area — details, charts, tables…
          </p>
        </div>
      </div>
    </div>
  );
}
