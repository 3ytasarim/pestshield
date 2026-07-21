export interface SupportTicketMessageDTO {
  id: string;
  ticketId: string;
  authorUserId: string;
  authorRole: "ADMIN" | "TECH" | "CLIENT" | "CUSTOMER";
  body: string;
  createdAt: string;
}

export interface SupportTicketDTO {
  id: string;
  ownerId: string;
  openedByRole: "CUSTOMER" | "CLIENT";
  openedByUserId: string;
  customerId: string | null;
  subject: string;
  status: "open" | "answered" | "closed";
  createdAt: string;
  updatedAt: string;
  messages: SupportTicketMessageDTO[];
  customer: { id: string; companyName: string } | null;
  owner: { id: string; companyName: string | null } | null;
}
