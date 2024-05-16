import { deleteConcept } from "@/api/concepts";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ApiError } from "@/lib/api/error";
import { Cross2Icon } from "@radix-ui/react-icons";
import { toast } from "sonner";

export async function ConceptTags({ concepts }: { concepts: Concept[] }) {
  const handleDelete = async (conceptId: number) => {
    try {
      await deleteConcept(conceptId);
      toast.error("Concept Id Deleted");
    } catch (error) {
      const errorObj = JSON.parse((error as ApiError).message);
      toast.error(
        `Unable to delete Concept id from value Error: ${errorObj.detail}`,
      );
      console.error(error);
    }
  };

  return concepts && concepts?.length > 0 ? (
    <div className="flex flex-col items-start w-[250px]">
      {concepts.map((concept) => (
        <Badge className="bg-carrot hover:bg-carrot" key={concept.concept_code}>
          <p className="px-[2px] py-2">{`${concept.concept_id} ${concept.concept_name}`}</p>
          <Button
            size="icon"
            variant="ghost"
            className="hover:bg-carrot hover:text-white"
            onClick={async () =>
              await handleDelete(concept.scan_report_concept_id ?? 0)
            }
          >
            <Cross2Icon />
          </Button>
        </Badge>
      ))}
    </div>
  ) : (
    <></>
  );
}
