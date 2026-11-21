import { bookingsWorkspace, campaignsWorkspace, customersWorkspace, editionsWorkspace, enquiriesWorkspace, invoicesWorkspace, ordersWorkspace } from "./demo-data";

export const workspaceRegistry = {
  customers: customersWorkspace,
  orders: ordersWorkspace,
  editions: editionsWorkspace,
  bookings: bookingsWorkspace,
  invoices: invoicesWorkspace,
  enquiries: enquiriesWorkspace,
  campaigns: campaignsWorkspace,
} as const;

export type WorkspaceEntity = keyof typeof workspaceRegistry;

export function getWorkspace(entity: string) {
  return workspaceRegistry[entity as WorkspaceEntity];
}
