import { notFound } from 'next/navigation';

/** Unknown paths under a locale render the localized 404 page instead of the bare Next.js one. */
export default function CatchAll() {
  notFound();
}
