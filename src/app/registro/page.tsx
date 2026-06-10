import Link from "next/link";
import AuthShell from "@/components/auth/AuthShell";

const roles = [
  {
    href: "/registro/donante",
    externo: false,
    emoji: "💛",
    titulo: "Soy donante",
    desc: "Quiero ayudar a financiar la atención de mascotas vulnerables.",
  },
  {
    href: "/registro/veterinaria",
    externo: false,
    emoji: "🏥",
    titulo: "Soy veterinaria",
    desc: "Clínica que atiende los casos. Requiere verificación del equipo Milo.",
  },
  {
    href: "/api/auth/clave-unica/inicio",
    externo: true,
    emoji: "🐾",
    titulo: "Soy solicitante",
    desc: "Necesito ayuda para mi mascota. Ingreso con Clave Única.",
  },
];

export default function RegistroPage() {
  return (
    <AuthShell
      titulo="Crear cuenta en Milo"
      subtitulo="Elige cómo quieres participar."
    >
      <ul className="space-y-3">
        {roles.map((r) => {
          const contenido = (
            <>
              <span className="text-2xl" aria-hidden="true">
                {r.emoji}
              </span>
              <span>
                <span className="block font-heading font-bold text-dark">
                  {r.titulo}
                </span>
                <span className="block text-sm text-muted">{r.desc}</span>
              </span>
            </>
          );
          const clase =
            "flex items-start gap-3 rounded-xl border border-black/10 p-4 transition hover:border-primary/50 hover:bg-primary-soft/20";
          return (
            <li key={r.titulo}>
              {r.externo ? (
                <a href={r.href} className={clase}>
                  {contenido}
                </a>
              ) : (
                <Link href={r.href} className={clase}>
                  {contenido}
                </Link>
              )}
            </li>
          );
        })}
      </ul>

      <p className="text-center text-sm text-muted">
        ¿Ya tienes cuenta?{" "}
        <Link href="/login" className="font-semibold text-primary">
          Ingresar
        </Link>
      </p>
    </AuthShell>
  );
}
