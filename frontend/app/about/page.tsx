import Link from "next/link";
import Image from "next/image";

export default function AboutPage() {
  return (
    <main className="min-h-screen gradient-soft">
      {/* Header */}
      <div className="bg-white border-b border-primary-100 shadow-sm">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between relative">
            {/* Back to Home - Left */}
            <Link
              href="/"
              className="px-4 py-2 bg-white border border-primary-200 text-pine-700 hover:bg-primary-50 rounded-lg transition-colors text-sm font-medium"
            >
              ← Home
            </Link>

            {/* Title - Center */}
            <div className="absolute left-1/2 transform -translate-x-1/2">
              <h1 className="text-4xl font-bold bg-gradient-to-r from-primary-600 to-secondary-500 bg-clip-text text-transparent">
                About Me
              </h1>
            </div>

            {/* Explore Books - Right */}
            <Link
              href="/search"
              className="px-6 py-2.5 bg-gradient-to-r from-primary-600 to-secondary-500 text-white hover:from-primary-700 hover:to-secondary-600 rounded-lg transition-all text-sm font-semibold shadow-sm"
            >
              Explore Books
            </Link>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-2xl mx-auto space-y-8">
          {/* Photo + Name */}
          <div className="flex flex-col items-center">
            <Image
              src="/profile.jpg"
              alt="Blanca"
              width={144}
              height={144}
              quality={100}
              priority
              className="w-36 h-36 rounded-full object-cover mb-4"
            />
            <h2 className="text-2xl font-bold text-pine-900">Blanca</h2>
            <p className="text-pine-600 font-medium">software engineer</p>
          </div>

          {/* Bio */}
          <div className="bg-white rounded-xl shadow-card p-6 border border-primary-100">
            <h3 className="text-lg font-semibold text-pine-800 mb-3">Bio</h3>
            <p className="text-pine-700 leading-relaxed mb-3">
              Hi, my name is Blanca 👋🏽 I read every day and love to discover new
              books.{" "}
            </p>

            <p className="text-pine-700 leading-relaxed mb-3">
              My favorite way of organizing my reading is by making lists. I've
              often wished there was the ability to make some cool lists and
              share them with other readers.{" "}
            </p>

            <p className="text-pine-700 leading-relaxed mb-3">
              So, I created my very own reading tracker. I call it Curio.{" "}
            </p>

            <p className="text-pine-700 leading-relaxed mb-3">
              Curio allows for book list curations. They are shareable and fun!
              Who wouldn't like to come across a list like 'books that would be
              impossible to make into a movie', 'favorite sci-fi's', or 'my
              Stephen King's ranked'.{" "}
            </p>

            <p className="text-pine-700 leading-relaxed mb-3">
              My app is a work in progress! I'm currently working on user
              profiles, curating my library, and some more fun features.
            </p>
          </div>

          {/* Links */}
          <div className="bg-white rounded-xl shadow-card p-6 border border-primary-100">
            <h3 className="text-lg font-semibold text-pine-800 mb-3">Links</h3>
            <div className="space-y-2">
              <a
                href="https://www.linkedin.com/in/blancasprofile/"
                target="_blank"
                rel="noopener noreferrer"
                className="block px-4 py-2.5 rounded-lg bg-primary-50 hover:bg-primary-100 text-primary-800 text-sm font-medium transition-colors"
              >
                LinkedIn ↗
              </a>
              <a
                href="https://instagram.com/blancasbookshelf"
                target="_blank"
                rel="noopener noreferrer"
                className="block px-4 py-2.5 rounded-lg bg-primary-50 hover:bg-primary-100 text-primary-800 text-sm font-medium transition-colors"
              >
                Bookstagram ↗
              </a>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
