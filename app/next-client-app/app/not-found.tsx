import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function NotFound() {
  return (
    <div className="container py-16 text-center space-y-4">
      <h2 className="font-semibold text-3xl">404 Not Found</h2>
      <p>We could not find that page.</p>
      <Button variant="ghost">
        <Link href="/">Return Home</Link>
      </Button>
    </div>
  );
}
