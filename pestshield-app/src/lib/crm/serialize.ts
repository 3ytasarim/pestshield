import type {
  Customer as PrismaCustomer,
  Branch as PrismaBranch,
  Contact as PrismaContact,
  Address as PrismaAddress,
  Location as PrismaLocation,
  Contract as PrismaContract,
  Offer as PrismaOffer,
  OfferItem as PrismaOfferItem,
  ServiceOrder as PrismaServiceOrder,
  ServiceOrderItem as PrismaServiceOrderItem,
  WorkOrder as PrismaWorkOrder,
  Technician as PrismaTechnician,
} from "@/generated/prisma";
import type {
  Customer,
  Branch,
  Contact,
  Address,
  Location,
  Contract,
  Offer,
  OfferItem,
  ServiceOrder,
  ServiceOrderItem,
  WorkOrder,
} from "@/lib/mock/crm";

/** Prisma'nın Decimal/Date alanlarını ve `ownerId`yi frontend'in beklediği Customer şekline çevirir. */
export function serializeCustomer(customer: PrismaCustomer): Customer {
  const { ownerId: _ownerId, ...rest } = customer;
  void _ownerId;
  return {
    ...rest,
    pendingCollection: Number(customer.pendingCollection),
    createdAt: customer.createdAt.toISOString().slice(0, 10),
  };
}

export function serializeBranch(branch: PrismaBranch): Branch {
  const { ownerId: _ownerId, ...rest } = branch;
  void _ownerId;
  return rest;
}

export function serializeContact(contact: PrismaContact): Contact {
  const { ownerId: _ownerId, ...rest } = contact;
  void _ownerId;
  return rest;
}

export function serializeAddress(address: PrismaAddress): Address {
  const { ownerId: _ownerId, ...rest } = address;
  void _ownerId;
  return rest;
}

export function serializeLocation(location: PrismaLocation): Location {
  const { ownerId: _ownerId, ...rest } = location;
  void _ownerId;
  return rest;
}

export function serializeContract(contract: PrismaContract): Contract {
  const { ownerId: _ownerId, ...rest } = contract;
  void _ownerId;
  return { ...rest, monthlyAmount: Number(contract.monthlyAmount) };
}

export function serializeOfferItem(item: PrismaOfferItem): OfferItem {
  const { ownerId: _ownerId, offerId: _offerId, ...rest } = item;
  void _ownerId;
  void _offerId;
  return { ...rest, unitPrice: Number(item.unitPrice) };
}

export function serializeOffer(offer: PrismaOffer & { items: PrismaOfferItem[] }): Offer {
  const { ownerId: _ownerId, ...rest } = offer;
  void _ownerId;
  return { ...rest, amount: Number(offer.amount), items: offer.items.map(serializeOfferItem) };
}

export function serializeServiceOrderItem(item: PrismaServiceOrderItem): ServiceOrderItem {
  const { ownerId: _ownerId, serviceOrderId: _serviceOrderId, ...rest } = item;
  void _ownerId;
  void _serviceOrderId;
  return { ...rest, unitPrice: Number(item.unitPrice), quantity: Number(item.quantity), vatRate: Number(item.vatRate) };
}

export function serializeServiceOrder(order: PrismaServiceOrder & { items: PrismaServiceOrderItem[] }): ServiceOrder {
  const { ownerId: _ownerId, ...rest } = order;
  void _ownerId;
  return {
    ...rest,
    subtotal: Number(order.subtotal),
    vatTotal: Number(order.vatTotal),
    withholdingAmount: Number(order.withholdingAmount),
    total: Number(order.total),
    items: order.items.map(serializeServiceOrderItem),
  };
}

export function serializeWorkOrder(order: PrismaWorkOrder & { technician: PrismaTechnician | null }): WorkOrder {
  const { ownerId: _ownerId, technicianId: _technicianId, technician, ...rest } = order;
  void _ownerId;
  void _technicianId;
  return { ...rest, technician: technician?.name ?? "—" };
}
