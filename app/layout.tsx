import type { Metadata } from "next";
import Link from "next/link";
import "@fontsource-variable/bricolage-grotesque";
import "@fontsource-variable/manrope";
import "./globals.css";
import { ABOUT } from "@/lib/about";

export const metadata: Metadata = {
  title: "Moulshree Bhutra × Volopay: Setup Studio",
  description:
    "An application to Volopay's Founder's Office, Product role, with a working prototype: paste a team list and an approval policy, get a checked Volopay setup, an approval simulator and a setup pack.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <a className="skip" href="#main">Skip to content</a>
        <nav className="nav" aria-label="Main">
          <div className="wrap">
            <Link href="/" className="brand" aria-label="Setup Studio, home">
              <i aria-hidden><svg viewBox="0 0 24 24"><path d="M4 7h10M18 7h2M4 17h2M10 17h10"/><circle cx="16" cy="7" r="2"/><circle cx="8" cy="17" r="2"/></svg></i>
              <span>Setup Studio<small>a concept for Volopay · by Moulshree</small></span>
            </Link>
            <span className="links">
              <Link href="/#why">Why me</Link>
              <Link href="/#noticed">What I noticed</Link>
              <Link href="/#plan">30/60/90</Link>
              <Link href="/method">Method</Link>
              <Link href="/studio" className="cta">Try the studio</Link>
            </span>
          </div>
        </nav>
        <div id="main">{children}</div>
        <footer>
          <div className="wrap">
            <span>
              Built by <a href={ABOUT.portfolio} target="_blank" rel="noreferrer">{ABOUT.name}</a> for her application to Volopay. Independent prototype, not affiliated with or endorsed by Volopay. It never asks for credentials, and your pasted data stays in your browser.
            </span>
            <span>
              <a href={ABOUT.resume} target="_blank" rel="noreferrer">Resume</a> ·{" "}
              <a href={ABOUT.linkedin} target="_blank" rel="noreferrer">LinkedIn</a> ·{" "}
              <a href={ABOUT.portfolio} target="_blank" rel="noreferrer">Portfolio</a> ·{" "}
              <a href={ABOUT.repo} target="_blank" rel="noreferrer">Source</a>
            </span>
          </div>
        </footer>
      </body>
    </html>
  );
}
