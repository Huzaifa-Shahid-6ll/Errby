export default function Loading() {
  return (
    <main className="app-loading" aria-busy="true" aria-label="Loading page">
      <p className="wordmark">
        errby<span>.</span>
      </p>
      <p role="status">
        <Thinking state="connecting" />
        Opening your workspace…
      </p>
      <div aria-hidden="true">
        <div className="loading-line" />
        <div className="loading-line" />
        <div className="loading-line" />
      </div>
    </main>
  );
}
import { Thinking } from "@/components/ui/learning-effects";
