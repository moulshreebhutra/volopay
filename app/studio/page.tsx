import type { Metadata } from "next";
import Studio from "@/components/Studio";

export const metadata: Metadata = {
  title: "Setup Studio · Moulshree × Volopay",
  description: "Write an approval policy in plain English, check the setup, and see who approves what before going live.",
};

export default function StudioPage() {
  return <Studio />;
}
