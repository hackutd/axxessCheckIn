import { NextPage } from "next";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import AdminStatsCard from "../components/AdminStatsCard";

const StatsPage: NextPage = () => {
  const [statsData, setStatsData] = useState<Record<string, number>>();
  const router = useRouter();
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/count", {
          mode: "cors",
          method: "GET",
        });
        if (res.status !== 200) {
          alert(await res.text());
        } else {
          const data = await res.json();
          console.log(data);
          setStatsData(data.scans);
        }
      } catch (err) {
        alert(err);
      }
    })();
  }, []);
  return (
    <div>
      <div className="w-full mx-auto flex flex-col gap-y-6">
        <div className="flex-col gap-y-3 w-full md:flex-row flex justify-around gap-x-2">
          {statsData &&
            Object.keys(statsData).map((scan, i) => (
              <AdminStatsCard key={i} title={scan} value={statsData[scan]} />
            ))}
        </div>
      </div>
      <div className="w-full flex items-center justify-center">
        <button
          className="bg-blue-300 p-3 rounded-lg font-bold hover:bg-blue-200 block mt-4"
          onClick={() => {
            router.push("/");
          }}
        >
          Back
        </button>
      </div>
    </div>
  );
};

export default StatsPage;
