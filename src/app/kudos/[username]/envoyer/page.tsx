import { KudosSendForm } from '../../_components/KudosSendForm'

type Props = { params: Promise<{ username: string }> }

export default async function KudosEnvoyerPage({ params }: Props) {
  const { username } = await params
  return <KudosSendForm username={username} />
}
