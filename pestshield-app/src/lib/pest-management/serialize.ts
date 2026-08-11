import "server-only";
import type { PestSpeciesEntry, EquipmentGuideEntry } from "@/generated/prisma";

export interface PestSpeciesEntryDTO {
  id: string;
  name: string;
  scientificName: string;
  category: string;
  riskLevel: string;
  activeSeason: string;
  icon: string;
  contentHtml: string;
}

export function serializePestSpeciesEntry(entry: PestSpeciesEntry): PestSpeciesEntryDTO {
  return {
    id: entry.id,
    name: entry.name,
    scientificName: entry.scientificName,
    category: entry.category,
    riskLevel: entry.riskLevel,
    activeSeason: entry.activeSeason,
    icon: entry.icon,
    contentHtml: entry.contentHtml,
  };
}

export interface EquipmentGuideEntryDTO {
  id: string;
  category: string;
  title: string;
  contentHtml: string;
  targetSpeciesIds: string[];
  relatedProductKeywords: string[];
}

export function serializeEquipmentGuideEntry(
  entry: EquipmentGuideEntry & { targetSpecies?: { id: string }[] },
): EquipmentGuideEntryDTO {
  return {
    id: entry.id,
    category: entry.category,
    title: entry.title,
    contentHtml: entry.contentHtml,
    targetSpeciesIds: entry.targetSpecies?.map((s) => s.id) ?? [],
    relatedProductKeywords: entry.relatedProductKeywords,
  };
}
