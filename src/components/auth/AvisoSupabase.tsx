export default function AvisoSupabase() {
  return (
    <div className="rounded-xl border border-primary/30 bg-primary-soft/40 p-3 text-sm text-dark">
      <strong>Modo demo:</strong> conecta un proyecto Supabase en{" "}
      <code className="rounded bg-white/60 px-1">.env.local</code> para activar el
      registro y el login. La interfaz ya está lista.
    </div>
  );
}
