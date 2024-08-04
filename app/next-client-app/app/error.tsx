"use client";
import Link from "next/link";

import { Button } from "@/components/ui/button";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div>
      <h2>Something went wrong!</h2>
      <Button variant="outline" onClick={() => reset()}>
        Try again.
      </Button>
      <Link href="/">Return Home</Link>
    </div>
  );
}
