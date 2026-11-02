import React from "react";
/** Stand-in for next/link inside the single-file preview: routes become hash links. */
export default function Link({ href, children, ...rest }: { href: string; children?: React.ReactNode } & React.AnchorHTMLAttributes<HTMLAnchorElement>) {
  let h = href;
  if (href === "/") h = "#";
  else if (href.startsWith("/#")) h = href.slice(1);
  else if (href.startsWith("/")) h = "#" + href.slice(1);
  return <a href={h} {...rest}>{children}</a>;
}
