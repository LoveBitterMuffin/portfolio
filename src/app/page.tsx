import MouseFollowVideo from '../components/MouseFollowVideo';

export default function Page() {
  return (
    <main className="w-screen h-screen flex flex-col overflow-hidden">

      {/* Header + Content area — place your content here */}
      <div className="flex-none px-6 pt-8 pb-4 z-20">
        {/* Header placeholder */}
        <nav className="flex items-center justify-between mb-6">
          <span className="text-white text-xl font-semibold tracking-tight">Portfolio</span>
          <div className="flex gap-6 text-sm text-white/60">
            <a href="#" className="hover:text-white transition-colors">Work</a>
            <a href="#" className="hover:text-white transition-colors">About</a>
            <a href="#" className="hover:text-white transition-colors">Contact</a>
          </div>
        </nav>

        {/* Content placeholder */}
        <div className="max-w-lg">
          <h1 className="text-4xl md:text-5xl font-bold text-white leading-tight mb-3">
            Creative Developer
          </h1>
          <p className="text-white/50 text-base md:text-lg">
            Interactive experiences &amp; digital design
          </p>
        </div>
      </div>

      {/* Video section — takes remaining space */}
      <div className="flex-1 min-h-0 relative overflow-hidden">
        <MouseFollowVideo />
      </div>

    </main>
  );
}
