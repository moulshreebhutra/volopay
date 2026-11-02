import type { Metadata } from "next";
import Studio from "@/components/Studio";

export const metadata: Metadata = {
  title: "Setup Studio · Moulshree × Volopay",
  description: "Write an approval policy in plain English, check the setup, and see who approves what before going live.",
};

export default function StudioPage() {
  return (
    <>
      <section className="wrap" style={{ paddingTop: 36 }}>
        <p className="eyebrow">Working prototype</p>
        <h1 style={{ fontSize: "clamp(1.7rem,4vw,2.6rem)" }}>Write the approval policy. See who approves what before go-live.</h1>
        <p className="lede">Paste a team list and a policy in plain English. The studio turns them into a Volopay-shaped setup, runs {` `}checks drawn from Volopay's own help pages, and lets you test any request. All data is invented in the sample; your own stays in your browser.</p>
      </section>
      <Studio />
    </>
  );
}
