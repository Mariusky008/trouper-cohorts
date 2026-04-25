import Link from "next/link";
import { Poppins } from "next/font/google";
import { cn } from "@/lib/utils";
import { LoginForm } from "@/app/login/login-form";

const poppins = Poppins({
  weight: ["400", "500", "600", "700", "900"],
  subsets: ["latin"],
  variable: "--font-poppins",
});

export default async function PopeyHumanLoginPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const defaultEmail = typeof params?.email === "string" ? params.email : "";
  const requestedNext = typeof params?.next === "string" ? params.next : "";
  const postLoginPath =
    requestedNext.startsWith("/popey-human/") && !requestedNext.startsWith("/popey-human/login")
      ? requestedNext
      : "/popey-human/app";

  return (
    <div className={cn("min-h-screen bg-black text-white px-4 py-8 md:py-12", poppins.variable, "font-poppins")}>
      <div className="mx-auto w-full max-w-md space-y-5">
        <Link
          href="/popey-human"
          className="inline-flex items-center justify-center rounded-md border border-white/20 bg-white/10 px-4 py-2 text-xs font-black uppercase tracking-wide text-white transition hover:bg-white hover:text-black"
        >
          Retour Popey Human
        </Link>

        <div className="rounded-2xl border border-white/15 bg-white/5 p-5 backdrop-blur">
          <p className="text-xs uppercase tracking-[0.14em] font-black text-[#B6FF2B]/90">Connexion</p>
          <h1 className="mt-1 text-3xl font-black leading-tight">Connexion Popey Human</h1>
          <p className="mt-2 text-sm text-white/75">
            Connectez-vous à votre espace privé Popey Human.
          </p>
          <div className="mt-4 rounded-xl border border-white/10 bg-black/25 p-3">
            <LoginForm
              defaultEmail={defaultEmail}
              isNetworkLogin
              postLoginPath={postLoginPath}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
