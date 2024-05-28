import { deleteConcept } from "@/api/concepts";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ApiError } from "@/lib/api/error";
import { Cross2Icon } from "@radix-ui/react-icons";
import { toast } from "sonner";
import { Tooltip } from "react-tooltip";

export async function ConceptTags({ concepts }: { concepts: Concept[] }) {
  const handleDelete = async (conceptId: number) => {
    try {
      await deleteConcept(conceptId);
      toast.success("Concept Id Deleted");
    } catch (error) {
      const errorObj = JSON.parse((error as ApiError).message);
      toast.error(
        `Unable to delete Concept id from value Error: ${errorObj.detail}`
      );
      console.error(error);
    }
  };

  return concepts && concepts?.length > 0 ? (
    <div className="flex flex-col items-start w-[250px]">
      {concepts.map((concept) => (
        <a
          key={concept.concept_code}
          data-tooltip-id="badge-tooltip"
          data-tooltip-content={`${concept.concept_id} ${
            concept.concept_name
          } ${
            concept.creation_type === "V"
              ? "(built from a OMOP vocabulary)"
              : concept.creation_type === "M"
              ? "(added manually)"
              : concept.creation_type === "R"
              ? "(added though mapping reuse)"
              : ""
          }`}
          data-tooltip-place="top"
        >
          <Tooltip id="badge-tooltip" />
          <Badge
            className={`${
              concept.creation_type === "V"
                ? "bg-carrot-vocab hover:bg-carrot-vocab"
                : concept.creation_type === "M"
                ? "bg-carrot-manual hover:bg-carrot-manual"
                : concept.creation_type === "R"
                ? "bg-carrot-reuse hover:bg-carrot-reuse"
                : ""
            }`}
            key={concept.concept_code}
          >
            <p className="pl-2 pr-1 py-1">{`${concept.concept_id} ${concept.concept_name} (${concept.creation_type})`}</p>
            <Button
              size="icon"
              variant="ghost"
              onClick={async () =>
                await handleDelete(concept.scan_report_concept_id ?? 0)
              }
            >
              <Cross2Icon />
            </Button>
          </Badge>
        </a>
      ))}
    </div>
  ) : (
    <></>
  );
}
