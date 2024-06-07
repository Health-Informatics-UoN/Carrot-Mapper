"use client"; // Error components must be Client Components

import { Button } from "@/components/ui/button";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  reset = () => {
    const urlWithoutParams = window.location.href.split("?")[0];
    window.location.href = urlWithoutParams;
  };
  return (
    <div className="flex flex-col justify-center items-center h-screen">
      <h2 className="text-lg mb-2">
        Sorry! The option you chose may be invalid. Please try again!
      </h2>
      <Button className="text-lg" onClick={reset}>
        Try again
      </Button>
    </div>
  );
}
