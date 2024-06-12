import { Tooltip } from "react-tooltip";
import { InfoIcon } from "lucide-react";

export function Tooltips({
  content,
  id,
  name,
}: {
  content: string;
  id: string | number;
  name: string;
}) {
  return (
    <>
      <a
        key={id}
        data-tooltip-id={`${name}-tooltip`}
        data-tooltip-content={content}
        data-tooltip-place="top"
        className="z-10"
      >
        <Tooltip id={`${name}-tooltip`} />
        <InfoIcon className="ml-1 size-4 text-carrot" />
      </a>
    </>
  );
}
