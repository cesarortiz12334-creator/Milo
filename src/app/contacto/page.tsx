import Link from "next/link";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import ContactoForm from "@/components/ContactoForm";

export const metadata = { title: "Contacto" };

export default function ContactoPage() {
  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="mx-auto max-w-xl px-4 py-12">
        <h1 className="font-heading text-3xl font-extrabold text-dark">
          Contáctanos
        </h1>
        <p className="mt-2 text-muted">
          ¿Dudas o algo que contarnos? Escríbenos y te respondemos.
        </p>

        <div className="mt-6 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-black/5">
          <ContactoForm />
        </div>

        <p className="mt-6 text-center text-sm text-muted">
          ¿Buscas una respuesta rápida? Revisa las{" "}
          <Link href="/faq" className="font-semibold text-primary">
            preguntas frecuentes
          </Link>
          .
        </p>
      </main>
      <SiteFooter />
    </div>
  );
}
