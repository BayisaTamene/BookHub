
export default function Footer() {
  return (
    <footer className="bg-slate-900 px-6 py-12 text-slate-300">
      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-4">

        {/* Brand */}
        <div>
          <h2 className="mb-4 text-2xl font-bold text-white">
            BookHub
          </h2>

          <p className="max-w-xs text-sm leading-relaxed text-slate-400">
            Your destination for discovering, exploring,
            and enjoying great books.
          </p>
        </div>

        {/* Quick Links */}
        <div>
          <h3 className="mb-4 font-semibold text-white">
            Quick Links
          </h3>

          <ul className="space-y-3 text-sm">
            <li><a href="/" className="transition hover:text-white">Home</a></li>
            <li><a href="/books" className="transition hover:text-white">Books</a></li>
            <li><a href="/categories" className="transition hover:text-white">Categories</a></li>
            <li><a href="/about" className="transition hover:text-white">About Us</a></li>
          </ul>
        </div>

        {/* Support */}
        <div>
          <h3 className="mb-4 font-semibold text-white">
            Support
          </h3>

          <ul className="space-y-3 text-sm">
            <li><a href="/contact" className="transition hover:text-white">Contact Us</a></li>
            <li><a href="/faq" className="transition hover:text-white">FAQs</a></li>
            <li><a href="/privacy" className="transition hover:text-white">Privacy Policy</a></li>
          </ul>
        </div>

        {/* Contact */}
        <div>
          <h3 className="mb-4 font-semibold text-white">
            Get in Touch
          </h3>

          <p className="text-sm text-slate-400">
            Have questions or suggestions?
            We'd love to hear from you.
          </p>
        </div>

      </div>

      {/* Copyright */}
      <div className="mx-auto mt-12 max-w-7xl border-t border-slate-700 pt-6 text-center text-sm text-slate-500">
        © {new Date().getFullYear()} BookHub. All rights reserved.
      </div>
    </footer>
  );
}
