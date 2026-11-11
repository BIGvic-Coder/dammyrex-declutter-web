/** Lightweight skeleton shown while a browse page loads on slow networks. */
export default function Loading() {
  return (
    <div className="mx-auto max-w-6xl animate-pulse px-4 py-6" aria-busy="true" aria-label="Loading items">
      <div className="h-7 w-48 rounded bg-gray-200" />
      <div className="mt-2 h-4 w-20 rounded bg-gray-200" />
      <div className="mt-4 h-11 rounded-lg bg-gray-200" />
      <div className="mt-3 h-12 rounded-xl bg-gray-200" />
      <ul className="mt-6 grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4">
        {Array.from({ length: 8 }, (_, i) => (
          <li key={i} className="overflow-hidden rounded-xl bg-white shadow-sm">
            <div className="aspect-[4/3] bg-gray-200" />
            <div className="space-y-2 p-3">
              <div className="h-5 w-20 rounded bg-gray-200" />
              <div className="h-4 w-full rounded bg-gray-200" />
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
