export const EMAIL_SIGNATURE_STORAGE_KEY = "lgndry-studio-email-signature";
export const EMAIL_SIGNATURE_EVENT = "lgndry-email-signature-updated";

export function readEmailSignature() {
  if (typeof window === "undefined") return "";
  try {
    return window.localStorage.getItem(EMAIL_SIGNATURE_STORAGE_KEY) ?? "";
  } catch {
    return "";
  }
}

export function saveEmailSignature(value: string) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(EMAIL_SIGNATURE_STORAGE_KEY, value);
  window.dispatchEvent(new CustomEvent(EMAIL_SIGNATURE_EVENT, { detail: value }));
}
