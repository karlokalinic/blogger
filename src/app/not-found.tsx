import Link from "next/link";

export default function NotFound() {
  return <main className="not-found-page"><span>ERROR / SIGNAL LOST / 404</span><h1>This record was never filed.</h1><p>The address may belong to a cut version of the world, or to nothing yet.</p><div><Link href="/" className="primary-button">Return to signal</Link><Link href="/archive" className="text-button">Search archive</Link></div></main>;
}
