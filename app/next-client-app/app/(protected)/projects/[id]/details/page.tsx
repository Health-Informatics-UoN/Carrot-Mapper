import { getproject } from "@/api/projects";
import { AvatarList } from "@/components/core/avatar-list";

interface ProjectProps {
  params: {
    id: string;
  };
}

export default async function ProjectDetails({ params: { id } }: ProjectProps) {
  const project = await getproject(id);

  return (
    <div className="flex flex-col gap-3 text-lg">
      <div className="flex items-center space-x-3">
        <h3 className="flex">
          Project Name: <span className="text-carrot ml-2">{project.name}</span>
        </h3>
      </div>
      <div className="flex items-center space-x-3">
        <h3 className="flex items-center">
          Members:{" "}
          <span className="text-carrot ml-2">
            <AvatarList
              numPeople={project.members.length}
              names={project.members.map((member) => member.username)}
            />
          </span>
        </h3>
      </div>
    </div>
  );
}
