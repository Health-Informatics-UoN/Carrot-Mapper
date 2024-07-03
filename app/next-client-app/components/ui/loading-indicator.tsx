import { Loader2 } from "lucide-react";

const Loading = ({ text }: { text: string }) => {
  return (
    <div className="flex gap-2">
      <Loader2 className="h-6 w-6 animate-spin" />
      {text}
    </div>
  );
};

export { Loading };
