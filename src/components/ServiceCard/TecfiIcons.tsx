/* Exact icon artwork from https://www.tecfi.it/en/services-and-support
 * (inline SVGs copied verbatim, including stroke attributes).
 * Tecfi recolors the strokes to yellow via CSS
 * (`.s_serv_icon svg path { stroke: ... }`) — mirrored in
 * ServiceCard.module.css so the rendered result matches.
 * Explicit components per icon — no generic `name` prop. */

export function TecfiDownloadIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      preserveAspectRatio="xMidYMid meet"
      aria-hidden="true"
      focusable="false"
    >
      <path
        d="M3 14V20C3 21.1046 3.89543 22 5 22H19C20.1046 22 21 21.1046 21 20V14M12 2V16M12 16L7 10.5555M12 16L17 10.5556"
        stroke="#000000"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function TecfiChemicalCalcIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      preserveAspectRatio="xMidYMid meet"
      aria-hidden="true"
      focusable="false"
    >
      <path
        d="M2 5C2 3.34315 3.34315 2 5 2H19C20.6569 2 22 3.34315 22 5V19C22 20.6569 20.6569 22 19 22H5C3.34315 22 2 20.6569 2 19V5Z"
        stroke="#000000"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M18 14.5H14M18 17.5H14"
        stroke="#000000"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M16 6V10M18 8H14"
        stroke="#000000"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M10 8H6"
        stroke="#000000"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M10 14L6 18M6 14L10 18"
        stroke="#000000"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
