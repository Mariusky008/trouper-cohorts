import type { Metadata } from "next"
import { notFound } from "next/navigation"
import SecretCohortsLanding from "@/app/secret-cohorts/secret-cohorts-landing"

export const metadata: Metadata = {
  title: "Cohorts — Sprint Créateur (Privé)",
  robots: { index: false, follow: false, nocache: true },
}

export default async function SecretCohortsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const params = await searchParams
  const providedKey = typeof params.key === "string" ? params.key : undefined
  const requiredKey = process.env.COHORTS_SECRET_KEY

  if (requiredKey && providedKey !== requiredKey) {
    notFound()
  }

  return <SecretCohortsLanding />
}
