"use client";

/** Lightweight session loading screen using the site's existing VetoGrid SVG mark. */
export function VetoGridLoadingScreen() {
  return (
    <main className="vg-loading-screen" role="status" aria-live="polite" aria-label="Preparing your campus experience">
      <div className="vg-loading-content">
        <div className="vg-eagle-flight" aria-hidden="true">
          <svg className="vg-eagle-mark" viewBox="0 0 256 224" fill="none" xmlns="http://www.w3.org/2000/svg">
            <g stroke="#f7f2e7" strokeWidth="4" strokeLinejoin="round">
              <g className="vg-eagle-wing vg-eagle-wing-left">
                <path fill="#4b271c" d="M12 12 76 64 51 68 12 48z" />
                <path fill="#bd806c" d="m16 56 38 15 24 28-48-16z" />
                <path fill="#d8c9aa" d="m31 89 49 14-8 28-40-22z" />
                <path fill="#c69a00" d="m77 72 47 43-37 18-28-31z" />
                <path fill="#e7a18b" d="m76 136 36-18 25 28-41 24z" />
                <path fill="#4b271c" d="m139 119 22 24-29 27-28-18z" />
                <path fill="#c69a00" d="m93 176 41-29 25 27-40 34z" />
                <path fill="#bd806c" d="m110 212 22-38 18 38-22 10z" />
              </g>
              <g className="vg-eagle-wing vg-eagle-wing-right">
                <path fill="#4b271c" d="m244 12-64 52 25 4 39-20z" />
                <path fill="#bd806c" d="m240 56-38 15-24 28 48-16z" />
                <path fill="#d8c9aa" d="m225 89-49 14 8 28 40-22z" />
                <path fill="#c69a00" d="m179 72-47 43 37 18 28-31z" />
                <path fill="#e7a18b" d="m180 136-36-18-25 28 41 24z" />
                <path fill="#4b271c" d="m117 119-22 24 29 27 28-18z" />
                <path fill="#c69a00" d="m163 176-41-29-25 27 40 34z" />
                <path fill="#bd806c" d="m146 212-22-38-18 38 22 10z" />
              </g>
              <g className="vg-eagle-body">
                <path fill="#4b271c" d="m119 76 9-5 9 5 8 18-16-7-16 7z" />
                <path fill="#d8c9aa" d="m119 98 9-11 9 11 4 36-13 15-13-15z" />
                <path fill="#4b271c" d="m115 140 13 9 13-9-5 36-8 8-8-8z" />
                <path fill="#e7a18b" d="m137 80 18 4-13 8z" />
              </g>
            </g>
          </svg>
        </div>
        <p className="vg-loading-wordmark">VetoGrid</p>
        <p className="vg-loading-caption">Preparing Your Campus Experience...</p>
        <div className="vg-loading-track" aria-hidden="true">
          <span className="vg-loading-progress" />
        </div>
      </div>
    </main>
  );
}
