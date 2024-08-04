import { cn } from "@/lib/utils";

interface InfoItemProps extends React.HTMLProps<HTMLHeadingElement> {
  label: string;
  value: string;
}

export const InfoItem: React.FC<InfoItemProps> = ({
  label,
  value,
  className,
  ...rest
}) => (
  <h3 className={cn("text-gray-500", className)} {...rest}>
    {label}: <span className="text-black">{value}</span>
  </h3>
);
