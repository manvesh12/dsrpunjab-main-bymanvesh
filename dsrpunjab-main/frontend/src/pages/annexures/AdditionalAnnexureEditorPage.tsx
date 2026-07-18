import PageHeader from "../../components/layout/PageHeader";
import ResizableLayout from "../../components/layout/ResizableLayout";
import ModuleEditor from "../../components/ui/ModuleEditor";
import type { EditorColumn } from "../../components/ui/ModuleEditor";
import { useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { Download, FileSpreadsheet, GripVertical, Trash2 } from "lucide-react";
import {
  exportAnnexureExcel,
  exportAnnexurePdf,
} from "../../utils/annexureExport";
import { useLocalDraft } from "../../hooks/useLocalDraft";
import { uploadErrorMessage, uploadsApi } from "../../api/uploads.api";
import { toast } from "sonner";

type AnnexureUpload = { name: string; url: string };

const key = (label: string) =>
  label
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_|_$/g, "");
const hasUploadSection = ["B", "C", "D", "E", "G", "H", "I", "J", "K"];
const definitions: Record<string, { title: string; columns: string[] }[]> = {
  F: [
    {
      title: "a) Final Block Sand Ghats Coordinates",
      columns: [
        "Sl. No.",
        "River Details",
        "Sand Bar Code",
        "Lease Details",
        "Area (Ha.)",
        "Latitude",
        "Longitude",
      ],
    },
    {
      title: "b) Permanent Bench Marks",
      columns: [
        "Sl. No.",
        "Permanent Bench Mark",
        "Coordinates",
        "Elevation",
        "Sandbars Code",
      ],
    },
    {
      title: "c) Survey of India CORS Stations",
      columns: [
        "Sl. No.",
        "CORS Station Name",
        "Lat",
        "Lon",
        "Height",
        "Station Code",
      ],
    },
  ],
  J: [
    {
      title: "Projected Demand of Gravel (in MT) District Wise",
      columns: [
        "Sr. No.",
        "District Name",
        "2022-23",
        "2023-24",
        "2024-25",
        "2025-26",
        "2026-27",
        "2027-28",
      ],
    },
  ],
  K: [
    {
      title: "Proforma for Auctioned Sites",
      columns: [
        "Sr No.",
        "Site Name",
        "Type of Mine",
        "Date of Grant of EC",
        "Date of Start of Contract",
        "Quantity Allowed per annum",
        "Quantity Extracted",
        "Balance Quantity",
        "EC Status",
        "Reason For Not Operating Site",
        "Reason for not Applying EC",
        "Remarks",
      ],
    },
    {
      title: "Annexure A - Source-wise Summary",
      columns: [
        "Source",
        "No. of proposed sites",
        "Area (Ha)",
        "Total excavation in Tonnes",
        "Total excavation in Tonnes (Considering 60% as per EMGSM, 2020)",
      ],
    },
  ],
};

export default function AdditionalAnnexureEditorPage({
  letter,
}: {
  letter: string;
}) {
  const { projectId = "default" } = useParams();
  const items = definitions[letter] ?? [];

  const [snapshots, setSnapshots] = useState<
    Record<
      number,
      { title: string; columns: EditorColumn[]; rows: Record<string, string>[]; attachments?: string[] }
    >
  >({});
  const [uploadedFiles, setUploadedFiles] = useLocalDraft<AnnexureUpload[]>(
    `project-${projectId}:annexure-${letter.toLowerCase()}:uploads`,
    [],
  );

  /* ── Drag-and-drop order ── */
  const [order, setOrder] = useState<number[]>(() =>
    Array.from({ length: items.length }, (_, i) => i),
  );
  const dragIndexRef = useRef<number | null>(null); // position in order array
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
        title={`Annexure ${letter}`}
        description={
          hasUploadSection.includes(letter)
            ? `Upload and manage Annexure ${letter} PDFs, images, and data`
            : "Original additional-annexure formats"
        }
        action={
          <div className="flex gap-2">
            <button
              className="module-btn"
              onClick={() =>
                exportAnnexureExcel(
                  `Annexure ${letter}`,
                  Object.values(snapshots),
                )
              }
            >
              <FileSpreadsheet size={17} />
              Excel
            </button>
            <button
              className="module-btn"
              onClick={() =>
                exportAnnexurePdf(
                  `Annexure ${letter}`,
                  Object.values(snapshots),
                  uploadedFiles,
                )
              }
            >
              <Download size={17} />
              PDF
            </button>
          </div>
        }
      />
      <div className="h-[calc(100vh-14rem)] flex">
        <ResizableLayout
          leftPanelDefaultSize={60}
          rightPanelDefaultSize={40}
          leftPanel={
            <div className="min-w-0 pb-12">
              {hasUploadSection.includes(letter) && (
                <UploadPanel letter={letter} projectId={projectId} files={uploadedFiles} onChange={setUploadedFiles} />
              )}{" "}
              {items.length > 0 &&
                order.map((originalIndex, pos) => {
                  const item = items[originalIndex];
                  if (!item) return null;
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
                      className={`relative transition-all ${
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
                        <span className="ml-auto text-[10px] text-slate-400 font-mono shrink-0">
                          #{pos + 1}
                        </span>
                      </div>

                      <ModuleEditor
                        key={originalIndex}
                        embedded
                        editableStructure
                        showLivePreview={false}
                        storageKey={`project-${projectId}:annexure-${letter.toLowerCase()}-${originalIndex}`}
                        title={item.title}
                        description="Original IIT DSR table format"
                        columns={item.columns.map((label) => ({
                          key: key(label),
                          label,
                        }))}
                        sampleRows={
                          letter === "K" && originalIndex === 1
                            ? [
                                {
                                  source: "River Bed Sand",
                                  no_of_proposed_sites: "12",
                                  area_ha: "48.60",
                                  total_excavation_in_tonnes: "325000",
                                  total_excavation_in_tonnes_considering_60_as_per_emgsm_2020:
                                    "195000",
                                },
                              ]
                            : letter === "F" && originalIndex === 0
                            ? [
                                {
                                  sl_no: "1",
                                  river_details: "Sutlej River",
                                  sand_bar_code: "SB-01",
                                  lease_details: "Ludhiana Lease",
                                  area_ha_: "12.5",
                                  latitude: "30.900965",
                                  longitude: "75.857277",
                                },
                              ]
                            : []
                        }
                        onSnapshotChange={(snapshot) =>
                          setSnapshots((current) =>
                            JSON.stringify(current[originalIndex]) ===
                            JSON.stringify(snapshot)
                              ? current
                              : { ...current, [originalIndex]: snapshot },
                          )
                        }
                      />
                    </div>
                  );
                })}
            </div>
          }
          rightPanel={
            <aside className="h-full rounded-2xl border bg-slate-200 p-4 block">
              <p className="mb-3 text-xs font-bold uppercase text-slate-600">
                Annexure {letter} Live Preview
              </p>
              <div className="min-h-[800px] bg-white p-8 shadow">
                <p className="text-center text-xs font-bold uppercase tracking-[.2em]">
                  Government of Punjab
                </p>
                <h1 className="mt-3 border-b-2 pb-5 text-center text-xl font-bold uppercase">
                  Annexure {letter}
                </h1>

                {/* Preview respects drag-drop order */}
                {items.length ? (
                  order.map((originalIndex, pos) => {
                    const item = items[originalIndex];
                    if (!item) return null;
                    const snap = snapshots[originalIndex];
                    const columns =
                      snap?.columns ??
                      item.columns.map((label) => ({ key: key(label), label }));
                    return (
                      <section className="mt-7" key={originalIndex}>
                        <h2 className="mb-3 text-sm font-bold">
                          <span className="mr-1 text-slate-400 font-mono text-xs">
                            {pos + 1}.
                          </span>
                          {snap?.title ?? item.title}
                        </h2>
                        <table className="w-full border-collapse text-[8px]">
                          <thead>
                            <tr>
                              {columns.map((column) => (
                                <th
                                  key={column.key}
                                  className="border bg-slate-100 p-1 text-left"
                                >
                                  {column.label}
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {snap?.rows.length ? (
                              snap.rows.map((row, rowIndex) => (
                                <tr key={rowIndex}>
                                  {columns.map((column) => (
                                    <td key={column.key} className="border p-1">
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
                      </section>
                    );
                  })
                ) : (
                  <p className="mt-12 text-center text-sm text-slate-500">
                    Annexure {letter} is an upload-only annexure.
                    <br />
                    (No table preview available)
                  </p>
                )}
              </div>
            </aside>
          }
        />
      </div>
    </>
  );
}

function UploadPanel({ letter, projectId, files, onChange }: { letter: string; projectId: string; files: AnnexureUpload[]; onChange: (files: AnnexureUpload[]) => void }) {
  const [uploading, setUploading] = useState(false);
  const uploadFiles = async (selected: FileList | null) => {
    if (!selected?.length) return;
    setUploading(true);
    try {
      const uploaded: AnnexureUpload[] = [];
      for (const file of Array.from(selected)) {
        const result = await uploadsApi.upload(file, projectId, `annexure-${letter.toLowerCase()}`);
        uploaded.push({ name: file.name, url: result.url });
      }
      onChange([...files, ...uploaded]);
      toast.success(`${uploaded.length} file(s) uploaded`);
    } catch (error) {
      toast.error(uploadErrorMessage(error));
    } finally {
      setUploading(false);
    }
  };

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="font-bold">Annexure {letter} Entries</h2>
      <p className="mt-1 text-sm text-slate-500">
        Uploaded PDF pages or images will be appended to the final annexure.
      </p>
      <label className="mt-5 flex min-h-48 cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 text-center hover:border-blue-400 hover:bg-blue-50">
        <span className="font-semibold text-slate-700">
          {uploading ? "Uploading..." : "Select PDF or images"}
        </span>
        <span className="mt-1 text-sm text-slate-500">
          PDF, PNG or JPG • multiple files supported
        </span>
        <input
          type="file"
          accept="application/pdf,image/*"
          multiple
          className="hidden"
          disabled={uploading}
          onChange={(event) => uploadFiles(event.target.files)}
        />
      </label>
      {files.length > 0 && (
        <div className="mt-4 space-y-2">
          {files.map((file, index) => (
            <div key={`${file.url}-${index}`} className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 px-3 py-2 text-sm">
              <span className="truncate font-medium text-slate-700">{file.name}</span>
              <button type="button" className="rounded p-1.5 text-red-600 hover:bg-red-50" onClick={() => onChange(files.filter((_, itemIndex) => itemIndex !== index))} title="Remove file">
                <Trash2 size={16} />
              </button>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
