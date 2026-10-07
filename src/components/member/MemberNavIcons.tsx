import type { SVGProps } from "react";

function IconBase(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      {...props}
    />
  );
}

export function NavIconHome(props: SVGProps<SVGSVGElement>) {
  return (
    <IconBase {...props}>
      <path d="M4 10.5 12 4l8 6.5V20a1 1 0 0 1-1 1h-5v-6H10v6H5a1 1 0 0 1-1-1v-9.5Z" />
    </IconBase>
  );
}

export function NavIconEpisodes(props: SVGProps<SVGSVGElement>) {
  return (
    <IconBase {...props}>
      <circle cx="12" cy="12" r="9" />
      <path d="M10 8.5v7l5.5-3.5L10 8.5Z" fill="currentColor" stroke="none" />
    </IconBase>
  );
}

export function NavIconDossier(props: SVGProps<SVGSVGElement>) {
  return (
    <IconBase {...props}>
      <path d="M6 4h8l4 4v13a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1Z" />
      <path d="M14 4v4h4" />
    </IconBase>
  );
}

export function NavIconJuris(props: SVGProps<SVGSVGElement>) {
  return (
    <IconBase {...props}>
      <path d="M12 3v3M8 6h8M7 10h10M9 10v8M15 10v8M6 18h12" />
    </IconBase>
  );
}

export function NavIconCommunity(props: SVGProps<SVGSVGElement>) {
  return (
    <IconBase {...props}>
      <path d="M16 11c1.66 0 3-1.12 3-2.5S17.66 6 16 6s-3 1.12-3 2.5S14.34 11 16 11Z" />
      <path d="M8 11c1.66 0 3-1.12 3-2.5S9.66 6 8 6 5 7.12 5 8.5 6.34 11 8 11Z" />
      <path d="M8 13c-2.5 0-5 1.2-5 3v2h6M16 13c2.5 0 5 1.2 5 3v2h-6" />
    </IconBase>
  );
}

export function NavIconForum(props: SVGProps<SVGSVGElement>) {
  return (
    <IconBase {...props}>
      <path d="M4 5h16v10H8l-4 4V5Z" />
    </IconBase>
  );
}

export function NavIconSuggest(props: SVGProps<SVGSVGElement>) {
  return (
    <IconBase {...props}>
      <path d="M12 3a6 6 0 0 0-4 10.7V18l4-2 4 2v-4.3A6 6 0 0 0 12 3Z" />
    </IconBase>
  );
}

export function NavIconArchive(props: SVGProps<SVGSVGElement>) {
  return (
    <IconBase {...props}>
      <path d="M4 7h16v11H4V7Z" />
      <path d="M8 7V5h8v2M10 11h4" />
    </IconBase>
  );
}

export function NavIconShop(props: SVGProps<SVGSVGElement>) {
  return (
    <IconBase {...props}>
      <path d="M6 7h12l-1 12H7L6 7Z" />
      <path d="M9 7V5a3 3 0 0 1 6 0v2" />
    </IconBase>
  );
}

export function NavIconAccount(props: SVGProps<SVGSVGElement>) {
  return (
    <IconBase {...props}>
      <circle cx="12" cy="9" r="3.5" />
      <path d="M5 20c0-3.5 3-6 7-6s7 2.5 7 6" />
    </IconBase>
  );
}

export function NavIconAdmin(props: SVGProps<SVGSVGElement>) {
  return (
    <IconBase {...props}>
      <path d="M12 3 4 7v6c0 5 3.5 8.5 8 9 4.5-.5 8-4 8-9V7l-8-4Z" />
    </IconBase>
  );
}

export function NavIconChevronLeft(props: SVGProps<SVGSVGElement>) {
  return (
    <IconBase {...props}>
      <path d="M15 6 9 12l6 6" />
    </IconBase>
  );
}

export function NavIconChevronRight(props: SVGProps<SVGSVGElement>) {
  return (
    <IconBase {...props}>
      <path d="M9 6l6 6-6 6" />
    </IconBase>
  );
}
