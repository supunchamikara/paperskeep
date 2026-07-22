export default function Loading() {
  return (
    <div className="mx-auto max-w-prose animate-pulse px-5 pt-16 sm:px-8">
      <div className="h-6 w-28 rounded-pill bg-pill" />
      <div className="mt-6 h-12 w-full rounded bg-pill" />
      <div className="mt-3 h-12 w-4/5 rounded bg-pill" />
      <div className="mt-8 h-6 w-full rounded bg-pill" />
      <div className="mt-3 h-6 w-2/3 rounded bg-pill" />
      <div className="mt-10 h-[300px] w-full rounded-block bg-pill" />
    </div>
  );
}
