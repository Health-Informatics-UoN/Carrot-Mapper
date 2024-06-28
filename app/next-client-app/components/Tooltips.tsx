import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

import { InfoIcon } from "lucide-react";

export function Tooltips({
  content,
  link,
}: {
  content: string;
  link?: string;
}) {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger>
          <InfoIcon className="ml-1 size-4 text-carrot" />
        </TooltipTrigger>
        <TooltipContent>
          <p>
            {content}
            {link && (
              <>
                {" "}
                Find out more{" "}
                <a
                  href={link}
                  style={{ textDecoration: "underline" }}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  here
                </a>
              </>
            )}
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
