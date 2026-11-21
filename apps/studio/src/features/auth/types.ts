/** What the interface needs to show about the signed-in person. Safe to send to the browser. */
export interface StaffInfo {
  name: string;
  initials: string;
  email: string;
  roleLabel: string;
}
