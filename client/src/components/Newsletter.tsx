
export default function Newsletter() {
  return (
    <section className="bg-indigo-600 px-6 py-20">
      <div className="mx-auto max-w-4xl text-center">

        <h2 className="mb-4 text-3xl font-bold text-white md:text-4xl">
          Stay Updated with BookHub
        </h2>

        <p className="mx-auto mb-8 max-w-2xl text-indigo-100">
          Subscribe to our newsletter and receive updates
          about new books, recommendations, and special offers.
        </p>

        <form className="mx-auto flex max-w-xl flex-col gap-3 sm:flex-row">
          <input
            type="email"
            placeholder="Enter your email address"
            className="min-w-0 flex-1 rounded-lg bg-white px-5 py-3 text-slate-900 outline-none focus:ring-2 focus:ring-indigo-300"
          />

          <button
            type="submit"
            className="rounded-lg bg-slate-900 px-6 py-3 font-semibold text-white transition hover:bg-slate-800"
          >
            Subscribe
          </button>
        </form>

      </div>
    </section>
  );
}
