# L'intro courte : les instants de chaque mot des répliques enregistrées (voix-intro/court/*.mp3).
# La réplique 5 (les voisins commerçants) n'est pas encore enregistrée : elle n'a pas d'entrée ici.
#   python3 -I mesurer-intro2.py <dossier>   (écrit voix-intro/court/temps.json)
import sys, json, os, subprocess
S = sys.argv[1]
NB = " "
TEXTES = {
    "intro-1": "Chaque jour, chez vous, il se passe quelque chose qui mérite d’être vu.",
    "intro-2": f"Qui a le temps de filmer, monter, publier et animer les réseaux sociaux{NB}?",
    "intro-2b": f"Pourtant, c’est essentiel{NB}: des vidéos partagées avec le cœur créent de la sympathie, et la sympathie crée la fidélité. Vos clients s’attachent à vous, naturellement.",
    "intro-3": "Moi, je suis votre fantôme. Je raconte à votre place.",
    "intro-4": "Et une histoire, ça se partage.",
    # « je fais réagir » (à la place de « …je sais surtout les raconter et créer l’envie de les partager »)
    "intro-4c": "Une belle vidéo, tout le monde sait en faire. Moi, je fais réagir.",
    "intro-4d": f"À la fin de votre vidéo, chacun libère son fantôme de sa cage. Et c’est là que mon vrai travail commence{NB}: je leur pose des questions, je les fais parler de vous.",
    "intro-4e": f"Sur Instagram, vous voyez qui a aimé. Mais écrire à chacun pour créer du lien, qui a le temps{NB}?",
    "intro-4f": "Moi, je le fais. Chacun par son prénom, au bon moment. Si bien que le jour où ils poussent votre porte, ils se sentent déjà comme des habitués.",
    # la transition du chapitre 1 au chapitre 2
    "intro-5a": "Voilà comment je vous amène des clients, et comment je les fais revenir. Maintenant, voyons comment je fais baisser vos dépenses.",
    "intro-5": "Vos voisins commerçants sont à deux pas, et vous n’en profitez pas. Avec moi, vous vous échangez vos produits et vos services.",
    "intro-6": "Regardons tout ça de plus près.",
}
# « Qui a le temps… » (la version avec « animer les réseaux sociaux ») : la voix étire « de… » avant « filmer »,
# et le repérage automatique place chaque mot un demi-temps trop tôt. Ses instants sont relevés à l'écoute
# (la phrase transcrite morceau par morceau, et les silences), dans l'ordre des mots du texte.
CALES = {"intro-2": [0.05, 0.18, 0.26, 0.32, 0.46, 1.0, 1.78, 2.56, 3.22, 3.44, 3.98, 4.04, 4.32]}
out = {}
for nom, texte in TEXTES.items():
    f = f"{S}/voix-intro/court/{nom}.mp3"
    if not os.path.exists(f):
        print(f"{nom} : pas encore enregistrée")
        continue
    r = subprocess.run(["python3", "-I", f"{S}/outils/aligner-voix.py", f"{S}/ffmpeg", f, texte, "0"], capture_output=True, text=True)
    if r.returncode:
        raise SystemExit(f"{nom} : {r.stderr[-500:]}")
    out[nom] = json.loads(r.stdout)
    if nom in CALES:
        assert len(CALES[nom]) == len(texte.split(" ")), (nom, len(CALES[nom]))
        out[nom]["m"] = CALES[nom]
    mots = texte.split(" ")
    assert len(mots) == len(out[nom]["m"]), (nom, len(mots), len(out[nom]["m"]))
    print(f"{nom} {out[nom]['d']:.2f}s  " + " ".join(f"{w}@{t}" for w, t in zip(mots, out[nom]["m"])))
json.dump({"textes": TEXTES, "temps": out}, open(f"{S}/voix-intro/court/temps.json", "w", encoding="utf-8"), ensure_ascii=False)
