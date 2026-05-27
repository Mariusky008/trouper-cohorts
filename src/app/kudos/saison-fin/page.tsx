import { KudosSaisonFin } from '../_components/KudosSaisonFin'

export default async function KudosSaisonFinPage({
  searchParams,
}: {
  searchParams: Promise<{ season_id?: string }>
}) {
  const params = await searchParams
  return <KudosSaisonFin seasonId={params.season_id} />
}
