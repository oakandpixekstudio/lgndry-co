import type { Metadata } from "next";
import { WebsiteImages } from "@/features/catalogue/components/website-images";

export const metadata: Metadata = { title: "Website images" };
export default function WebsiteImagesPage() {
  return <WebsiteImages />;
}
