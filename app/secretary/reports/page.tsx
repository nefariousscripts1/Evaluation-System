"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import BarChart from "@/components/charts/BarChart";
import PieChart from "@/components/charts/PieChart";
import Table from "@/components/ui/Table";
import Select from "@/components/ui/Select";

interface Result {
  id: number;
  user: { name: string; email: string; role: string };
  academicYear: string;
  averageRating: number;
}

export default function ReportsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [results, setResults] = useState<Result[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    academicYear: "",
    role: "",
  });
  const [years, setYears] = useState<string[]>([]);
  const [roles] = useState(["faculty", "chairperson", "dean", "director", "campus_director"]);

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
    if (status === "authenticated" && session?.user?.role !== "admin") router.push("/unauthorized");
    fetchData();
  }, [filters]);

  const fetchData = async () => {
    const params = new URLSearchParams();
    if (filters.academicYear) params.append("academicYear", filters.academicYear);
    if (filters.role) params.append("role", filters.role);
    const res = await fetch(`/api/reports?${params.toString()}`);
    const data = await res.json();
    setResults(data.results);
    setYears(data.years);
    setLoading(false);
  };

  const columns = [
    { header: "Name", accessor: (r: Result) => r.user.name || r.user.email },
    { header: "Role", accessor: (r: Result) => r.user.role },
    { header: "Academic Year", accessor: "academicYear" },
    { header: "Average Rating", accessor: (r: Result) => r.averageRating.toFixed(2) },
  ];

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Evaluation Reports</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <Select
          label="Academic Year"
          value={filters.academicYear}
          onChange={(e) => setFilters({ ...filters, academicYear: e.target.value })}
          options={[{ value: "", label: "All Years" }, ...years.map(y => ({ value: y, label: y }))]}
        />
        <Select
          label="Role"
          value={filters.role}
          onChange={(e) => setFilters({ ...filters, role: e.target.value })}
          options={[{ value: "", label: "All Roles" }, ...roles.map(r => ({ value: r, label: r }))]}
        />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="bg-white p-4 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-2">Average Rating by Role</h2>
          <BarChart data={results} groupBy="user.role" valueKey="averageRating" />
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-2">Distribution of Ratings</h2>
          <PieChart data={results} valueKey="averageRating" />
        </div>
      </div>
      <div className="bg-white rounded-lg shadow">
        <h2 className="text-lg font-semibold p-4 border-b">Detailed Results</h2>
        <Table columns={columns} data={results} />
      </div>
    </div>
  );
}