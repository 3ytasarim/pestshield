import type {
  Technician as PrismaTechnician,
  Vehicle as PrismaVehicle,
  ChecklistTemplate as PrismaChecklistTemplate,
  Station as PrismaStation,
  StationCheck as PrismaStationCheck,
  Warehouse as PrismaWarehouse,
} from "@/generated/prisma/client";
import type { Technician, Vehicle, ChecklistTemplate, Station, StationCheck } from "@/lib/mock/operations";

export function serializeTechnician(technician: PrismaTechnician & { vehicles: PrismaVehicle[] }): Technician {
  const { ownerId: _ownerId, userId: _userId, vehicles, ...rest } = technician;
  void _ownerId;
  void _userId;
  return { ...rest, vehicleId: vehicles[0]?.id ?? null };
}

export function serializeVehicle(vehicle: PrismaVehicle & { warehouse?: PrismaWarehouse | null }): Vehicle {
  const { ownerId: _ownerId, warehouse, ...rest } = vehicle;
  void _ownerId;
  return { ...rest, warehouseName: warehouse?.name ?? null };
}

export function serializeChecklistTemplate(template: PrismaChecklistTemplate): ChecklistTemplate {
  const { ownerId: _ownerId, ...rest } = template;
  void _ownerId;
  return rest;
}

export function serializeStation(station: PrismaStation): Station {
  const { ownerId: _ownerId, ...rest } = station;
  void _ownerId;
  return rest;
}

export function serializeStationCheck(check: PrismaStationCheck & { technician: PrismaTechnician | null }): StationCheck {
  const { ownerId: _ownerId, technicianId: _technicianId, technician, ...rest } = check;
  void _ownerId;
  void _technicianId;
  return { ...rest, technicianName: technician?.name ?? "—" };
}
