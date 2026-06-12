export default function Loading() {
  return (
    <div className="min-h-screen bg-warm-white">
      <div className="mx-auto max-w-6xl px-4 py-12">
        <div className="h-8 w-2/3 animate-pulse rounded-lg bg-black/5" />
        <div className="mt-4 h-4 w-1/2 animate-pulse rounded bg-black/5" />

        <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              className="overflow-hidden rounded-2xl bg-white ring-1 ring-black/5"
            >
              <div className="aspect-[4/3] animate-pulse bg-black/5" />
              <div className="space-y-3 p-5">
                <div className="h-4 w-2/3 animate-pulse rounded bg-black/5" />
                <div className="h-2 w-full animate-pulse rounded bg-black/5" />
                <div className="h-9 w-full animate-pulse rounded-full bg-black/5" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
