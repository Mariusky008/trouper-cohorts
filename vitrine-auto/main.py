import argparse
import asyncio

from vitrine_auto.pipeline import run_pipeline


def main():
  parser = argparse.ArgumentParser()
  parser.add_argument("--ville", default="Dax")
  parser.add_argument("--categorie", default="restaurant")
  parser.add_argument("--batch", type=int, default=5)
  parser.add_argument("--max-rating", type=float, default=3.5)
  parser.add_argument("--dry-run", action="store_true")
  args = parser.parse_args()

  asyncio.run(
    run_pipeline(
      ville=args.ville,
      categorie=args.categorie,
      batch_size=args.batch,
      max_rating=args.max_rating,
      dry_run=args.dry_run,
    )
  )


if __name__ == "__main__":
  main()
