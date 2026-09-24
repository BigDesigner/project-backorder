import React from "react";

export function Footer() {
  return (
    <footer className="py-8 px-4 border-t border-outline-variant/30 text-center text-xs text-on-surface-variant flex flex-col sm:flex-row items-center justify-between max-w-7xl mx-auto w-full mt-auto gap-3">
      <div className="flex items-center gap-2">
        <span className="w-1.5 h-1.5 rounded-full bg-primary-container"></span>
        <span>DomainPulse • Built for always-free serverless operations</span>
      </div>

      <div className="flex items-center gap-4 text-on-surface-variant font-label-code text-[11px]">
        <a
          href="https://github.com/BigDesigner/project-backorder"
          target="_blank"
          rel="noopener noreferrer"
          className="hover:text-primary-container transition-colors inline-flex items-center gap-1.5"
          aria-label="GitHub Repository"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            className="w-4 h-4 fill-current"
          >
            <path d="M12 .5C5.73.5.5 5.73.5 12c0 5.1 3.29 9.42 7.86 10.96.58.1.79-.25.79-.56v-2.02c-3.2.7-3.88-1.54-3.88-1.54-.53-1.35-1.29-1.71-1.29-1.71-1.06-.72.08-.71.08-.71 1.17.08 1.78 1.2 1.78 1.2 1.04 1.78 2.73 1.27 3.4.97.1-.75.41-1.27.74-1.56-2.56-.29-5.26-1.28-5.26-5.69 0-1.26.45-2.29 1.19-3.1-.12-.29-.52-1.47.11-3.06 0 0 .97-.31 3.18 1.18a11.1 11.1 0 0 1 5.8 0c2.2-1.49 3.17-1.18 3.17-1.18.63 1.59.23 2.77.11 3.06.74.81 1.19 1.84 1.19 3.1 0 4.42-2.7 5.4-5.27 5.69.42.36.79 1.07.79 2.16v3.2c0 .31.21.66.8.55A11.51 11.51 0 0 0 23.5 12C23.5 5.73 18.27.5 12 .5z" />
          </svg>
          <span>GitHub</span>
        </a>
      </div>
    </footer>
  );
}
