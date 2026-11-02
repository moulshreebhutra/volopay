import React, { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import Home from "../app/page";
import Method from "../app/method/page";
import Studio from "../components/Studio";
import { ABOUT } from "../lib/about";
import "../app/globals.css";

function useHash() {
  const [h, setH] = useState(() => location.hash.slice(1));
  useEffect(() => { const f = () => setH(location.hash.slice(1)); window.addEventListener("hashchange", f); return () => window.removeEventListener("hashchange", f); }, []);
  return h;
}

function Shell() {
  const h = useHash();
  const view = h === "studio" ? "studio" : h === "method" ? "method" : "home";
  useEffect(() => {
    if (view === "home" && h) { setTimeout(() => document.getElementById(h)?.scrollIntoView(), 30); }
    else window.scrollTo(0, 0);
  }, [h, view]);
  return (
    <>
      <nav className="nav" aria-label="Main">
        <div className="wrap">
          <a href="#" className="brand" aria-label="Setup Studio, home">
            <i aria-hidden><svg viewBox="0 0 24 24"><path d="M4 7h10M18 7h2M4 17h2M10 17h10" /><circle cx="16" cy="7" r="2" /><circle cx="8" cy="17" r="2" /></svg></i>
            <span>Setup Studio<small>a concept for Volopay · by Moulshree</small></span>
          </a>
          <span className="links">
            <a href="#why">Why me</a><a href="#noticed">What I noticed</a><a href="#plan">30/60/90</a><a href="#method">Method</a>
            <a href="#studio" className="cta">Try the studio</a>
          </span>
        </div>
      </nav>
      <div id="main">{view === "studio" ? <Studio /> : view === "method" ? <Method /> : <Home />}</div>
      <footer>
        <div className="wrap">
          <span>Built by <a href={ABOUT.portfolio} target="_blank" rel="noreferrer">{ABOUT.name}</a> for her application to Volopay. Independent prototype, not affiliated with or endorsed by Volopay. It never asks for credentials, and your pasted data stays in your browser.</span>
          <span><a href={ABOUT.resume} target="_blank" rel="noreferrer">Resume</a> · <a href={ABOUT.linkedin} target="_blank" rel="noreferrer">LinkedIn</a> · <a href={ABOUT.portfolio} target="_blank" rel="noreferrer">Portfolio</a> · <a href={ABOUT.repo} target="_blank" rel="noreferrer">Source</a></span>
        </div>
      </footer>
    </>
  );
}
createRoot(document.getElementById("root")!).render(<Shell />);
