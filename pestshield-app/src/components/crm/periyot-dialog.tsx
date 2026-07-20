"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import {
  ArrowUpDown,
  Camera,
  ChevronFirst,
  ChevronLast,
  ChevronLeft,
  ChevronRight,
  Clock,
  Copy,
  FileBarChart,
  FileImage,
  FileText as FileTextIcon,
  Flag,
  FolderOpen,
  Mail,
  Paperclip,
  Pencil,
  Plus,
  Search,
  Trash2,
  Upload,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { EmptyState } from "@/components/crm/detail/empty-state";
import { BelgeTanimlamaDialog } from "@/components/crm/belge-tanimlama-dialog";
import { IstasyonlarDialog } from "@/components/crm/istasyonlar-dialog";
import { Ek1Dialog, Section, Field, FieldArea, buildDefaultEk1Form, summarizeBiocidalUsages, type Ek1CustomerInfo } from "@/components/crm/ek1-dialog";
import { TechnicianMultiSelect } from "@/components/crm/technician-multiselect";
import { MALZEME_TYPES, summarizeMalzemeler } from "@/components/crm/ek1-constants";
import { formatDateLong } from "@/components/crm/crm-format";
import { DONEM_LABELS } from "@/lib/periyot/generate";
import { loadTemplates, saveTemplate, deleteTemplate, type PeriyotTemplate } from "@/lib/periyot-template-store";
import { getServiceDocumentsFor, addServiceDocument, deleteServiceDocument, readDocumentFile } from "@/lib/service-document-store";
import type { PeriyotCapaNote } from "@/lib/periyot-capa-store";
import { Textarea } from "@/components/ui/textarea";
import type { BiocidalProductUsage, Ek1Form, MalzemeKullanimi, PeriyotBatch, PeriyotDonem, PeriyotOccurrence, ServiceDocument } from "@/lib/mock/crm";
import type { Product } from "@/lib/mock/inventory";
import { cn } from "@/lib/utils";

function toLocalIso(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

const MESKEN_ISYERI_OPTIONS = ["İşyeri", "Mesken", "Diğer"];
const ALAN_BIRIMLERI = ["m2", "m3", "ha"];
const MIKTAR_BIRIMLERI = ["gr", "kg", "ml", "litre", "adet"];

function normalizeMalzemeler(existing: MalzemeKullanimi[] | undefined): MalzemeKullanimi[] {
  return MALZEME_TYPES.map((t) => existing?.find((m) => m.key === t.key) ?? { key: t.key, adet: "0", kullanildi: false });
}

function comingSoon(feature: string) {
  toast.info(`${feature} — yakında`);
}

const PAGE_SIZE_OPTIONS = [10, 25, 50, 100];
type SortKey = "personnelName" | "periodDate" | "time";

const DAY_OPTIONS = Array.from({ length: 31 }, (_, i) => i + 1);

function todayIso() {
  return toLocalIso(new Date());
}
function oneYearFromToday() {
  const d = new Date();
  d.setFullYear(d.getFullYear() + 1);
  return toLocalIso(d);
}

/** "10:00" -> "11:00" (bir saat sonrası, 24 saati aşarsa sarmalar). */
function addOneHour(time: string): string {
  if (!time) return "";
  const [h, m] = time.split(":").map(Number);
  const nextHour = (h + 1) % 24;
  return `${String(nextHour).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

interface PeriyotDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  serviceOrderId: string | null;
  namePrefix: string;
  customerName: string;
  customerId: string | null;
}

export function PeriyotDialog({ open, onOpenChange, serviceOrderId, namePrefix, customerName, customerId }: PeriyotDialogProps) {
  const [tab, setTab] = useState("listele");
  const [batches, setBatches] = useState<PeriyotBatch[]>([]);
  const [selectedBatchId, setSelectedBatchId] = useState<string | null>(null);
  const [occurrences, setOccurrences] = useState<(PeriyotOccurrence & { hasEk1Form?: boolean })[]>([]);
  const [editingOccurrence, setEditingOccurrence] = useState<PeriyotOccurrence | null>(null);
  const [editingEk1, setEditingEk1] = useState<Ek1Form | null>(null);
  const [kvkkApproved, setKvkkApproved] = useState(false);
  const [saveAsTemplate, setSaveAsTemplate] = useState(false);
  const [templateName, setTemplateName] = useState("");
  const [templates, setTemplates] = useState<PeriyotTemplate[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState("-");
  const [customer, setCustomer] = useState<Ek1CustomerInfo | null>(null);

  useEffect(() => {
    if (!open || !customerId) return;
    let cancelled = false;
    fetch(`/api/crm/customers/${customerId}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data: { customer?: Ek1CustomerInfo } | null) => {
        if (!cancelled && data?.customer) setCustomer(data.customer);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [open, customerId]);

  const [editorDocuments, setEditorDocuments] = useState<ServiceDocument[]>([]);
  const [belgeName, setBelgeName] = useState("");
  const [belgeFile, setBelgeFile] = useState<{ dataUrl: string; fileName: string; fileType: string } | null>(null);
  const [belgeDragOver, setBelgeDragOver] = useState(false);
  const belgeFileInputRef = useRef<HTMLInputElement>(null);
  const quickBelgeInputRef = useRef<HTMLInputElement>(null);

  const [capaNotes, setCapaNotes] = useState<PeriyotCapaNote[]>([]);
  const [capaDescription, setCapaDescription] = useState("");
  const [capaDocName, setCapaDocName] = useState("");
  const [capaFile, setCapaFile] = useState<{ dataUrl: string; fileName: string; fileType: string } | null>(null);
  const [capaDragOver, setCapaDragOver] = useState(false);
  const capaFileInputRef = useRef<HTMLInputElement>(null);

  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<SortKey | null>(null);
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [belgeOccurrenceId, setBelgeOccurrenceId] = useState<string | null>(null);
  const [istasyonOccurrenceId, setIstasyonOccurrenceId] = useState<string | null>(null);
  const [ek1OccurrenceId, setEk1OccurrenceId] = useState<string | null>(null);

  const [addDate, setAddDate] = useState("");
  const [addStart, setAddStart] = useState("");
  const [addEnd, setAddEnd] = useState("");
  const [addPersonnel, setAddPersonnel] = useState("");

  const [genPersonnel, setGenPersonnel] = useState("");
  const [genStartDate, setGenStartDate] = useState(todayIso());
  const [genEndDate, setGenEndDate] = useState(oneYearFromToday());
  const [genStart, setGenStart] = useState("");
  const [genEnd, setGenEnd] = useState("");
  const [genDay, setGenDay] = useState(1);
  const [genDonem, setGenDonem] = useState<PeriyotDonem | "">("");
  const [generating, setGenerating] = useState(false);

  const [technicianOptions, setTechnicianOptions] = useState<string[]>([]);
  const [biocidalProductOptions, setBiocidalProductOptions] = useState<Product[]>([]);

  async function refreshBatchesAsync(selectId?: string) {
    if (!serviceOrderId) return;
    const res = await fetch(`/api/crm/periyot/batches?serviceOrderId=${serviceOrderId}`);
    const data = await res.json();
    const list: PeriyotBatch[] = data.batches ?? [];
    setBatches(list);
    setSelectedBatchId(selectId ?? list[0]?.id ?? null);
  }

  async function refreshOccurrencesAsync() {
    if (!selectedBatchId) {
      setOccurrences([]);
      return;
    }
    const res = await fetch(`/api/crm/periyot/occurrences?batchId=${selectedBatchId}`);
    const data = await res.json();
    setOccurrences(data.occurrences ?? []);
  }

  useEffect(() => {
    if (open && serviceOrderId) {
      refreshBatchesAsync();
      setTab("listele");
      setEditingOccurrence(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, serviceOrderId]);

  useEffect(() => {
    if (!open) return;
    fetch("/api/operations/technicians")
      .then((r) => r.json())
      .then((data) => setTechnicianOptions((data.technicians ?? []).filter((t: { status: string }) => t.status === "active").map((t: { name: string }) => t.name)));
    fetch("/api/inventory/products")
      .then((r) => r.json())
      .then((data) => setBiocidalProductOptions((data.products ?? []).filter((p: Product) => p.type === "biosidal")));
  }, [open]);

  useEffect(() => {
    refreshOccurrencesAsync();
    setSearch("");
    setCurrentPage(1);
    setSelectedIds(new Set());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedBatchId]);

  const ek1FilledIds = useMemo(
    () => new Set(occurrences.filter((o) => o.hasEk1Form).map((o) => o.id)),
    [occurrences],
  );

  const filteredSorted = useMemo(() => {
    const q = search.trim().toLowerCase();
    let list = occurrences;
    if (q) {
      list = list.filter(
        (o) => o.personnelName.toLowerCase().includes(q) || formatDateLong(o.periodDate).toLowerCase().includes(q),
      );
    }
    if (sortKey) {
      list = [...list].sort((a, b) => {
        let cmp = 0;
        if (sortKey === "personnelName") cmp = a.personnelName.localeCompare(b.personnelName, "tr");
        else if (sortKey === "periodDate") cmp = a.periodDate < b.periodDate ? -1 : a.periodDate > b.periodDate ? 1 : 0;
        else cmp = (a.startTime || "").localeCompare(b.startTime || "");
        return sortDir === "asc" ? cmp : -cmp;
      });
    }
    return list;
  }, [occurrences, search, sortKey, sortDir]);

  const totalPages = Math.max(1, Math.ceil(filteredSorted.length / pageSize));
  const pageStart = (currentPage - 1) * pageSize;
  const paged = filteredSorted.slice(pageStart, pageStart + pageSize);
  const allPageSelected = paged.length > 0 && paged.every((o) => selectedIds.has(o.id));

  function toggleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  }

  function toggleSelectAllOnPage() {
    setSelectedIds((prev) => {
      if (allPageSelected) {
        const next = new Set(prev);
        paged.forEach((o) => next.delete(o.id));
        return next;
      }
      const next = new Set(prev);
      paged.forEach((o) => next.add(o.id));
      return next;
    });
  }

  function toggleSelectRow(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function handleBulkDelete() {
    await Promise.all([...selectedIds].map((id) => fetch(`/api/crm/periyot/occurrences/${id}`, { method: "DELETE" })));
    setSelectedIds(new Set());
    await refreshOccurrencesAsync();
    toast.success("Seçili periyotlar silindi");
  }

  async function handleDuplicateOccurrence(o: PeriyotOccurrence) {
    if (!customerId) return;
    const res = await fetch("/api/crm/periyot/occurrences", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        batchId: o.batchId,
        serviceOrderId: o.serviceOrderId,
        customerId,
        personnelName: o.personnelName,
        periodDate: o.periodDate,
        startTime: o.startTime,
        endTime: o.endTime,
      }),
    });
    if (!res.ok) {
      toast.error("Periyot kopyalanamadı");
      return;
    }
    await refreshOccurrencesAsync();
    toast.success("Periyot kopyalandı");
  }

  async function handleOccurrenceDocCountChange(occurrenceId: string, count: number) {
    await fetch(`/api/crm/periyot/occurrences/${occurrenceId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ documentCount: count }),
    });
    await refreshOccurrencesAsync();
  }

  async function handleAddSave() {
    if (!selectedBatchId || !serviceOrderId || !customerId) {
      toast.error("Önce OLUŞTUR sekmesinden bir periyot grubu oluşturun");
      return;
    }
    if (!addDate || !addPersonnel) {
      toast.error("Periyot tarihi ve personel seçin");
      return;
    }
    const res = await fetch("/api/crm/periyot/occurrences", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        batchId: selectedBatchId,
        serviceOrderId,
        customerId,
        personnelName: addPersonnel,
        periodDate: addDate,
        startTime: addStart,
        endTime: addEnd,
      }),
    });
    if (!res.ok) {
      toast.error("Periyot kaydedilemedi");
      return;
    }
    await refreshOccurrencesAsync();
    setAddDate("");
    setAddStart("");
    setAddEnd("");
    setAddPersonnel("");
    setTab("listele");
    toast.success("Periyot kaydedildi");
  }

  async function handleGenerate() {
    if (!serviceOrderId) return;
    if (!genPersonnel || !genDonem) {
      toast.error("Personel ve dönem seçin");
      return;
    }
    setGenerating(true);
    const res = await fetch("/api/crm/periyot/batches/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        serviceOrderId,
        namePrefix,
        personnelName: genPersonnel,
        startDate: genStartDate,
        endDate: genEndDate,
        startTime: genStart,
        endTime: genEnd,
        dayOfMonth: genDay,
        donem: genDonem,
      }),
    });
    const data = await res.json();
    setGenerating(false);
    if (!res.ok) {
      toast.error(data.message ?? "Periyot grubu oluşturulamadı");
      return;
    }
    await refreshBatchesAsync(data.batch.id);
    setTab("listele");
    toast.success(`${data.batch.name} oluşturuldu`);
  }

  async function handleDeleteOccurrence(id: string) {
    await fetch(`/api/crm/periyot/occurrences/${id}`, { method: "DELETE" });
    await refreshOccurrencesAsync();
    toast.success("Periyot silindi");
  }

  async function handleDeleteBatch() {
    if (!selectedBatchId) return;
    await fetch(`/api/crm/periyot/batches/${selectedBatchId}`, { method: "DELETE" });
    setSelectedBatchId(null);
    await refreshBatchesAsync();
    toast.success("Periyot grubu silindi");
  }

  async function openEditor(o: PeriyotOccurrence) {
    const normalizedOccurrence = { ...o, biocidalProductUsages: o.biocidalProductUsages ?? [] };
    setEditingOccurrence(normalizedOccurrence);
    setTab("duzenle");
    setTemplates(loadTemplates());
    setSelectedTemplateId("-");
    setSaveAsTemplate(false);
    setTemplateName("");
    setKvkkApproved(false);
    setEditorDocuments(getServiceDocumentsFor(o.id));
    setBelgeName("");
    setBelgeFile(null);
    setCapaDescription("");
    setCapaDocName("");
    setCapaFile(null);

    const [ek1Res, capaRes] = await Promise.all([
      fetch(`/api/crm/periyot/occurrences/${o.id}/ek1`),
      fetch(`/api/crm/periyot/occurrences/${o.id}/capa-notes`),
    ]);
    const ek1Data = ek1Res.ok ? await ek1Res.json() : null;
    const capaData = capaRes.ok ? await capaRes.json() : null;

    const base = ek1Data?.ek1Form ?? buildDefaultEk1Form(normalizedOccurrence, customer, biocidalProductOptions);
    setEditingEk1({
      ...base,
      uygulamaAlaniBirimi: base.uygulamaAlaniBirimi || "m2",
      malzemeKullanimlari: normalizeMalzemeler(base.malzemeKullanimlari),
      malzemelerEtkin: base.malzemelerEtkin ?? true,
    });
    setCapaNotes(capaData?.capaNotes ?? []);
  }

  function closeEditor() {
    setEditingOccurrence(null);
    setEditingEk1(null);
    setTab("listele");
  }

  async function readUploadedFile(selected: File | undefined, maxSizeMB: number): Promise<{ dataUrl: string; fileName: string; fileType: string } | null> {
    if (!selected) return null;
    const allowed = ["image/jpeg", "image/png", "application/pdf"];
    if (!allowed.includes(selected.type)) {
      toast.error("Lütfen JPEG, JPG, PNG veya PDF dosyası seçin");
      return null;
    }
    try {
      const dataUrl = await readDocumentFile(selected, maxSizeMB);
      return { dataUrl, fileName: selected.name, fileType: selected.type };
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Dosya yüklenemedi");
      return null;
    }
  }

  async function refreshEditorDocuments() {
    if (!editingOccurrence) return;
    const docs = getServiceDocumentsFor(editingOccurrence.id);
    setEditorDocuments(docs);
    await fetch(`/api/crm/periyot/occurrences/${editingOccurrence.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ documentCount: docs.length }),
    });
    await refreshOccurrencesAsync();
  }

  async function handleBelgeFileSelect(file: File | undefined) {
    const result = await readUploadedFile(file, 8);
    if (result) setBelgeFile(result);
  }

  function handleAddBelge() {
    if (!editingOccurrence) return;
    if (!belgeName.trim()) {
      toast.error("Belge adını girin");
      return;
    }
    if (!belgeFile) {
      toast.error("Bir belge seçin");
      return;
    }
    addServiceDocument({
      id: `doc-${Date.now()}`,
      serviceOrderId: editingOccurrence.id,
      name: belgeName.trim(),
      fileDataUrl: belgeFile.dataUrl,
      fileName: belgeFile.fileName,
      fileType: belgeFile.fileType,
      createdAt: new Date().toISOString(),
    });
    refreshEditorDocuments();
    setBelgeName("");
    setBelgeFile(null);
    if (belgeFileInputRef.current) belgeFileInputRef.current.value = "";
    toast.success("Belge kaydedildi");
  }

  function handleDeleteBelge(id: string) {
    deleteServiceDocument(id);
    refreshEditorDocuments();
    toast.success("Belge silindi");
  }

  async function handleQuickRaporGorseli(file: File | undefined) {
    if (!editingOccurrence || !file) return;
    const result = await readUploadedFile(file, 8);
    if (!result) return;
    addServiceDocument({
      id: `doc-${Date.now()}`,
      serviceOrderId: editingOccurrence.id,
      name: "Biyosidal Ürün Uygulama Rapor Görseli",
      fileDataUrl: result.dataUrl,
      fileName: result.fileName,
      fileType: result.fileType,
      createdAt: new Date().toISOString(),
    });
    refreshEditorDocuments();
    if (quickBelgeInputRef.current) quickBelgeInputRef.current.value = "";
    toast.success("Rapor görseli eklendi");
  }

  async function handleCapaFileSelect(file: File | undefined) {
    const result = await readUploadedFile(file, 8);
    if (result) setCapaFile(result);
  }

  async function handleAddCapaNote() {
    if (!editingOccurrence) return;
    if (!capaDescription.trim()) {
      toast.error("Açıklama girin");
      return;
    }
    const res = await fetch(`/api/crm/periyot/occurrences/${editingOccurrence.id}/capa-notes`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        description: capaDescription.trim(),
        documentName: capaDocName.trim(),
        documentDataUrl: capaFile?.dataUrl ?? null,
        documentFileName: capaFile?.fileName ?? null,
      }),
    });
    if (!res.ok) {
      toast.error("Rapor eklenemedi");
      return;
    }
    const data = await res.json();
    setCapaNotes((prev) => [data.capaNote, ...prev]);
    setCapaDescription("");
    setCapaDocName("");
    setCapaFile(null);
    if (capaFileInputRef.current) capaFileInputRef.current.value = "";
    toast.success("Rapor eklendi");
  }

  async function handleDeleteCapaNote(id: string) {
    if (!editingOccurrence) return;
    const res = await fetch(`/api/crm/periyot/capa-notes/${id}`, { method: "DELETE" });
    if (!res.ok) {
      toast.error("Rapor silinemedi");
      return;
    }
    setCapaNotes((prev) => prev.filter((n) => n.id !== id));
    toast.success("Rapor silindi");
  }

  async function handleEditSave() {
    if (!editingOccurrence || !editingEk1) return;
    if (!kvkkApproved) {
      toast.error("Devam etmek için KVKK Aydınlatma Metni'ni onaylayın");
      return;
    }
    const biocidalProducts = summarizeBiocidalUsages(editingOccurrence);
    const res = await fetch(`/api/crm/periyot/occurrences/${editingOccurrence.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        personnelName: editingOccurrence.personnelName,
        periodDate: editingOccurrence.periodDate,
        startTime: editingOccurrence.startTime,
        endTime: editingOccurrence.endTime,
        biocidalProducts,
        biocidalProductUsages: editingOccurrence.biocidalProductUsages,
      }),
    });
    if (!res.ok) {
      toast.error("Periyot güncellenemedi");
      return;
    }

    const kullanilanMalzemeler = summarizeMalzemeler(editingEk1.malzemeKullanimlari);
    const ek1Res = await fetch(`/api/crm/periyot/occurrences/${editingOccurrence.id}/ek1`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...editingEk1, kullanilanMalzemeler }),
    });
    if (!ek1Res.ok) {
      toast.error("EK-1 formu kaydedilemedi");
      return;
    }

    if (saveAsTemplate && templateName.trim()) {
      saveTemplate({
        id: `periyot-tpl-${Date.now()}`,
        name: templateName.trim(),
        biocidalProductUsages: editingOccurrence.biocidalProductUsages,
        urunUygulamaSekli: editingEk1.urunUygulamaSekli,
        meskenIsyeriVb: editingEk1.meskenIsyeriVb,
        uygulamaAlani: editingEk1.uygulamaAlani,
        uygulamaAlaniBirimi: editingEk1.uygulamaAlaniBirimi,
        guvenlikOnlemleri: editingEk1.guvenlikOnlemleri,
        malzemeKullanimlari: editingEk1.malzemeKullanimlari,
      });
    }

    await refreshOccurrencesAsync();
    closeEditor();
    toast.success("Periyot güncellendi");
  }

  function applyTemplate(id: string) {
    setSelectedTemplateId(id);
    if (id === "-" || !editingOccurrence || !editingEk1) return;
    const tpl = templates.find((t) => t.id === id);
    if (!tpl) return;
    setEditingOccurrence({ ...editingOccurrence, biocidalProductUsages: tpl.biocidalProductUsages });
    setEditingEk1({
      ...editingEk1,
      urunUygulamaSekli: tpl.urunUygulamaSekli,
      meskenIsyeriVb: tpl.meskenIsyeriVb,
      uygulamaAlani: tpl.uygulamaAlani,
      uygulamaAlaniBirimi: tpl.uygulamaAlaniBirimi,
      guvenlikOnlemleri: tpl.guvenlikOnlemleri,
      malzemeKullanimlari: normalizeMalzemeler(tpl.malzemeKullanimlari),
    });
    toast.success("Şablon uygulandı");
  }

  function handleDeleteTemplate() {
    if (selectedTemplateId === "-") return;
    deleteTemplate(selectedTemplateId);
    setTemplates(loadTemplates());
    setSelectedTemplateId("-");
    toast.success("Şablon silindi");
  }

  function addProductRow() {
    if (!editingOccurrence) return;
    const newRow: BiocidalProductUsage = { id: `bpu-${Date.now()}`, productId: "", productName: "", amount: "", unit: "gr" };
    setEditingOccurrence({ ...editingOccurrence, biocidalProductUsages: [...editingOccurrence.biocidalProductUsages, newRow] });
  }

  function updateProductRow(id: string, patch: Partial<BiocidalProductUsage>) {
    if (!editingOccurrence) return;
    setEditingOccurrence({
      ...editingOccurrence,
      biocidalProductUsages: editingOccurrence.biocidalProductUsages.map((u) => (u.id === id ? { ...u, ...patch } : u)),
    });
  }

  function removeProductRow(id: string) {
    if (!editingOccurrence) return;
    setEditingOccurrence({ ...editingOccurrence, biocidalProductUsages: editingOccurrence.biocidalProductUsages.filter((u) => u.id !== id) });
  }

  function selectProduct(rowId: string, productId: string) {
    const product = biocidalProductOptions.find((p) => p.id === productId);
    if (!product) return;
    updateProductRow(rowId, { productId, productName: product.name, unit: product.unit });
    if (editingEk1) {
      setEditingEk1({
        ...editingEk1,
        urunTicariAdi: editingEk1.urunTicariAdi || [product.name, product.licenseNumber].filter(Boolean).join(" — "),
        urunAktifMaddesi: editingEk1.urunAktifMaddesi || product.activeIngredient || "",
        urunAntidotu: editingEk1.urunAntidotu || product.antidote || "",
        urunAmbalajMiktari: editingEk1.urunAmbalajMiktari || product.packageAmount || "",
      });
    }
  }

  function updateMalzeme(key: string, patch: Partial<MalzemeKullanimi>) {
    if (!editingEk1) return;
    setEditingEk1({ ...editingEk1, malzemeKullanimlari: editingEk1.malzemeKullanimlari.map((m) => (m.key === key ? { ...m, ...patch } : m)) });
  }

  const selectedBatch = batches.find((b) => b.id === selectedBatchId) ?? null;

  return (
    <>
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[88vh] min-w-0 overflow-y-auto sm:max-w-5xl">
        <DialogHeader>
          <DialogTitle>Periyotlar</DialogTitle>
        </DialogHeader>

        {batches.length > 0 && (
          <div className="flex items-center gap-2">
            <Select value={selectedBatchId ?? undefined} onValueChange={(v) => setSelectedBatchId(String(v))}>
              <SelectTrigger className="h-11 w-full rounded-xl px-3.5">
                <SelectValue placeholder="Periyot grubu seçin">
                  {() => selectedBatch?.name ?? "Periyot grubu seçin"}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {batches.map((b) => (
                  <SelectItem key={b.id} value={b.id}>
                    {b.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedBatch && (
              <Button variant="outline" size="icon-sm" className="shrink-0 text-destructive hover:bg-destructive/10" title="Periyot grubunu sil" onClick={handleDeleteBatch}>
                <Trash2 className="size-4" />
              </Button>
            )}
          </div>
        )}

        <Tabs
          value={tab}
          onValueChange={(v) => {
            const val = String(v);
            if (editingOccurrence && val !== "duzenle") closeEditor();
            setTab(val);
          }}
          className="min-w-0"
        >
          <TabsList variant="line">
            <TabsTrigger value="listele">LİSTELE</TabsTrigger>
            {editingOccurrence ? (
              <TabsTrigger value="duzenle">DÜZENLE</TabsTrigger>
            ) : (
              <>
                <TabsTrigger value="ekle">EKLE</TabsTrigger>
                <TabsTrigger value="olustur">OLUŞTUR</TabsTrigger>
              </>
            )}
          </TabsList>

          <TabsContent value="listele" className="mt-4 min-w-0">
            {occurrences.length === 0 ? (
              <EmptyState
                icon={Clock}
                title="Henüz periyot yok"
                description={batches.length === 0 ? "OLUŞTUR sekmesinden bir periyot grubu oluşturun." : "EKLE sekmesinden yeni bir periyot ekleyin."}
              />
            ) : (
              <div className="flex flex-col gap-3">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span>Göster</span>
                    <Select value={String(pageSize)} onValueChange={(v) => { setPageSize(Number(v)); setCurrentPage(1); }}>
                      <SelectTrigger className="h-8 w-[70px] rounded-lg px-2 text-xs">
                        <SelectValue>{() => String(pageSize)}</SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        {PAGE_SIZE_OPTIONS.map((n) => (
                          <SelectItem key={n} value={String(n)}>
                            {n}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <span>kayıt</span>
                    {selectedIds.size > 0 && (
                      <Button variant="outline" size="sm" className="ml-2 h-8 text-destructive hover:bg-destructive/10" onClick={handleBulkDelete}>
                        <Trash2 className="size-3.5" />
                        Seçili {selectedIds.size} kaydı sil
                      </Button>
                    )}
                  </div>
                  <div className="relative sm:w-64">
                    <Search className="pointer-events-none absolute top-1/2 left-3 size-3.5 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      value={search}
                      onChange={(e) => {
                        setSearch(e.target.value);
                        setCurrentPage(1);
                      }}
                      placeholder="İçerik ara…"
                      className="h-8 rounded-lg pl-8 text-xs"
                    />
                  </div>
                </div>

                <div className="min-w-0 overflow-hidden rounded-2xl border border-border/60 shadow-sm">
                  <div className="min-w-0 overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="hover:bg-transparent">
                          <TableHead className="w-10">
                            <Checkbox checked={allPageSelected} onCheckedChange={toggleSelectAllOnPage} aria-label="Tümünü seç" />
                          </TableHead>
                          <TableHead className="hidden w-10 sm:table-cell">#</TableHead>
                          <SortableHead label="Personel" active={sortKey === "personnelName"} dir={sortDir} onClick={() => toggleSort("personnelName")} />
                          <SortableHead label="Periyot Tarihi ve Saati" active={sortKey === "periodDate"} dir={sortDir} onClick={() => toggleSort("periodDate")} />
                          <TableHead className="hidden text-center md:table-cell">Belge</TableHead>
                          <TableHead className="hidden lg:table-cell">Biyosidal Ürünler</TableHead>
                          <TableHead className="text-right">İşlem</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {paged.map((o, i) => (
                          <TableRow key={o.id} className={cn(selectedIds.has(o.id) && "bg-muted/40")}>
                            <TableCell>
                              <Checkbox checked={selectedIds.has(o.id)} onCheckedChange={() => toggleSelectRow(o.id)} aria-label="Kaydı seç" />
                            </TableCell>
                            <TableCell className="hidden text-xs text-muted-foreground sm:table-cell">{pageStart + i + 1}</TableCell>
                            <TableCell className="font-medium whitespace-nowrap">{o.personnelName}</TableCell>
                            <TableCell className="text-sm whitespace-nowrap">
                              <div>{formatDateLong(o.periodDate)}</div>
                              <div className="text-xs text-muted-foreground">
                                {o.startTime || "—"} - {o.endTime || "—"}
                              </div>
                            </TableCell>
                            <TableCell className="hidden text-center text-sm md:table-cell">{o.documentCount}</TableCell>
                            <TableCell className="hidden max-w-[140px] truncate text-sm text-muted-foreground lg:table-cell">{o.biocidalProducts || "—"}</TableCell>
                            <TableCell>
                              <div className="flex items-center justify-end">
                                <Button variant="ghost" size="icon-xs" className="rounded-lg hover:bg-muted" title="İstasyonlar" onClick={() => setIstasyonOccurrenceId(o.id)}>
                                  <Flag className="size-3.5" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon-xs"
                                  className={cn("rounded-lg hover:bg-muted", o.documentCount > 0 && "text-primary hover:text-primary")}
                                  title="Belgeler"
                                  onClick={() => setBelgeOccurrenceId(o.id)}
                                >
                                  <FolderOpen className="size-3.5" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon-xs"
                                  className={cn("rounded-lg hover:bg-muted", ek1FilledIds.has(o.id) && "text-success hover:text-success")}
                                  title="Ek-1"
                                  onClick={() => setEk1OccurrenceId(o.id)}
                                >
                                  <Paperclip className={cn("size-3.5", ek1FilledIds.has(o.id) && "fill-success/20")} />
                                </Button>
                                <Button variant="ghost" size="icon-xs" className="rounded-lg hover:bg-muted" title="Rapor Maili" onClick={() => comingSoon("Rapor Maili")}>
                                  <Mail className="size-3.5" />
                                </Button>
                                <Button variant="ghost" size="icon-xs" className="rounded-lg hover:bg-muted" title="Düzenle" onClick={() => openEditor(o)}>
                                  <Pencil className="size-3.5" />
                                </Button>
                                <Button variant="ghost" size="icon-xs" className="rounded-lg hover:bg-muted" title="Kopyala" onClick={() => handleDuplicateOccurrence(o)}>
                                  <Copy className="size-3.5" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon-xs"
                                  className="rounded-lg text-destructive hover:bg-destructive/10 hover:text-destructive"
                                  title="Sil"
                                  onClick={() => handleDeleteOccurrence(o.id)}
                                >
                                  <Trash2 className="size-3.5" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>

                  <div className="flex flex-col gap-2 border-t border-border/60 px-4 py-3 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
                    <span>
                      {filteredSorted.length === 0 ? 0 : pageStart + 1}-{Math.min(pageStart + pageSize, filteredSorted.length)} / {filteredSorted.length} kayıt
                    </span>
                    <div className="flex items-center gap-1">
                      <Button variant="outline" size="icon-sm" className="size-7" disabled={currentPage === 1} onClick={() => setCurrentPage(1)}>
                        <ChevronFirst className="size-3.5" />
                      </Button>
                      <Button variant="outline" size="icon-sm" className="size-7" disabled={currentPage === 1} onClick={() => setCurrentPage((p) => p - 1)}>
                        <ChevronLeft className="size-3.5" />
                      </Button>
                      <span className="px-2">
                        {currentPage} / {totalPages}
                      </span>
                      <Button variant="outline" size="icon-sm" className="size-7" disabled={currentPage === totalPages} onClick={() => setCurrentPage((p) => p + 1)}>
                        <ChevronRight className="size-3.5" />
                      </Button>
                      <Button variant="outline" size="icon-sm" className="size-7" disabled={currentPage === totalPages} onClick={() => setCurrentPage(totalPages)}>
                        <ChevronLast className="size-3.5" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="ekle" className="mt-4">
            <div className="flex flex-col gap-4">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <Label className="mb-1.5">Periyot Tarihi</Label>
                  <Input type="date" value={addDate} onChange={(e) => setAddDate(e.target.value)} className="h-11 rounded-xl px-3.5" />
                </div>
                <div>
                  <Label className="mb-1.5">Personel</Label>
                  <Select value={addPersonnel} onValueChange={(v) => setAddPersonnel(v ?? "")}>
                    <SelectTrigger className="h-11 w-full rounded-xl px-3.5">
                      <SelectValue placeholder="Personel seçin">{() => addPersonnel || "Personel seçin"}</SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {technicianOptions.map((name) => (
                        <SelectItem key={name} value={name}>
                          {name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="mb-1.5">Uygulama Başlangıç Saati</Label>
                  <Input
                    type="time"
                    value={addStart}
                    onChange={(e) => {
                      setAddStart(e.target.value);
                      setAddEnd(addOneHour(e.target.value));
                    }}
                    className="h-11 rounded-xl px-3.5"
                  />
                </div>
                <div>
                  <Label className="mb-1.5">Uygulama Bitiş Saati</Label>
                  <Input type="time" value={addEnd} onChange={(e) => setAddEnd(e.target.value)} className="h-11 rounded-xl px-3.5" />
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                  Vazgeç
                </Button>
                <Button type="button" onClick={handleAddSave}>
                  Kaydet
                </Button>
              </DialogFooter>
            </div>
          </TabsContent>

          <TabsContent value="olustur" className="mt-4">
            <div className="flex flex-col gap-4">
              <div>
                <Label className="mb-1.5">Personel</Label>
                <Select value={genPersonnel} onValueChange={(v) => setGenPersonnel(v ?? "")}>
                  <SelectTrigger className="h-11 w-full rounded-xl px-3.5 sm:max-w-xs">
                    <SelectValue placeholder="Personel seçin">{() => genPersonnel || "Personel seçin"}</SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {technicianOptions.map((name) => (
                      <SelectItem key={name} value={name}>
                        {name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <div>
                  <Label className="mb-1.5">Periyot Başlangıç Tarihi</Label>
                  <Input type="date" value={genStartDate} onChange={(e) => setGenStartDate(e.target.value)} className="h-11 rounded-xl px-3.5" />
                </div>
                <div>
                  <Label className="mb-1.5">Uygulama Başlangıç Saati</Label>
                  <Input
                    type="time"
                    value={genStart}
                    onChange={(e) => {
                      setGenStart(e.target.value);
                      setGenEnd(addOneHour(e.target.value));
                    }}
                    className="h-11 rounded-xl px-3.5"
                  />
                </div>
                <div>
                  <Label className="mb-1.5">Uygulama Bitiş Saati</Label>
                  <Input type="time" value={genEnd} onChange={(e) => setGenEnd(e.target.value)} className="h-11 rounded-xl px-3.5" />
                </div>
                <div>
                  <Label className="mb-1.5">Periyot Bitiş Tarihi</Label>
                  <Input type="date" value={genEndDate} onChange={(e) => setGenEndDate(e.target.value)} className="h-11 rounded-xl px-3.5" />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <Label className="mb-1.5">Gün</Label>
                  <Select value={String(genDay)} onValueChange={(v) => setGenDay(Number(v))}>
                    <SelectTrigger className="h-11 w-full rounded-xl px-3.5">
                      <SelectValue>{() => String(genDay)}</SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {DAY_OPTIONS.map((d) => (
                        <SelectItem key={d} value={String(d)}>
                          {d}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="mt-1.5 text-[11px] text-muted-foreground">Sadece &quot;Ayda bir&quot; dönem seçiminde ayın kaçıncı günü uygulanacağını belirler.</p>
                </div>
                <div>
                  <Label className="mb-1.5">Dönem</Label>
                  <Select value={genDonem} onValueChange={(v) => setGenDonem(v as PeriyotDonem)}>
                    <SelectTrigger className="h-11 w-full rounded-xl px-3.5">
                      <SelectValue placeholder="Seçiniz">{() => (genDonem ? DONEM_LABELS[genDonem] : "Seçiniz")}</SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {(Object.keys(DONEM_LABELS) as PeriyotDonem[]).map((d) => (
                        <SelectItem key={d} value={d}>
                          {DONEM_LABELS[d]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                  Vazgeç
                </Button>
                <Button type="button" loading={generating} onClick={handleGenerate}>
                  <Plus className="size-4" />
                  Oluştur
                </Button>
              </DialogFooter>
            </div>
          </TabsContent>
          <TabsContent value="duzenle" className="mt-4 min-w-0">
            {editingOccurrence && editingEk1 && (
              <div className="flex flex-col gap-4">

              <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
                <div>
                  <Label className="mb-1.5">Periyot Tarihi</Label>
                  <Input
                    type="date"
                    value={editingOccurrence.periodDate}
                    onChange={(e) => setEditingOccurrence({ ...editingOccurrence, periodDate: e.target.value })}
                    className="h-11 rounded-xl px-3.5"
                  />
                </div>
                <div>
                  <Label className="mb-1.5">Personel</Label>
                  <Select
                    value={editingOccurrence.personnelName}
                    onValueChange={(v) => setEditingOccurrence({ ...editingOccurrence, personnelName: String(v) })}
                  >
                    <SelectTrigger className="h-11 w-full rounded-xl px-3.5">
                      <SelectValue>{() => editingOccurrence.personnelName}</SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {technicianOptions.map((name) => (
                        <SelectItem key={name} value={name}>
                          {name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex items-center justify-between rounded-xl border border-border/60 px-3.5 py-2.5">
                <Label className="mb-0">Girilen alanları yeni şablon olarak kaydet</Label>
                <Switch checked={saveAsTemplate} onCheckedChange={setSaveAsTemplate} />
              </div>
              {saveAsTemplate && (
                <Input
                  value={templateName}
                  onChange={(e) => setTemplateName(e.target.value)}
                  placeholder="Şablon adı"
                  className="h-11 rounded-xl px-3.5"
                />
              )}
              <div>
                <Label className="mb-1.5">Şablonlar</Label>
                <div className="flex gap-2">
                  <Select value={selectedTemplateId} onValueChange={(v) => applyTemplate(v ?? "-")}>
                    <SelectTrigger className="h-11 w-full rounded-xl px-3.5">
                      <SelectValue>{() => templates.find((t) => t.id === selectedTemplateId)?.name ?? "-"}</SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="-">-</SelectItem>
                      {templates.map((t) => (
                        <SelectItem key={t.id} value={t.id}>
                          {t.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="h-11 w-11 shrink-0 rounded-xl text-destructive hover:bg-destructive/10"
                    disabled={selectedTemplateId === "-"}
                    onClick={handleDeleteTemplate}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              </div>

              <Section title="Kullanılan Biyosidal Ürünler">
                <div className="min-w-0 sm:col-span-2">
                  <div className="overflow-x-auto rounded-xl border border-border/60">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-8">#</TableHead>
                          <TableHead>Ürün Adı</TableHead>
                          <TableHead>Miktar</TableHead>
                          <TableHead className="w-8" />
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {editingOccurrence.biocidalProductUsages.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={4} className="text-center text-sm text-muted-foreground">
                              Henüz ürün eklenmedi.
                            </TableCell>
                          </TableRow>
                        ) : (
                          editingOccurrence.biocidalProductUsages.map((usage, i) => (
                            <TableRow key={usage.id}>
                              <TableCell className="text-xs text-muted-foreground">{i + 1}</TableCell>
                              <TableCell className="min-w-[180px]">
                                <Select value={usage.productId || undefined} onValueChange={(v) => selectProduct(usage.id, String(v))}>
                                  <SelectTrigger className="h-9 w-full rounded-lg px-2.5 text-xs">
                                    <SelectValue placeholder="Ürün Seçiniz…">{() => usage.productName || "Ürün Seçiniz…"}</SelectValue>
                                  </SelectTrigger>
                                  <SelectContent>
                                    {biocidalProductOptions.map((p) => (
                                      <SelectItem key={p.id} value={p.id}>
                                        {p.name}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </TableCell>
                              <TableCell className="min-w-[150px]">
                                <div className="flex gap-1.5">
                                  <Input
                                    type="number"
                                    value={usage.amount}
                                    onChange={(e) => updateProductRow(usage.id, { amount: e.target.value })}
                                    className="h-9 w-20 rounded-lg px-2 text-xs"
                                  />
                                  <Select value={usage.unit} onValueChange={(v) => updateProductRow(usage.id, { unit: String(v) })}>
                                    <SelectTrigger className="h-9 w-24 rounded-lg px-2 text-xs">
                                      <SelectValue>{() => usage.unit}</SelectValue>
                                    </SelectTrigger>
                                    <SelectContent>
                                      {MIKTAR_BIRIMLERI.map((u) => (
                                        <SelectItem key={u} value={u}>
                                          {u}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </div>
                              </TableCell>
                              <TableCell>
                                <Button variant="ghost" size="icon-xs" className="rounded-lg text-destructive hover:bg-destructive/10" onClick={() => removeProductRow(usage.id)}>
                                  <Trash2 className="size-3.5" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </div>
                  <Button type="button" variant="outline" size="sm" className="mt-2.5" onClick={addProductRow}>
                    <Plus className="size-3.5" />
                    Ürün Ekle
                  </Button>
                </div>
              </Section>

              <Section title="Uygulama Yapılan Yer">
                <div>
                  <Label className="mb-1.5">Uygulama Başlangıç Saati</Label>
                  <Input
                    type="time"
                    value={editingOccurrence.startTime}
                    onChange={(e) =>
                      setEditingOccurrence({ ...editingOccurrence, startTime: e.target.value, endTime: addOneHour(e.target.value) })
                    }
                    className="h-11 rounded-xl px-3.5"
                  />
                </div>
                <div>
                  <Label className="mb-1.5">Uygulama Bitiş Saati</Label>
                  <Input
                    type="time"
                    value={editingOccurrence.endTime}
                    onChange={(e) => setEditingOccurrence({ ...editingOccurrence, endTime: e.target.value })}
                    className="h-11 rounded-xl px-3.5"
                  />
                </div>
                <Field label="Uygulama Ekip Sorumlusu" value={editingEk1.ekipSorumlusu} onChange={(v) => setEditingEk1({ ...editingEk1, ekipSorumlusu: v })} />
                <Field label="Uygulama Yapılan Yerin Sorumlusu" value={editingEk1.yeriSorumlusuImza} onChange={(v) => setEditingEk1({ ...editingEk1, yeriSorumlusuImza: v })} />
                <TechnicianMultiSelect label="Uygulayıcı(lar) Adı, Soyadı" value={editingEk1.uygulayicilar} onChange={(v) => setEditingEk1({ ...editingEk1, uygulayicilar: v })} options={technicianOptions} />
                <Field label="Ürünün Uygulama Şekli" value={editingEk1.urunUygulamaSekli} onChange={(v) => setEditingEk1({ ...editingEk1, urunUygulamaSekli: v })} />
                <div>
                  <Label className="mb-1.5">Mesken/İşyeri vb.</Label>
                  <Select value={editingEk1.meskenIsyeriVb} onValueChange={(v) => setEditingEk1({ ...editingEk1, meskenIsyeriVb: String(v) })}>
                    <SelectTrigger className="h-11 w-full rounded-xl px-3.5">
                      <SelectValue>{() => editingEk1.meskenIsyeriVb}</SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {MESKEN_ISYERI_OPTIONS.map((o) => (
                        <SelectItem key={o} value={o}>
                          {o}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Field label="Mesken İse Daire Sayısı" value={editingEk1.meskenDaireSayisi} onChange={(v) => setEditingEk1({ ...editingEk1, meskenDaireSayisi: v })} />
                <div>
                  <Label className="mb-1.5">Uygulama Yapılan Yerin Alanı</Label>
                  <div className="flex gap-2">
                    <Input
                      type="number"
                      value={editingEk1.uygulamaAlani}
                      onChange={(e) => setEditingEk1({ ...editingEk1, uygulamaAlani: e.target.value })}
                      className="h-11 rounded-xl px-3.5"
                    />
                    <Select value={editingEk1.uygulamaAlaniBirimi} onValueChange={(v) => setEditingEk1({ ...editingEk1, uygulamaAlaniBirimi: String(v) })}>
                      <SelectTrigger className="h-11 w-24 shrink-0 rounded-xl px-2.5">
                        <SelectValue>{() => editingEk1.uygulamaAlaniBirimi}</SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        {ALAN_BIRIMLERI.map((b) => (
                          <SelectItem key={b} value={b}>
                            {b}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <FieldArea label="Alınan Güvenlik Önlemleri, Yapılan Öneri ve Uyarılar" value={editingEk1.guvenlikOnlemleri} onChange={(v) => setEditingEk1({ ...editingEk1, guvenlikOnlemleri: v })} />
              </Section>

              <div className="overflow-hidden rounded-2xl border border-border/60">
                <div className="flex items-center justify-between border-b border-border/60 bg-muted/30 px-4 py-2.5">
                  <span className="text-sm font-semibold text-foreground">Kullanılan Malzemeler</span>
                  <Switch checked={editingEk1.malzemelerEtkin} onCheckedChange={(v) => setEditingEk1({ ...editingEk1, malzemelerEtkin: v })} />
                </div>
                <div className={cn("grid grid-cols-1 gap-x-6 gap-y-3 p-4 sm:grid-cols-2", !editingEk1.malzemelerEtkin && "pointer-events-none opacity-40")}>
                  {editingEk1.malzemeKullanimlari.map((m) => (
                    <div key={m.key} className="flex items-center gap-2.5">
                      <Input
                        type="number"
                        value={m.adet}
                        onChange={(e) => updateMalzeme(m.key, { adet: e.target.value })}
                        className="h-9 w-16 shrink-0 rounded-lg px-2 text-xs"
                      />
                      <span className="min-w-0 flex-1 truncate text-xs text-foreground">{MALZEME_TYPES.find((t) => t.key === m.key)?.label}</span>
                      <Switch checked={m.kullanildi} onCheckedChange={(v) => updateMalzeme(m.key, { kullanildi: v })} />
                    </div>
                  ))}
                </div>
              </div>

              <div className="overflow-hidden rounded-2xl border border-border/60">
                <div className="flex items-center justify-between border-b border-border/60 bg-muted/30 px-4 py-2.5">
                  <span className="text-sm font-semibold text-foreground">Periyota Ait Belgeler</span>
                  <Button type="button" size="sm" variant="secondary" onClick={() => quickBelgeInputRef.current?.click()}>
                    <Camera className="size-3.5" />
                    Biyosidal Ürün Uygulama Rapor Görseli Ekle
                  </Button>
                  <input
                    ref={quickBelgeInputRef}
                    type="file"
                    className="hidden"
                    accept="image/jpeg,image/png,application/pdf"
                    onChange={(e) => handleQuickRaporGorseli(e.target.files?.[0])}
                  />
                </div>
                <div className="flex flex-col gap-4 p-4">
                  {editorDocuments.length > 0 && (
                    <div className="flex flex-col gap-2">
                      {editorDocuments.map((doc) => (
                        <div key={doc.id} className="flex items-center gap-3 rounded-xl border border-border/60 p-2.5">
                          <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                            {doc.fileType === "application/pdf" ? <FileTextIcon className="size-4" /> : <FileImage className="size-4" />}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-medium text-foreground">{doc.name}</p>
                            <p className="text-xs text-muted-foreground">{formatDateLong(doc.createdAt)}</p>
                          </div>
                          <Button size="icon-xs" variant="outline" className="text-destructive hover:bg-destructive/10" onClick={() => handleDeleteBelge(doc.id)}>
                            <Trash2 className="size-3.5" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                  <div>
                    <Label className="mb-1.5">Belge Adı</Label>
                    <Input value={belgeName} onChange={(e) => setBelgeName(e.target.value)} placeholder="Belge Adı" className="h-11 rounded-xl px-3.5" />
                  </div>
                  <div>
                    <Label className="mb-1.5">Belge * (*.JPEG, *.JPG, *.PNG, *.PDF)</Label>
                    <div
                      className={cn(
                        "flex flex-col items-center gap-2 rounded-xl border-2 border-dashed border-border p-5 text-center transition-colors",
                        belgeDragOver && "border-primary bg-primary/5",
                        belgeFile && "border-solid border-primary/20 bg-muted/30",
                      )}
                      onDragOver={(e) => {
                        e.preventDefault();
                        setBelgeDragOver(true);
                      }}
                      onDragLeave={() => setBelgeDragOver(false)}
                      onDrop={(e) => {
                        e.preventDefault();
                        setBelgeDragOver(false);
                        handleBelgeFileSelect(e.dataTransfer.files?.[0]);
                      }}
                    >
                      {belgeFile ? (
                        <p className="text-xs font-medium text-foreground">{belgeFile.fileName}</p>
                      ) : (
                        <Upload className="size-5 text-muted-foreground" />
                      )}
                      <Button type="button" size="sm" onClick={() => belgeFileInputRef.current?.click()}>
                        {belgeFile ? "Değiştir" : "Dosya Seç"}
                      </Button>
                      <p className="text-xs text-muted-foreground">Sürükle &amp; Bırak</p>
                      <input
                        ref={belgeFileInputRef}
                        type="file"
                        className="hidden"
                        accept="image/jpeg,image/png,application/pdf"
                        onChange={(e) => handleBelgeFileSelect(e.target.files?.[0])}
                      />
                    </div>
                  </div>
                  <Button type="button" variant="outline" size="sm" className="self-start" onClick={handleAddBelge}>
                    <Plus className="size-3.5" />
                    Belge Ekle
                  </Button>
                </div>
              </div>

              <div className="overflow-hidden rounded-2xl border border-border/60">
                <div className="border-b border-border/60 bg-muted/30 px-4 py-2.5">
                  <span className="text-sm font-semibold text-foreground">Düzeltici Önleyici Faaliyet Raporları</span>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Bu periyota ait düzeltici/önleyici faaliyet notlarını ekleyebilirsiniz. Tarih ve personel bilgisi periyottan otomatik alınır.
                  </p>
                </div>
                <div className="flex flex-col gap-4 p-4">
                  {capaNotes.length > 0 && (
                    <div className="flex flex-col gap-2">
                      {capaNotes.map((note) => (
                        <div key={note.id} className="flex items-start gap-3 rounded-xl border border-border/60 p-2.5">
                          <div className="min-w-0 flex-1">
                            <p className="text-sm text-foreground">{note.description}</p>
                            {note.documentName && <p className="mt-1 text-xs text-muted-foreground">{note.documentName}</p>}
                            <p className="text-xs text-muted-foreground">{formatDateLong(note.createdAt)}</p>
                          </div>
                          <Button size="icon-xs" variant="outline" className="shrink-0 text-destructive hover:bg-destructive/10" onClick={() => handleDeleteCapaNote(note.id)}>
                            <Trash2 className="size-3.5" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                  <div>
                    <Label className="mb-1.5">Açıklama *</Label>
                    <Textarea value={capaDescription} onChange={(e) => setCapaDescription(e.target.value)} className="min-h-[90px] rounded-xl px-3.5 py-2.5" placeholder="Açıklama" />
                  </div>
                  <div>
                    <Label className="mb-1.5">Belge Adı</Label>
                    <Input value={capaDocName} onChange={(e) => setCapaDocName(e.target.value)} placeholder="Belge Adı" className="h-11 rounded-xl px-3.5" />
                  </div>
                  <div>
                    <Label className="mb-1.5">Belge / Fotoğraf</Label>
                    <div
                      className={cn(
                        "flex flex-col items-center gap-2 rounded-xl border-2 border-dashed border-border p-5 text-center transition-colors",
                        capaDragOver && "border-primary bg-primary/5",
                        capaFile && "border-solid border-primary/20 bg-muted/30",
                      )}
                      onDragOver={(e) => {
                        e.preventDefault();
                        setCapaDragOver(true);
                      }}
                      onDragLeave={() => setCapaDragOver(false)}
                      onDrop={(e) => {
                        e.preventDefault();
                        setCapaDragOver(false);
                        handleCapaFileSelect(e.dataTransfer.files?.[0]);
                      }}
                    >
                      {capaFile ? (
                        <p className="text-xs font-medium text-foreground">{capaFile.fileName}</p>
                      ) : (
                        <Upload className="size-5 text-muted-foreground" />
                      )}
                      <Button type="button" size="sm" onClick={() => capaFileInputRef.current?.click()}>
                        {capaFile ? "Değiştir" : "Belge veya fotoğraf ekle"}
                      </Button>
                      <input
                        ref={capaFileInputRef}
                        type="file"
                        className="hidden"
                        accept="image/jpeg,image/png,application/pdf"
                        onChange={(e) => handleCapaFileSelect(e.target.files?.[0])}
                      />
                    </div>
                  </div>
                  <Button type="button" variant="outline" size="sm" className="self-start" onClick={handleAddCapaNote}>
                    <Plus className="size-3.5" />
                    Rapor Ekle
                  </Button>
                </div>
              </div>

              <label className="flex items-start gap-2.5 rounded-xl border border-border/60 px-3.5 py-3 text-sm">
                <Checkbox checked={kvkkApproved} onCheckedChange={(v) => setKvkkApproved(v === true)} className="mt-0.5" />
                <span className="text-foreground">KVKK Aydınlatma Metni&rsquo;ni onaylıyorum.</span>
              </label>

              <div className="mt-1 flex flex-wrap items-center justify-between gap-2">
                <Button type="button" variant="outline" size="sm" disabled title="Yakında">
                  <FileBarChart className="size-3.5" />
                  Biyosidal Ürün Raporu Oluştur
                </Button>
                <div className="flex gap-2">
                  <Button type="button" variant="outline" size="sm" onClick={closeEditor}>
                    Vazgeç
                  </Button>
                  <Button type="button" size="sm" onClick={handleEditSave}>
                    Kaydet
                  </Button>
                </div>
              </div>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>

    <BelgeTanimlamaDialog
      open={!!belgeOccurrenceId}
      onOpenChange={(o) => !o && setBelgeOccurrenceId(null)}
      serviceOrderId={belgeOccurrenceId}
      onCountChange={handleOccurrenceDocCountChange}
    />

    <IstasyonlarDialog
      open={!!istasyonOccurrenceId}
      onOpenChange={(o) => !o && setIstasyonOccurrenceId(null)}
      serviceOrderId={serviceOrderId}
      occurrence={occurrences.find((o) => o.id === istasyonOccurrenceId) ?? null}
      customerName={customerName}
      batchName={selectedBatch?.name ?? ""}
    />

    <Ek1Dialog
      open={!!ek1OccurrenceId}
      onOpenChange={(o) => !o && setEk1OccurrenceId(null)}
      occurrence={occurrences.find((o) => o.id === ek1OccurrenceId) ?? null}
      customerId={customerId}
      batchName={selectedBatch?.name ?? ""}
      onSaved={() => refreshOccurrencesAsync()}
    />
    </>
  );
}

function SortableHead({
  label,
  active,
  dir,
  onClick,
}: {
  label: string;
  active: boolean;
  dir: "asc" | "desc";
  onClick: () => void;
}) {
  return (
    <TableHead>
      <button type="button" onClick={onClick} className="flex items-center gap-1 hover:text-foreground">
        {label}
        <ArrowUpDown className={cn("size-3", active ? "text-primary" : "text-muted-foreground/50", active && dir === "desc" && "rotate-180")} />
      </button>
    </TableHead>
  );
}
