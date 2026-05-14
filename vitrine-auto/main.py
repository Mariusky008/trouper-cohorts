import argparse
import asyncio

from vitrine_auto.pipeline import run_pipeline, run_queue


def main():
  parser = argparse.ArgumentParser()
  parser.add_argument("--ville", default="Dax")
  parser.add_argument("--categorie", default="restaurant")
  parser.add_argument(
    "--queries",
    default="",
    help='Liste de requêtes séparées par des virgules (ex: "artisan,entreprise,plombier"). Si vide, utilise --categorie.',
  )
  parser.add_argument("--batch", type=int, default=5)
  parser.add_argument("--max-rating", type=float, default=3.5)
  parser.add_argument("--dry-run", action="store_true")
  parser.add_argument("--consume-queue", action="store_true")
  args = parser.parse_args()

  if args.consume_queue:
    asyncio.run(run_queue(batch_size=args.batch, dry_run=args.dry_run))
    return

  queries = [q.strip() for q in str(args.queries or "").split(",") if q.strip()]
  if not queries:
    queries = [args.categorie]

  asyncio.run(
    run_pipeline(
      ville=args.ville,
      categorie=args.categorie,
      queries=queries,
      batch_size=args.batch,
      max_rating=args.max_rating,
      dry_run=args.dry_run,
    )
  )


if __name__ == "__main__":
  main()
