import PageHeader from "../../components/layout/PageHeader";
import ResizableLayout from "../../components/layout/ResizableLayout";
import ModuleEditor, {
  type EditorColumn,
} from "../../components/ui/ModuleEditor";
import { useCallback, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import {
  CheckCircle2,
  Download,
  FileSpreadsheet,
  GripVertical,
  Plus,
  Copy,
  Trash2,
} from "lucide-react";
import { useLocalDraft } from "../../hooks/useLocalDraft";
import {
  exportAnnexureExcel,
  exportAnnexurePdf,
} from "../../utils/annexureExport";

type Section = { title: string; description: string; columns: string[] };
const col = (labels: string[]): EditorColumn[] =>
  labels.map((label) => ({
    key: label
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "_")
      .replace(/^_|_$/g, ""),
    label,
  }));
const cluster = [
  "River Name",
  "Cluster No.",
  "Lease No.",
  "Location (Riverbed / Patta Land)",
  "Village",
  "Area (in Ha.)",
  "Total Excavation (MT)",
  "Total Mineral Excavation (MT) (Considering 60% as per EMGSM, 2020)",
];
const contiguous = [
  "River Name",
  "Contiguous Cluster No.",
  "Cluster No.",
  "Number of leases in the cluster",
  "Location (Riverbed / Patta Land)",
  "Distance between clusters",
  "Village",
  "Area Of Cluster (Ha)",
  "Total Mineral Excavation (MT) (Considering 60% as per EMGSM, 2020)",
];
export const annexureTemplates: Record<
  string,
  { title: string; description: string; items: Section[] }
> = {
  "1": {
    title: "Annexure I - Sand Sources",
    description: "Original source inventory formats",
    items: [
      {
        title: "a) Rivers",
        description: "River source master",
        columns: [
          "River Name/M-Sand Plant",
          "Total Stretch of River (in KM)",
          "Type of River (Perennial or Non Perennial)",
        ],
      },
      {
        title: "b) De-Siltation Location (Lakes/Ponds/Dams etc.)",
        description: "Reservoir and desiltation locations",
        columns: [
          "Name of Reservoir/Dams",
          "Maintain/Controlled by State Govt./PSU etc.",
          "Latitude",
          "Longitude",
          "District",
          "Tehsil",
          "Village",
          "Size (Ha)",
        ],
      },
      {
        title: "c) Patta lands/Khatedari land",
        description: "Private land source details",
        columns: [
          "Owner",
          "SL. No",
          "Area (Ha)",
          "District",
          "Tehsil",
          "Village",
          "Agricultural Land (Yes/No)",
        ],
      },
      {
        title: "d) M-Sand Plants",
        description: "Manufactured sand plant inventory",
        columns: [
          "Plant Name",
          "Owner",
          "District",
          "Tehsil",
          "Village",
          "Geo-location",
          "Quantity Tonnes/Annum",
        ],
      },
    ],
  },
  "2": {
    title: "Annexure II - Mining Leases",
    description: "Existing and proposed mining lease formats",
    items: [
      {
        title: "a) Potential Mining Leases – Rivers",
        description: "Riverbed lease schedule",
        columns: [
          "Sl. No.",
          "River Details",
          "Sand Bar Code",
          "Lease Details",
          "Area (Ha)",
          "Latitude",
          "Longitude",
          "Distance from PA/WC (KM)",
          "Within 500m? (Cluster Area)",
          "Bulk Density (gm/cc)",
          "Depth of Deposit (m)",
          "Total Excavation (MT/YR)",
          "Total Excavation (Net 60%)",
          "Mineral",
          "Existing/Proposed",
          "Remarks",
        ],
      },
      {
        title: "b) Patta lands/Khatedari land",
        description: "Existing and proposed private land leases",
        columns: [
          "Sl.no",
          "Owner",
          "Sy.No (Khasra No)",
          "Area (Ha)",
          "Latitude",
          "Longitude",
          "District",
          "Tehsil",
          "Village",
          "Total Reserve (MT)",
          "Total Mineral (60% MT)",
          "Existing/Proposed",
          "Remarks",
        ],
      },
      {
        title: "c) De-Siltation Locations",
        description: "Existing and proposed desiltation sites",
        columns: [
          "Name of Reservoir/Dams",
          "Maintain/Controlled by State Govt./PSU etc.",
          "Latitude",
          "Longitude",
          "District",
          "Tehsil",
          "Village",
          "Size (Ha)",
          "Quantity MT/Year",
          "Existing/Proposed",
        ],
      },
      {
        title: "d) M-Sand Plants",
        description: "Existing and proposed plant schedule",
        columns: [
          "Plant Name",
          "Owner",
          "District",
          "Tehsil",
          "Village",
          "Geo-location",
          "Quantity Tonnes/Annum",
          "Existing/Proposed",
        ],
      },
    ],
  },
  "3": {
    title: "Annexure III - Cluster Details",
    description: "Original cluster and contiguous cluster schedules",
    items: [
      {
        title: "a) Cluster Details",
        description: "Lease grouping schedule",
        columns: cluster,
      },
      {
        title: "b) Contiguous Clusters",
        description: "Inter-cluster schedule",
        columns: contiguous,
      },
    ],
  },
  "4": {
    title: "Annexure IV - Transportation Routes",
    description: "Transportation routes for individual leases and leases in cluster",
    items: [
      {
        title: "Annexure IV(a) - Lease Routes",
        description: "Original lease transportation route schedule",
        columns: [
          "Sl.No.",
          "Lease No.",
          "Transportation Route No.",
          "Number of Tippers/Day (of Lease)",
          "Number of Tippers/Day (of All Leases on Route)",
          "Length of Route (Km)",
          "Type of Road",
          "Recommendation for Road",
          "The Road Will Be Constructed By",
          "Route Map & Location",
        ],
      },
      {
        title: "Annexure IV(b) - Cluster Routes",
        description: "Transportation routes shared by lease clusters",
        columns: [
          "Cluster No.",
          "Transportation Route No.",
          "Number of Tippers/Day (of Cluster)",
          "Number of Tippers/Day (of All Clusters on Route)",
          "Length of Route in KM",
          "Type of Road",
          "Recommendation for Road",
          "The Road Will Be Constructed By",
          "Route Map & Location",
        ],
      },
    ],
  },
  "5": {
    title: "Annexure V - Bench Mark, CORS & Mining Leases",
    description: "Bench mark control points and final mining lease schedules",
    items: [
      {
        title: "Annexure V - Bench Mark & CORS",
        description: "Survey reference points used for bench mark and CORS control",
        columns: [
          "Point Name",
          "Type",
          "Latitude",
          "Longitude",
          "Elevation (m)",
          "Remarks",
        ],
      },
      {
        title: "Annexure V - Mining Leases",
        description: "River mining lease schedule (same official format as Annexure II)",
        columns: [
          "Sl No.",
          "River Details",
          "Sand Bar Code",
          "Lease Details",
          "Area (Ha.)",
          "Latitude",
          "Longitude",
          "Distance (KM) from PA/BR/WC",
          "Distance from Forest Area (KM)",
          "Mining leases within 500 m (if yes cluster area)",
          "Bulk Density (gm/cc)",
          "Depth of Deposit [Actual avg depth or 3m]",
          "Total Excavation (MT/YR)",
          "Total Excavation MT/YR (Consid. 60%)",
          "Mineral to be mined",
          "Existing / Proposed",
          "Remarks",
        ],
      },
      {
        title: "Annexure V - Patta Lands",
        description: "Patta lands / Khatedari land lease schedule",
        columns: [
          "Sl. No.", "Owner", "Sy. No. (Khasra No.)", "Area (Ha)",
          "Latitude", "Longitude", "District", "Tehsil", "Village",
          "Total Reserve (MT)", "Total Mineral (60% MT)",
          "Existing/Proposed", "Remarks",
        ],
      },
      {
        title: "Annexure V - De-siltation",
        description: "Reservoir, pond and dam de-siltation schedule",
        columns: [
          "Name of Reservoir/Dams", "Maintain/Controlled by State Govt./PSU etc.",
          "Latitude", "Longitude", "District", "Tehsil", "Village", "Size (Ha)",
          "Quantity (MT/Year)", "Existing/Proposed",
        ],
      },
      {
        title: "Annexure V - M-Sand Plants",
        description: "Manufactured sand plant schedule",
        columns: [
          "Plant Name", "Owner", "District", "Tehsil", "Village", "Geo-location",
          "Quantity (Tonnes/Annum)", "Existing/Proposed",
        ],
      },
      {
        title: "Bench Mark & CORS",
        description: "Survey reference points used for bench mark and CORS control",
        columns: [
          "Point Name",
          "Type",
          "Latitude",
          "Longitude",
          "Elevation (m)",
          "Remarks",
        ],
      },
    ],
  },
  "6": {
    title: "Annexure VI - Final Cluster Details",
    description: "Final approved cluster schedules",
    items: [
      {
        title: "Final Cluster Details",
        description: "Final individual cluster table",
        columns: cluster,
      },
      {
        title: "Final Contiguous Clusters",
        description: "Final contiguous cluster table",
        columns: contiguous,
      },
    ],
  },
  "7": {
    title: "Annexure VII - Transportation Routes",
    description: "Individual lease and cluster transportation route schedules",
    items: [
      {
        title: "Annexure VII - Individual Routes",
        description: "Transportation routes for individual leases",
        columns: [
          "Sl.No.",
          "Lease No.",
          "Transportation Route No.",
          "Number of Tippers/day (of lease)",
          "Number of tippers/day (of all Leases on route)",
          "Length of Route (Km)",
          "Type of Road",
          "Recommendation for road",
          "The road will be constructed by",
          "Route Map & Location",
        ],
      },
      {
        title: "Annexure VII - Cluster Routes",
        description: "Transportation routes shared by lease clusters",
        columns: [
          "Cluster No",
          "Transportation Route No.",
          "Number of tippers/day (of Cluster)",
          "Number of Tippers/day (of all clusters on route)",
          "Length of Route in KM",
          "Type of Road",
          "Recommendation for road",
          "The road will be constructed by",
          "Route Map & Location",
        ],
      },
    ],
  },
};

type Snapshot = {
  title: string;
  columns: EditorColumn[];
  rows: Record<string, string>[];
  attachments?: string[];
};

export default function AnnexureEditorPage({ annexure }: { annexure: string }) {
  const { projectId = "default" } = useParams();
  const data = annexureTemplates[annexure] ?? annexureTemplates["1"];
  const templateStorageVersion =
    annexure === "4"
      ? "4-v2"
      : annexure === "5"
        ? "5-v2"
        : annexure === "7"
          ? "7-v2"
          : annexure;
  const [annexureTitle, setAnnexureTitle] = useLocalDraft<string>(
    `project-${projectId}:annexure-${annexure}:heading`,
    data.title,
  );
  const [annexureDescription, setAnnexureDescription] = useLocalDraft<string>(
    `project-${projectId}:annexure-${annexure}:description`,
    data.description,
  );
  const resolvedAnnexureTitle = annexureTitle.trim() || data.title;
  const [snapshots, setSnapshots] = useState<Record<number, Snapshot>>({});
  const [customTables, setCustomTables] = useLocalDraft<number>(
    `project-${projectId}:annexure-${templateStorageVersion}:custom-tables`,
    0,
  );

  const total = data.items.length + customTables;

  const [orderDraft, setOrderDraft] = useLocalDraft<number[] | null>(
    `project-${projectId}:annexure-${annexure}:table-order`,
    null,
  );

  const order =
    orderDraft ??
    Array.from({ length: data.items.length + customTables }, (_, i) => i);
    
  const setOrder = useCallback(
    (newOrder: number[] | ((prev: number[]) => number[])) => {
      if (typeof newOrder === "function") {
        setOrderDraft((prev) =>
          newOrder(
            prev ??
              Array.from(
                { length: data.items.length + customTables },
                (_, i) => i,
              ),
          ),
        );
      } else {
        setOrderDraft(newOrder);
      }
    },
    [data.items.length, customTables, setOrderDraft],
  );

  const handleDuplicate = (originalIndex: number, pos: number) => {
    const newIndex = data.items.length + customTables;
    setCustomTables((c) => c + 1);

    const storageKeySuffix = annexure === "5" ? "5-v2" : annexure;
    const sourceKey = `draft:project-${projectId}:annexure-${storageKeySuffix}-${originalIndex}`;
    const targetKey = `draft:project-${projectId}:annexure-${storageKeySuffix}-${newIndex}`;

    const sourceData = localStorage.getItem(sourceKey);
    if (sourceData) {
      localStorage.setItem(targetKey, sourceData);
    }

    setOrder((prev) => {
      const arr = [...prev];
      arr.splice(pos + 1, 0, newIndex);
      return arr;
    });
  };

  const handleDelete = (originalIndex: number, pos: number) => {
    setOrder((prev) => prev.filter((idx) => idx !== originalIndex));
  };

  const handleAddTableAt = (pos: number) => {
    const newIndex = data.items.length + customTables;
    setCustomTables((c) => c + 1);

    setOrder((prev) => {
      const arr = [...prev];
      arr.splice(pos + 1, 0, newIndex);
      return arr;
    });
  };

  const update = useCallback(
    (index: number, snapshot: Snapshot) =>
      setSnapshots((current) =>
        current[index] === snapshot
          ? current
          : { ...current, [index]: snapshot },
      ),
    [],
  );

  /* ── Drag-and-drop state ── */
  const dragIndexRef = useRef<number | null>(null); // position in `order` array
  const [dragOverPos, setDragOverPos] = useState<number | null>(null);

  const handleDragStart = (pos: number) => {
    dragIndexRef.current = pos;
  };
  const handleDragOver = (e: React.DragEvent, pos: number) => {
    e.preventDefault();
    setDragOverPos(pos);
  };
  const handleDrop = (toPos: number) => {
    const fromPos = dragIndexRef.current;
    if (fromPos === null || fromPos === toPos) {
      setDragOverPos(null);
      return;
    }
    setOrder((prev) => {
      const arr = [...prev];
      const [item] = arr.splice(fromPos, 1);
      arr.splice(toPos, 0, item);
      return arr;
    });
    dragIndexRef.current = null;
    setDragOverPos(null);
  };
  const handleDragEnd = () => {
    dragIndexRef.current = null;
    setDragOverPos(null);
  };

  return (
    <>
      <PageHeader
        backLink={`/projects/${projectId}`}
        title={
          <input
            aria-label={`Edit ${data.title} heading`}
            className="w-full min-w-0 border-b border-dashed border-blue-300 bg-transparent font-inherit text-inherit outline-none transition focus:border-solid focus:border-blue-600"
            value={annexureTitle}
            onChange={(event) => setAnnexureTitle(event.target.value)}
            style={{ font: "inherit", color: "inherit" }}
            onBlur={() => {
              if (!annexureTitle.trim()) setAnnexureTitle(data.title);
            }}
            title="Click to edit annexure heading"
          />
        }
        description={
          <input
            aria-label={`Edit ${data.title} description`}
            className="w-full min-w-0 border-b border-dashed border-slate-300 bg-transparent font-inherit text-inherit outline-none transition focus:border-solid focus:border-emerald-600"
            value={annexureDescription}
            onChange={(event) => setAnnexureDescription(event.target.value)}
            onBlur={() => {
              if (!annexureDescription.trim()) {
                setAnnexureDescription(data.description);
              }
            }}
            title="Click to edit annexure description"
          />
        }
        action={
          <div className="flex flex-wrap gap-2">
            <div
              className="inline-flex items-center gap-1.5 rounded-md border border-emerald-600 bg-emerald-50 px-3 py-2 text-sm font-bold text-emerald-700"
              title="This annexure format is complete and editable"
            >
              <CheckCircle2 size={17} />
              Green Flag
            </div>
            <button
              className="module-btn"
              onClick={() =>
                exportAnnexureExcel(resolvedAnnexureTitle, Object.values(snapshots))
              }
            >
              <FileSpreadsheet size={17} />
              Excel
            </button>
            <button
              className="module-btn"
              onClick={() =>
                exportAnnexurePdf(resolvedAnnexureTitle, Object.values(snapshots))
              }
            >
              <Download size={17} />
              PDF
            </button>
            <button
              className="module-btn-primary"
              onClick={() => {
                const newIndex = data.items.length + customTables;
                setCustomTables((value) => value + 1);
                setOrder((prev) => [...prev, newIndex]);
              }}
            >
              <Plus size={17} />
              Create New Table
            </button>
          </div>
        }
      />
      <div className="mb-5 rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-800">
        Table names, column headers, rows and values are fully editable.
        Download a CSV template or upload a filled CSV to create entries
        automatically.{" "}
        <span className="font-semibold">
          Drag the ⠿ handle on each table to reorder — the live preview updates instantly.
        </span>
      </div>
      <div className="h-[calc(100vh-14rem)] flex">
        <ResizableLayout
          leftPanelDefaultSize={60}
          rightPanelDefaultSize={40}
          leftPanel={
            <div className="min-w-0 pb-12">
              {order.map((originalIndex, pos) => {
                const item = data.items[originalIndex] ?? {
                  title: `New Table ${originalIndex - data.items.length + 1}`,
                  description: "Custom annexure table",
                  columns: ["Column 1", "Column 2"],
                };
                const isDragOver =
                  dragOverPos === pos &&
                  dragIndexRef.current !== null &&
                  dragIndexRef.current !== pos;

                return (
                  <div
                    key={originalIndex}
                    draggable
                    onDragStart={() => handleDragStart(pos)}
                    onDragOver={(e) => handleDragOver(e, pos)}
                    onDrop={() => handleDrop(pos)}
                    onDragEnd={handleDragEnd}
                    className={`relative mb-0 transition-all ${
                      isDragOver
                        ? "border-t-4 border-blue-500 pt-1"
                        : "border-t-4 border-transparent"
                    }`}
                  >
                    {/* Drag handle bar */}
                    <div
                      className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 border border-b-0 border-slate-200 rounded-t-xl cursor-grab active:cursor-grabbing select-none group hover:bg-blue-50 hover:border-blue-200 transition-colors"
                      title="Drag to reorder this table"
                    >
                      <GripVertical
                        size={16}
                        className="text-slate-400 group-hover:text-blue-500 transition-colors"
                      />
                      <span className="text-xs font-semibold text-slate-500 group-hover:text-blue-600 transition-colors truncate">
                        {item.title}
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono shrink-0">
                        #{pos + 1}
                      </span>
                      
                      <div className="ml-auto flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleAddTableAt(pos);
                          }}
                          className="p-1 hover:bg-blue-100 rounded text-blue-600 cursor-pointer"
                          title="Add table below"
                          type="button"
                        >
                          <Plus size={14} />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDuplicate(originalIndex, pos);
                          }}
                          className="p-1 hover:bg-blue-100 rounded text-blue-600 cursor-pointer"
                          title="Duplicate table"
                          type="button"
                        >
                          <Copy size={14} />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(originalIndex, pos);
                          }}
                          className="p-1 hover:bg-red-100 rounded text-red-600 cursor-pointer"
                          title="Delete table"
                          type="button"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>

                    <ModuleEditor
                      key={originalIndex}
                      embedded
                      editableStructure
                      showLivePreview={false}
                      storageKey={`project-${projectId}:annexure-${templateStorageVersion}-${originalIndex}`}
                      title={item.title}
                      description={item.description}
                      columns={col(item.columns)}
                      sampleRows={
                        annexure === "1" && originalIndex === 0
                          ? [
                              {
                                river_name_m_sand_plant: "Sutlej River",
                                total_stretch_of_river_in_km: "45",
                                type_of_river_perennial_or_non_perennial:
                                  "Perennial",
                              },
                            ]
                          : annexure === "2" && originalIndex === 0
                          ? [
                              {
                                sl_no: "1",
                                river_details: "Sutlej River",
                                sand_bar_code: "SB-01",
                                lease_details: "Ludhiana Lease",
                                area_ha: "12.5",
                                latitude: "30.900965",
                                longitude: "75.857277",
                                distance_from_pa_wc_km: "10.5",
                                within_500m_cluster_area: "No",
                                bulk_density_gm_cc: "1.65",
                                depth_of_deposit_m: "3.0",
                                total_excavation_mt_yr: "618750",
                                total_excavation_net_60: "371250",
                                mineral: "Sand",
                                existing_proposed: "Proposed",
                                remarks: "Pending EC",
                              },
                            ]
                          : annexure === "3" && originalIndex === 0
                          ? [
                              {
                                river_name: "Sutlej",
                                cluster_no: "CL-01",
                                lease_no: "L-01, L-02",
                                location_riverbed_patta_land: "Riverbed",
                                village: "Phillaur",
                                area_in_ha: "25.0",
                                total_excavation_mt: "1237500",
                                total_mineral_excavation_mt_considering_60_as_per_emgsm_2020:
                                  "742500",
                              },
                            ]
                          : annexure === "4" && originalIndex === 0
                          ? [
                              {
                                sl_no: "1",
                                lease_no:
                                  "Jalandhar Sutlej -1 Vill-Kadiana, Block- Phillaur",
                                transportation_route_no: "A-A'",
                                number_of_tippers_day_of_lease: "43",
                                number_of_tippers_day_of_all_leases_on_route:
                                  "NA",
                                length_of_route_km: "0.73",
                                type_of_road: "Unpaved",
                                recommendation_for_road: "Unpaved",
                                the_road_will_be_constructed_by: "Lease Owner",
                                route_map_location: "Route Map attached",
                              },
                              {
                                sl_no: "2",
                                lease_no:
                                  "Jalandhar Sutlej -2 Vill-Kadiana, Block- Phillaur",
                                transportation_route_no: "B-B'",
                                number_of_tippers_day_of_lease: "315",
                                number_of_tippers_day_of_all_leases_on_route:
                                  "NA",
                                length_of_route_km: "0.48",
                                type_of_road: "Unpaved",
                                recommendation_for_road: "Unpaved",
                                the_road_will_be_constructed_by: "Lease Owner",
                                route_map_location: "Route Map attached",
                              },
                              {
                                sl_no: "3",
                                lease_no:
                                  "Jalandhar Sutlej -3 Vill-Chauhla, Block- Phillaur",
                                transportation_route_no: "C-C'",
                                number_of_tippers_day_of_lease: "127",
                                number_of_tippers_day_of_all_leases_on_route:
                                  "NA",
                                length_of_route_km: "2.1",
                                type_of_road: "Unpaved",
                                recommendation_for_road: "Unpaved",
                                the_road_will_be_constructed_by: "Lease Owner",
                                route_map_location: "Route Map attached",
                              },
                            ]
                          : annexure === "4" && originalIndex === 1
                          ? [
                              {
                                cluster_no:
                                  "Cluster Jalandhar Sutlej -1,2 Vill-Kadiana, Block- Phillaur",
                                transportation_route_no: "A-A', B-B'",
                                number_of_tippers_day_of_cluster: "358",
                                number_of_tippers_day_of_all_clusters_on_route:
                                  "NA",
                                length_of_route_in_km: "0.73",
                                type_of_road: "Unpaved",
                                recommendation_for_road: "Unpaved",
                                the_road_will_be_constructed_by: "Lease Owner",
                                route_map_location: "Route Map attached",
                              },
                              {
                                cluster_no:
                                  "Cluster Jalandhar Beas -3,4 Vill-Chauhla, Block- Phillaur",
                                transportation_route_no: "C-C' TO F-F'",
                                number_of_tippers_day_of_cluster: "343",
                                number_of_tippers_day_of_all_clusters_on_route:
                                  "NA",
                                length_of_route_in_km: "2.1",
                                type_of_road: "Unpaved",
                                recommendation_for_road: "Unpaved",
                                the_road_will_be_constructed_by: "Lease Owner",
                                route_map_location: "Route Map attached",
                              },
                            ]
                          : []
                      }
                      onSnapshotChange={(snapshot) =>
                        update(originalIndex, snapshot)
                      }
                    />
                  </div>
                );
              })}
            </div>
          }
          rightPanel={
            <aside className="h-full rounded-2xl border bg-slate-200 p-4 shadow-sm block">
              <p className="mb-3 text-xs font-bold uppercase tracking-wider text-slate-600">
                Complete Annexure Live Preview
              </p>
              <div className="min-h-[900px] bg-white p-8 shadow">
                <div className="border-b-2 border-slate-900 pb-5 text-center">
                  <p className="text-xs font-bold uppercase tracking-[.2em]">
                    Government of Punjab
                  </p>
                  <h1 className="mt-3 text-xl font-bold uppercase">
                    {resolvedAnnexureTitle}
                  </h1>
                  <p className="mt-1 text-xs text-slate-500">
                    {annexureDescription.trim() || data.description}
                  </p>
                  <div className="mt-3 inline-flex items-center gap-1 rounded border border-emerald-600 bg-emerald-50 px-2 py-1 text-[9px] font-bold uppercase tracking-wide text-emerald-700">
                    <CheckCircle2 size={11} /> Format Validated - Green Flag
                  </div>
                </div>

                {/* Preview respects drag-drop order */}
                {order.map((originalIndex, pos) => {
                  const fallback = data.items[originalIndex];
                  const snap = snapshots[originalIndex];
                  const previewColumns =
                    snap?.columns ?? col(fallback?.columns ?? []);
                  return (
                    <section key={originalIndex} className="mt-7">
                      <h2 className="border-b pb-2 text-sm font-bold">
                        <span className="mr-2 text-slate-400 font-mono text-xs">
                          {pos + 1}.
                        </span>
                        {snap?.title ??
                          fallback?.title ??
                          `New Table ${originalIndex + 1}`}
                      </h2>
                      <PreviewSection
                        columns={previewColumns}
                        rows={snap?.rows ?? []}
                      />
                    </section>
                  );
                })}
              </div>
            </aside>
          }
        />
      </div>
    </>
  );
}

function PreviewSection({
  columns,
  rows,
}: {
  columns: EditorColumn[];
  rows: Record<string, string>[];
}) {
  return (
    <div className="mt-3 overflow-x-auto">
      <table className="w-full border-collapse text-[8px]">
        <thead>
          <tr>
            {columns.map((column) => (
              <th
                key={column.key}
                className="border border-slate-400 bg-slate-100 p-1 text-left align-top"
              >
                {column.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.length ? (
            rows.map((row, i) => (
              <tr key={i}>
                {columns.map((column) => (
                  <td
                    key={column.key}
                    className="border border-slate-300 p-1"
                  >
                    {row[column.key] || "—"}
                  </td>
                ))}
              </tr>
            ))
          ) : (
            <tr>
              <td
                colSpan={columns.length}
                className="border p-3 text-center text-slate-400"
              >
                No entries
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
