import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

export async function Concepts({ concepts }: { concepts: Concept[] }) {
  const badges = () => {
    if (concepts && concepts?.length > 0) {
      return (
        <div className="flex flex-col items-start w-[250px]">
          {concepts.map((concept) => (
            <Badge
              className="bg-carrot hover:bg-carrot"
              key={concept.concept_code}
            >
              <p className="px-[2px] py-2">{`${concept.concept_id} ${concept.concept_name}`}</p>{" "}
              <Button
                size="sm"
                variant="ghost"
                className="hover:bg-carrot hover:text-white"
              >
                <X />
              </Button>
            </Badge>
          ))}
        </div>
      );
    } else return <></>;
  };
  return badges();
}
