import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell,
  TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader,
  DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem,
  SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu, DropdownMenuContent,
  DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Search, Plus, MoreHorizontal,
  ChevronLeft, ChevronRight, ShieldCheck,
} from "lucide-react";
import {
  getRequirements,
  createRequirement,
  deleteRequirement,
} from "../../services/requirementsService.js";

// ── Colour helpers ──────────────────────────────────────────
const priorityColor = (p) => {
  switch (p) {
    case "Critical": return "bg-red-100 text-red-800";
    case "High":     return "bg-orange-100 text-orange-800";
    case "Medium":   return "bg-yellow-100 text-yellow-800";
    case "Low":      return "bg-green-100 text-green-800";
    default:         return "bg-gray-100 text-gray-800";
  }
};

const statusColor = (s) => {
  switch (s) {
    case "Approved":     return "bg-green-100 text-green-800";
    case "Implemented":  return "bg-blue-100 text-blue-800";
    case "In Progress":  return "bg-amber-100 text-amber-800";
    case "Draft":        return "bg-gray-100 text-gray-800";
    case "Rejected":     return "bg-red-100 text-red-800";
    default:             return "bg-gray-100 text-gray-800";
  }
};

const CATEGORIES = [
  "Authentication", "Access Control", "Encryption",
  "Data Protection", "Logging", "Network Security",
  "Physical Security", "Incident Response",
  "Compliance", "AI Security", "IoT Security",
];

const PRIORITIES = ["Critical", "High", "Medium", "Low"];
const STATUSES   = ["Draft", "Approved", "In Progress", "Implemented", "Rejected"];
const FRAMEWORKS = ["ISO 27001", "IEC 62443", "OWASP ASVS", "NIST CSF", "PCI DSS", "GDPR", "NIS2", "MDR", "HIPAA"];

// ── Empty form state ────────────────────────────────────────
const emptyForm = {
  id: "", title: "", description: "", category: "",
  priority: "", status: "Draft", owner: "",
  verification_method: "", acceptance_criteria: "",
  framework: "", control: "", linked_assets: "",
};

// ══════════════════════════════════════════════════════════════
export default function RequirementsPage() {
  const [requirements, setRequirements] = useState([]);
  const [isLoading, setIsLoading]       = useState(true);
  const [error, setError]               = useState(null);

  // filters
  const [search, setSearch]             = useState("");
  const [filterCategory, setFilterCategory] = useState("all");
  const [filterPriority, setFilterPriority] = useState("all");
  const [filterStatus, setFilterStatus]     = useState("all");

  // pagination
  const [currentPage, setCurrentPage]   = useState(1);
  const ITEMS_PER_PAGE = 10;

  // modal
  const [showModal, setShowModal]       = useState(false);
  const [form, setForm]                 = useState(emptyForm);
  const [formError, setFormError]       = useState("");
  const [saving, setSaving]             = useState(false);

  // ── Fetch ──────────────────────────────────────────────────
  const fetchData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await getRequirements();
      setRequirements(res.data || []);
    } catch (err) {
      setError("Failed to load requirements.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  // ── Filter + search ────────────────────────────────────────
  const filtered = requirements.filter((r) => {
    const matchSearch   = r.title?.toLowerCase().includes(search.toLowerCase()) ||
                          r.id?.toLowerCase().includes(search.toLowerCase());
    const matchCategory = filterCategory === "all" || r.category === filterCategory;
    const matchPriority = filterPriority === "all" || r.priority === filterPriority;
    const matchStatus   = filterStatus   === "all" || r.status   === filterStatus;
    return matchSearch && matchCategory && matchPriority && matchStatus;
  });

  // ── Pagination ─────────────────────────────────────────────
  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const paginated  = filtered.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  // ── Create ─────────────────────────────────────────────────
  const handleCreate = async () => {
    setFormError("");
    if (!form.id || !form.title || !form.description || !form.category || !form.priority) {
      setFormError("Please fill in all required fields.");
      return;
    }
    if (!/^REQ-[0-9]{4}-[0-9]{3}$/.test(form.id)) {
      setFormError("ID must follow format REQ-YYYY-NNN e.g. REQ-2026-006");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        ...form,
        acceptance_criteria: form.acceptance_criteria
          ? form.acceptance_criteria.split("\n").filter(Boolean)
          : [],
        linked_assets: form.linked_assets
          ? form.linked_assets.split(",").map(s => s.trim()).filter(Boolean)
          : [],
        compliance_mappings: form.framework && form.control
          ? [{ framework: form.framework, control: form.control }]
          : [],
      };
      delete payload.framework;
      delete payload.control;

      await createRequirement(payload);
      setShowModal(false);
      setForm(emptyForm);
      fetchData();
    } catch (err) {
      setFormError(err.response?.data?.error || err.response?.data?.errors?.join(", ") || "Failed to save.");
    } finally {
      setSaving(false);
    }
  };

  // ── Delete ─────────────────────────────────────────────────
  const handleDelete = async (id) => {
    if (!window.confirm("Delete this requirement?")) return;
    try {
      await deleteRequirement(id);
      fetchData();
    } catch {
      alert("Failed to delete requirement.");
    }
  };

  // ── Summary counts ─────────────────────────────────────────
  const counts = {
    total:       requirements.length,
    critical:    requirements.filter(r => r.priority === "Critical").length,
    implemented: requirements.filter(r => r.status  === "Implemented").length,
    inProgress:  requirements.filter(r => r.status  === "In Progress").length,
  };

  // ══════════════════════════════════════════════════════════
  return (
    <div className="min-h-screen bg-background">
      <main className="p-6">

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
              <ShieldCheck className="w-8 h-8 text-primary" />
              Security Requirements
            </h1>
            <p className="text-muted-foreground mt-1">
              Manage and track all healthcare security requirements
            </p>
          </div>
          <Button onClick={() => { setForm(emptyForm); setFormError(""); setShowModal(true); }}>
            <Plus className="w-4 h-4 mr-2" /> Add Requirement
          </Button>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {[
            { label: "Total",       value: counts.total,       color: "text-foreground" },
            { label: "Critical",    value: counts.critical,    color: "text-red-600"    },
            { label: "Implemented", value: counts.implemented, color: "text-blue-600"   },
            { label: "In Progress", value: counts.inProgress,  color: "text-amber-600"  },
          ].map(({ label, value, color }) => (
            <Card key={label} className="p-4 text-center">
              <p className={`text-3xl font-bold ${color}`}>{value}</p>
              <p className="text-sm text-muted-foreground mt-1">{label}</p>
            </Card>
          ))}
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3 mb-6">
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Search by ID or title..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
              className="pl-10"
            />
          </div>

          {[
            { value: filterCategory, setter: setFilterCategory, placeholder: "All Categories", options: CATEGORIES },
            { value: filterPriority, setter: setFilterPriority, placeholder: "All Priorities", options: PRIORITIES },
            { value: filterStatus,   setter: setFilterStatus,   placeholder: "All Statuses",   options: STATUSES   },
          ].map(({ value, setter, placeholder, options }) => (
            <Select key={placeholder} value={value}
              onValueChange={(v) => { setter(v); setCurrentPage(1); }}>
              <SelectTrigger className="w-44">
                <SelectValue placeholder={placeholder} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{placeholder}</SelectItem>
                {options.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}
              </SelectContent>
            </Select>
          ))}
        </div>

        {/* Table */}
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Title</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Owner</TableHead>
                <TableHead>Compliance</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-10">Loading requirements...</TableCell>
                </TableRow>
              ) : error ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center text-destructive py-10">{error}</TableCell>
                </TableRow>
              ) : paginated.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-10">No requirements found.</TableCell>
                </TableRow>
              ) : paginated.map((req) => (
                <TableRow key={req._id}>
                  <TableCell className="font-mono text-sm font-medium">{req.id}</TableCell>
                  <TableCell className="max-w-[220px]">
                    <p className="font-medium truncate">{req.title}</p>
                    <p className="text-xs text-muted-foreground truncate">{req.description}</p>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{req.category}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge className={priorityColor(req.priority)}>{req.priority}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge className={statusColor(req.status)}>{req.status}</Badge>
                  </TableCell>
                  <TableCell className="text-sm">{req.owner || "—"}</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {req.compliance_mappings?.slice(0, 2).map((m, i) => (
                        <Badge key={i} variant="secondary" className="text-xs">
                          {m.framework}
                        </Badge>
                      ))}
                      {req.compliance_mappings?.length > 2 && (
                        <Badge variant="secondary" className="text-xs">
                          +{req.compliance_mappings.length - 2}
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => handleDelete(req.id)}
                          className="text-destructive focus:text-destructive"
                        >
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {/* Pagination */}
          {!isLoading && !error && totalPages > 1 && (
            <div className="flex items-center justify-between p-4 border-t">
              <span className="text-sm text-muted-foreground">
                Page {currentPage} of {totalPages} ({filtered.length} total)
              </span>
              <div className="flex gap-2">
                <Button variant="outline" size="sm"
                  onClick={() => setCurrentPage(p => Math.max(p - 1, 1))}
                  disabled={currentPage === 1}>
                  <ChevronLeft className="w-4 h-4 mr-1" /> Previous
                </Button>
                <Button variant="outline" size="sm"
                  onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))}
                  disabled={currentPage === totalPages}>
                  Next <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
            </div>
          )}
        </Card>

        {/* Add Requirement Modal */}
        <Dialog open={showModal} onOpenChange={setShowModal}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Add New Security Requirement</DialogTitle>
            </DialogHeader>

            <div className="grid grid-cols-2 gap-4 py-2">
              {/* ID */}
              <div className="col-span-2 flex flex-col gap-1">
                <label className="text-sm font-medium">Requirement ID <span className="text-red-500">*</span></label>
                <Input placeholder="REQ-2026-006" value={form.id}
                  onChange={e => setForm(f => ({ ...f, id: e.target.value }))} />
                <p className="text-xs text-muted-foreground">Format: REQ-YYYY-NNN</p>
              </div>

              {/* Title */}
              <div className="col-span-2 flex flex-col gap-1">
                <label className="text-sm font-medium">Title <span className="text-red-500">*</span></label>
                <Input placeholder="e.g. Implement Multi-Factor Authentication" value={form.title}
                  onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
              </div>

              {/* Description */}
              <div className="col-span-2 flex flex-col gap-1">
                <label className="text-sm font-medium">Description <span className="text-red-500">*</span></label>
                <textarea rows={3} placeholder="Describe the requirement in detail..."
                  value={form.description}
                  onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" />
              </div>

              {/* Category */}
              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium">Category <span className="text-red-500">*</span></label>
                <Select value={form.category} onValueChange={v => setForm(f => ({ ...f, category: v }))}>
                  <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              {/* Priority */}
              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium">Priority <span className="text-red-500">*</span></label>
                <Select value={form.priority} onValueChange={v => setForm(f => ({ ...f, priority: v }))}>
                  <SelectTrigger><SelectValue placeholder="Select priority" /></SelectTrigger>
                  <SelectContent>
                    {PRIORITIES.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              {/* Status */}
              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium">Status</label>
                <Select value={form.status} onValueChange={v => setForm(f => ({ ...f, status: v }))}>
                  <SelectTrigger><SelectValue placeholder="Select status" /></SelectTrigger>
                  <SelectContent>
                    {STATUSES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              {/* Owner */}
              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium">Owner</label>
                <Input placeholder="e.g. Security Officer" value={form.owner}
                  onChange={e => setForm(f => ({ ...f, owner: e.target.value }))} />
              </div>

              {/* Framework */}
              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium">Compliance Framework</label>
                <Select value={form.framework} onValueChange={v => setForm(f => ({ ...f, framework: v }))}>
                  <SelectTrigger><SelectValue placeholder="Select framework" /></SelectTrigger>
                  <SelectContent>
                    {FRAMEWORKS.map(fw => <SelectItem key={fw} value={fw}>{fw}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              {/* Control */}
              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium">Control Reference</label>
                <Input placeholder="e.g. A.9.2.4" value={form.control}
                  onChange={e => setForm(f => ({ ...f, control: e.target.value }))} />
              </div>

              {/* Linked Assets */}
              <div className="col-span-2 flex flex-col gap-1">
                <label className="text-sm font-medium">Linked Assets</label>
                <Input placeholder="e.g. CA-004, CA-010, CA-013 (comma separated)" value={form.linked_assets}
                  onChange={e => setForm(f => ({ ...f, linked_assets: e.target.value }))} />
              </div>

              {/* Verification Method */}
              <div className="col-span-2 flex flex-col gap-1">
                <label className="text-sm font-medium">Verification Method</label>
                <Input placeholder="e.g. Manual testing and penetration test" value={form.verification_method}
                  onChange={e => setForm(f => ({ ...f, verification_method: e.target.value }))} />
              </div>

              {/* Acceptance Criteria */}
              <div className="col-span-2 flex flex-col gap-1">
                <label className="text-sm font-medium">Acceptance Criteria</label>
                <textarea rows={3} placeholder="Enter each criterion on a new line..."
                  value={form.acceptance_criteria}
                  onChange={e => setForm(f => ({ ...f, acceptance_criteria: e.target.value }))}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" />
              </div>
            </div>

            {formError && (
              <p className="text-sm text-destructive bg-destructive/10 rounded p-2">{formError}</p>
            )}

            <DialogFooter>
              <Button variant="outline" onClick={() => setShowModal(false)}>Cancel</Button>
              <Button onClick={handleCreate} disabled={saving}>
                {saving ? "Saving..." : "Save Requirement"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

      </main>
    </div>
  );
}