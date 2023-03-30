interface AdminStatsCardProps {
  title: string;
  value: number;
}

export default function AdminStatsCard({
  title,
  value,
}: AdminStatsCardProps) {
  return (
    <div className="border-2 p-5 flex flex-col rounded-xl m-4">
      <div className="flex items-center gap-x-6">
        <div className="flex flex-col">
          <h1 className="text-xl">{title}</h1>
          <h1 className="text-3xl font-bold">{value}</h1>
        </div>
      </div>
    </div>
  );
}
