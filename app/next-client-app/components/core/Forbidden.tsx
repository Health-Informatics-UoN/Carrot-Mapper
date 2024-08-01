import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

export function Forbidden() {
  return (
    <Alert variant="destructive">
      <div>
        <AlertTitle className="flex items-center">
          <AlertCircle className="h-4 w-4 mr-2" />
          Error
        </AlertTitle>
        <AlertDescription>
          You do not have permission to access this resource.
        </AlertDescription>
      </div>
    </Alert>
  );
}
