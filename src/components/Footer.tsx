export default function Footer() {
  return (
    <footer className="fixed bottom-0 left-0 right-0 z-40 bg-white/90 backdrop-blur-sm border-t border-[var(--color-garis)]">
      <div className="max-w-7xl mx-auto px-4 py-2 flex items-center justify-between gap-4">
        {/* Logo & Copyright */}
        <div className="flex items-center gap-2">
          <img src="/swarya-logo.png" alt="SWARYA KARANGANOM" className="h-6 w-auto" />
          <span className="text-[10px] sm:text-xs text-[var(--color-tinta-lembut)] font-semibold">
            © 2026 KKN PPM UGM SWARYA KARANGANOM
          </span>
        </div>

        {/* Contact Links */}
        <div className="flex items-center gap-3">
          <a
            href="mailto:swarya.karanganomugm@gmail.com"
            className="text-[var(--color-tinta-lembut)] hover:text-[var(--color-hutan)] transition"
            title="swarya.karanganomugm@gmail.com"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
              <polyline points="22,6 12,13 2,6"/>
            </svg>
          </a>
          <a
            href="https://www.instagram.com/swarya.karanganom"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[var(--color-tinta-lembut)] hover:text-[var(--color-hutan)] transition"
            title="@swarya.karanganom"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
              <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/>
              <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/>
            </svg>
          </a>
        </div>
      </div>
    </footer>
  );
}
