export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white">Sales Training</h1>
          <p className="text-slate-400 mt-2">Plataforma de entrenamiento para comerciales</p>
        </div>
        {children}
      </div>
    </div>
  );
}
