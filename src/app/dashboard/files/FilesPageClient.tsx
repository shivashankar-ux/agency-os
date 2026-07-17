"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { motion, AnimatePresence } from "framer-motion";
import {
  FolderOpen, Search, Upload, Plus, X, FileText, Image as ImageIcon,
  FileCode, FileArchive, File, Trash2, Download, Copy, ExternalLink,
  ChevronDown, ArrowUpRight
} from "lucide-react";

// ── Types ──────────────────────────────────────────────────────
type SharedFile = {
  id: string;
  name: string;
  file_path: string;
  file_url: string;
  file_size: number;
  mime_type: string | null;
  version: number;
  created_at: string;
  client_id: string | null;
  project_id: string | null;
  created_by: string | null;
  uploader?: { name: string } | null;
  client?: { name: string } | null;
  project?: { name: string } | null;
};

type Client = { id: string; name: string };
type Project = { id: string; name: string; client_id: string };

function fmtBytes(bytes: number) {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}

function getFileIcon(mime: string | null) {
  if (!mime) return File;
  if (mime.includes("pdf")) return FileText;
  if (mime.includes("image")) return ImageIcon;
  if (mime.includes("zip") || mime.includes("rar") || mime.includes("tar")) return FileArchive;
  if (mime.includes("javascript") || mime.includes("typescript") || mime.includes("json") || mime.includes("html") || mime.includes("css")) return FileCode;
  return File;
}

export default function FilesPageClient({
  initialFiles,
  allClients,
  allProjects,
  permissions,
  orgId,
}: {
  initialFiles: SharedFile[];
  allClients: Client[];
  allProjects: Project[];
  permissions: any;
  orgId: string;
}) {
  const supabase = createClient();
  const [files, setFiles] = useState<SharedFile[]>(initialFiles);
  const [search, setSearch] = useState("");
  const [filterClient, setFilterClient] = useState("all");
  const [isUploadOpen, setIsUploadOpen] = useState(false);

  // Form upload states
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [clientId, setClientId] = useState("");
  const [projectId, setProjectId] = useState("");
  const [uploading, setUploading] = useState(false);

  const canUpload = permissions?.files?.upload?.allowed ?? false;
  const canDelete = permissions?.files?.delete?.allowed ?? false;

  // Filter projects by client
  const projectsForClient = allProjects.filter((p) => !clientId || p.client_id === clientId);

  // Search and filter files
  const filteredFiles = files.filter((f) => {
    const matchesSearch = f.name.toLowerCase().includes(search.toLowerCase());
    const matchesClient = filterClient === "all" || f.client_id === filterClient;
    return matchesSearch && matchesClient;
  });

  const totalSize = files.reduce((s, f) => s + Number(f.file_size), 0);

  // ── Upload Handler ───────────────────────────────────────────
  async function handleUpload(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedFile) return;

    setUploading(true);
    try {
      // 1. Upload file object to Supabase storage bucket
      const bucketName = "agency-files";
      const cleanedName = selectedFile.name.replace(/[^a-zA-Z0-9.]/g, "_");
      const filePath = `${orgId}/${projectId || "general"}/${Date.now()}_${cleanedName}`;

      const { error: storageError } = await supabase.storage
        .from(bucketName)
        .upload(filePath, selectedFile, { cacheControl: "3600", upsert: true });

      if (storageError) throw storageError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from(bucketName)
        .getPublicUrl(filePath);

      // 2. Insert record into files table
      const { data: dbFile, error: dbError } = await supabase
        .from("files")
        .insert({
          org_id: orgId,
          client_id: clientId || null,
          project_id: projectId || null,
          name: selectedFile.name,
          file_path: filePath,
          file_url: publicUrl,
          file_size: selectedFile.size,
          mime_type: selectedFile.type || null,
        })
        .select(`
          *,
          uploader:profiles!files_created_by_fkey(name),
          client:clients!files_client_id_fkey(name),
          project:projects!files_project_id_fkey(name)
        `)
        .single();

      if (dbError) throw dbError;

      setFiles((prev) => [dbFile as any, ...prev]);
      setIsUploadOpen(false);
      setSelectedFile(null);
      setClientId("");
      setProjectId("");
    } catch (err: any) {
      alert(err.message || "Failed to upload file");
    } finally {
      setUploading(false);
    }
  }

  // ── Delete Handler ───────────────────────────────────────────
  async function handleDeleteFile(id: string, path: string) {
    if (!confirm("Are you sure you want to delete this file?")) return;

    try {
      // 1. Delete from storage bucket
      await supabase.storage.from("agency-files").remove([path]);

      // 2. Delete from database
      const { error } = await supabase.from("files").delete().eq("id", id);
      if (error) throw error;

      setFiles((prev) => prev.filter((f) => f.id !== id));
    } catch (err: any) {
      alert(err.message || "Failed to delete file");
    }
  }

  function handleCopyLink(url: string) {
    navigator.clipboard.writeText(url);
    alert("Public download link copied to clipboard!");
  }

  return (
    <div className="min-h-screen bg-neutral-950 p-6 md:p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <FolderOpen size={20} className="text-indigo-400" />
            File Vault
          </h1>
          <p className="text-neutral-500 text-xs mt-0.5">
            Centralized assets repository ({fmtBytes(totalSize)} total storage used)
          </p>
        </div>

        <div className="flex items-center gap-3">
          {canUpload && (
            <button
              onClick={() => setIsUploadOpen(true)}
              className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-500 text-white-literal px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-lg shadow-indigo-900/30"
            >
              <Upload size={14} /> Upload File
            </button>
          )}
        </div>
      </div>

      {/* Filters bar */}
      <div className="flex flex-col sm:flex-row items-center gap-3 bg-neutral-900 border border-neutral-800 rounded-2xl p-4">
        <div className="relative w-full sm:flex-1">
          <Search size={14} className="absolute left-3.5 top-3.5 text-neutral-500" />
          <input
            type="text"
            placeholder="Search files by name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-neutral-950 border border-neutral-800 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-neutral-700"
          />
        </div>
        <div className="w-full sm:w-48">
          <select
            value={filterClient}
            onChange={(e) => setFilterClient(e.target.value)}
            className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
          >
            <option value="all">All Clients</option>
            {allClients.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Grid of Files */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filteredFiles.map((file) => {
          const Icon = getFileIcon(file.mime_type);
          return (
            <motion.div
              layout
              key={file.id}
              className="bg-neutral-900 border border-neutral-800 rounded-2xl p-4 flex flex-col justify-between hover:border-neutral-700 transition-all group"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between">
                  <div className="p-3 bg-neutral-950 rounded-xl border border-neutral-850 group-hover:border-indigo-900 transition-colors">
                    <Icon size={22} className="text-indigo-400" />
                  </div>
                  <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => handleCopyLink(file.file_url)}
                      title="Copy Public Link"
                      className="p-1.5 text-neutral-500 hover:text-white hover:bg-neutral-950 rounded-lg transition-all"
                    >
                      <Copy size={13} />
                    </button>
                    {canDelete && (
                      <button
                        onClick={() => handleDeleteFile(file.id, file.file_path)}
                        title="Delete File"
                        className="p-1.5 text-neutral-500 hover:text-red-400 hover:bg-neutral-950 rounded-lg transition-all"
                      >
                        <Trash2 size={13} />
                      </button>
                    )}
                  </div>
                </div>

                <div>
                  <h3 className="text-white text-xs font-bold truncate" title={file.name}>
                    {file.name}
                  </h3>
                  <p className="text-neutral-500 text-xxs mt-0.5">{fmtBytes(file.file_size)}</p>
                </div>

                {/* Scope Tags */}
                <div className="space-y-1">
                  {file.client && (
                    <div className="flex items-center gap-1 text-xxs text-neutral-400">
                      <span className="text-neutral-600">Client:</span>
                      <span className="font-semibold truncate max-w-32">{file.client.name}</span>
                    </div>
                  )}
                  {file.project && (
                    <div className="flex items-center gap-1 text-xxs text-neutral-400">
                      <span className="text-neutral-600">Project:</span>
                      <span className="font-semibold truncate max-w-32">{file.project.name}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="border-t border-neutral-850/50 mt-4 pt-3 flex items-center justify-between text-xxs text-neutral-500">
                <span>{new Date(file.created_at).toLocaleDateString("en-IN")}</span>
                <a
                  href={file.file_url}
                  download={file.name}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-indigo-400 hover:text-indigo-300 font-bold"
                >
                  Download <ArrowUpRight size={11} />
                </a>
              </div>
            </motion.div>
          );
        })}
        {filteredFiles.length === 0 && (
          <div className="col-span-full py-16 text-center border border-dashed border-neutral-800 rounded-3xl">
            <FolderOpen size={32} className="text-neutral-700 mx-auto mb-3" />
            <p className="text-neutral-500 text-xs italic">No files match search or filters.</p>
          </div>
        )}
      </div>

      {/* Upload Dialog */}
      <AnimatePresence>
        {isUploadOpen && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-neutral-900 border border-neutral-800 rounded-2xl w-full max-w-md p-6 shadow-2xl"
            >
              <div className="flex items-center justify-between border-b border-neutral-850 pb-4 mb-4">
                <h3 className="text-white font-bold text-sm uppercase tracking-wider">Upload New Asset</h3>
                <button
                  onClick={() => { setIsUploadOpen(false); setSelectedFile(null); }}
                  className="text-neutral-500 hover:text-white transition-colors"
                >
                  <X size={16} />
                </button>
              </div>

              <form onSubmit={handleUpload} className="space-y-4 text-xs">
                {/* File Dropzone */}
                <div className="border-2 border-dashed border-neutral-800 hover:border-neutral-700 bg-neutral-950 p-6 rounded-2xl text-center cursor-pointer transition-colors relative">
                  <input
                    type="file"
                    required
                    onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  <Upload size={22} className="text-neutral-600 mx-auto mb-2" />
                  {selectedFile ? (
                    <div>
                      <p className="text-white font-semibold">{selectedFile.name}</p>
                      <p className="text-neutral-500 text-xxs mt-0.5">{fmtBytes(selectedFile.size)}</p>
                    </div>
                  ) : (
                    <div>
                      <p className="text-neutral-400 font-medium">Click or drag file here to upload</p>
                      <p className="text-neutral-600 text-xxs mt-0.5">Maximum size: 50MB</p>
                    </div>
                  )}
                </div>

                {/* Metadata associations */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-neutral-400 font-semibold">Client Association</label>
                    <select
                      value={clientId}
                      onChange={(e) => { setClientId(e.target.value); setProjectId(""); }}
                      className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-2.5 text-white focus:outline-none"
                    >
                      <option value="">None (Org General)</option>
                      {allClients.map((c) => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-neutral-400 font-semibold">Project Association</label>
                    <select
                      value={projectId}
                      onChange={(e) => setProjectId(e.target.value)}
                      className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-2.5 text-white focus:outline-none"
                    >
                      <option value="">None</option>
                      {projectsForClient.map((p) => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="flex gap-2.5 pt-3 border-t border-neutral-850">
                  <button
                    type="button"
                    onClick={() => { setIsUploadOpen(false); setSelectedFile(null); }}
                    className="flex-1 bg-neutral-950 border border-neutral-800 text-neutral-400 hover:text-white rounded-xl py-2.5 font-semibold transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={uploading || !selectedFile}
                    className="flex-1 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-800 text-white-literal rounded-xl py-2.5 font-semibold transition-all"
                  >
                    {uploading ? "Uploading..." : "Confirm Upload"}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
