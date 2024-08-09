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
  <h3 className={cn("text-gray-500 dark:text-gray-400", className)} {...rest}>
    {label}: <span className="text-black dark:text-white">{value}</span>
  </h3>
);
