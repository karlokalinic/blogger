"use client";

export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <main className="not-found-page"><span>ERROR / TRANSMISSION INTERRUPTED</span><h1>The signal failed safely.</h1><p>Your local drafts were not erased. Try the route again; if it repeats, the production log will need the error details.</p><button className="primary-button" onClick={reset}>Retry transmission</button></main>;
}
