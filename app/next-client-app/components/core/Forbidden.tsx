import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { TriangleAlert } from "lucide-react";

export function Forbidden() {
  return (
    <Alert variant="destructive">
      <div>
        <AlertTitle className="flex items-center">
          <TriangleAlert className="h-4 w-4 mr-2" />
          Error
        </AlertTitle>
        <AlertDescription>
          You do not have permission to access this resource.
        </AlertDescription>
      </div>
    </Alert>
  );
}
