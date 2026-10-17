interface PageHeaderProps {
  title: string;
  subtitle?: string;
}

export function PageHeader({ title, subtitle }: PageHeaderProps) {
  return (
    <div className="relative py-16 md:py-24 bg-ze-neutral-950 overflow-hidden border-b border-ze-neutral-900">
      <div className="absolute inset-0 film-grain opacity-20 pointer-events-none" />
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-ze-gold-500/5 rounded-full blur-[120px] pointer-events-none" />
      
      <div className="container relative z-10 mx-auto px-4 text-center">
        <h1 className="text-4xl md:text-5xl lg:text-6xl font-heading font-bold text-white mb-4 uppercase tracking-wider">
          {title}
        </h1>
        {subtitle && (
          <p className="text-lg md:text-xl text-ze-neutral-400 max-w-2xl mx-auto font-sans">
            {subtitle}
          </p>
        )}
      </div>
    </div>
  );
}
