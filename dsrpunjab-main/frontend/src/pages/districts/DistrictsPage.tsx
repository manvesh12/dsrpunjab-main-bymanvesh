import { MapPin, Search } from "lucide-react";
import { useMemo, useState } from "react";
import PageHeader from "../../components/layout/PageHeader";

const PUNJAB_DISTRICTS = [
  "Amritsar", "Barnala", "Bathinda", "Faridkot", "Fatehgarh Sahib", "Fazilka",
  "Ferozepur", "Gurdaspur", "Hoshiarpur", "Jalandhar", "Kapurthala", "Ludhiana",
  "Malerkotla", "Mansa", "Moga", "Pathankot", "Patiala", "Rupnagar",
  "Sahibzada Ajit Singh Nagar", "Sangrur", "Shaheed Bhagat Singh Nagar",
  "Sri Muktsar Sahib", "Tarn Taran",
];

export default function DistrictsPage() {
  const [search, setSearch] = useState("");
  const districts = useMemo(() => PUNJAB_DISTRICTS.filter((district) =>
    district.toLowerCase().includes(search.trim().toLowerCase())), [search]);

  return <>
    <PageHeader title="Punjab Districts" description="District directory for District Survey Reports" />
    <section className="mx-auto max-w-6xl">
      <div className="mb-6 flex flex-col gap-4 rounded-3xl border border-slate-200 bg-gradient-to-r from-blue-700 to-indigo-700 p-6 text-white shadow-lg sm:flex-row sm:items-center sm:justify-between">
        <div><p className="text-sm font-semibold text-blue-100">District Survey Report Portal</p><h2 className="mt-1 text-2xl font-black">{PUNJAB_DISTRICTS.length} Districts of Punjab</h2></div>
        <div className="relative w-full sm:w-80"><Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search district..." className="w-full rounded-xl border-0 bg-white py-3 pl-11 pr-4 text-sm font-semibold text-slate-800 outline-none ring-2 ring-white/20 placeholder:text-slate-400 focus:ring-white/70" /></div>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {districts.map((district, index) => <article key={district} className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white px-5 py-4 shadow-sm transition hover:-translate-y-0.5 hover:border-blue-300 hover:shadow-md"><span className="flex size-10 items-center justify-center rounded-xl bg-blue-50 text-sm font-black text-blue-700">{String(index + 1).padStart(2, "0")}</span><div className="min-w-0"><h3 className="truncate font-bold text-slate-900">{district}</h3><p className="mt-0.5 flex items-center gap-1 text-xs font-medium text-slate-500"><MapPin size={12} /> Punjab</p></div></article>)}
      </div>
      {!districts.length && <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-12 text-center text-sm font-semibold text-slate-500">No district matches “{search}”.</div>}
    </section>
  </>;
}
