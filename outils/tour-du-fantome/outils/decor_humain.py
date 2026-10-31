"""Les décors dessinés de la démo humaine (`tour-humain.py`) : le sceau de sa carte, la façade de Chez Bergine (le
soir, accueillante), la cage dorée et son cadeau. Tout en SVG, sans image : net à toutes les tailles, et rendu à
l'identique dans la vidéo (`demo.mp4`)."""
import math
import random


def _arc_cercle(cx, cy, r):
    # un cercle complet, parcouru dans le sens des aiguilles d'une montre depuis la gauche (pour un texte en rond)
    return f"M{cx - r:.1f},{cy:.1f} A{r},{r} 0 1,1 {cx + r:.1f},{cy:.1f} A{r},{r} 0 1,1 {cx - r:.1f},{cy:.1f}"


def _laurier(cx, cy, r, de, a, n, sens, couleur):
    # une branche de laurier le long d'un arc (angles en degrés, 90 = en bas) : des feuilles en amande, alternées
    s = []
    for k in range(n):
        t = de + (a - de) * k / (n - 1)
        th = math.radians(t)
        x, y = cx + r * math.cos(th), cy + r * math.sin(th)
        tangente = t + 90 * sens
        for cote in (-1, 1):
            rot = tangente + cote * 38
            dx, dy = 6 * math.cos(math.radians(rot)), 6 * math.sin(math.radians(rot))
            s.append(f'<ellipse cx="{x + dx:.1f}" cy="{y + dy:.1f}" rx="7" ry="2.9" transform="rotate({rot:.0f} {x + dx:.1f} {y + dy:.1f})" fill="{couleur}"/>')
    return "".join(s)


def sceau():
    """Le sceau doré de sa carte : « Meilleur community manager · édition 2026 », « Lauréat », des lauriers, deux rubans
    — sérieux, pour faire vrai (le « *par sa mère » qui tombe dessus n'en est que plus drôle)."""
    cx, cy = 110, 112
    dents = " ".join(f"{cx + (101 if k % 2 == 0 else 93) * math.cos(k * math.pi / 30):.1f},{cy + (101 if k % 2 == 0 else 93) * math.sin(k * math.pi / 30):.1f}"
                     for k in range(60))
    return (
        '<svg viewBox="0 0 220 300" aria-hidden="true"><defs>'
        '<linearGradient id="sc-or" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#8A6514"/><stop offset=".28" stop-color="#F2D27A"/>'
        '<stop offset=".45" stop-color="#FFF4C4"/><stop offset=".62" stop-color="#D6A73E"/><stop offset="1" stop-color="#7A560F"/></linearGradient>'
        '<radialGradient id="sc-coeur" cx=".42" cy=".38" r=".7"><stop offset="0" stop-color="#FFF6D2"/><stop offset=".55" stop-color="#E6BF5C"/><stop offset="1" stop-color="#A47A1E"/></radialGradient>'
        '<linearGradient id="sc-ruban" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#5A0B1E"/><stop offset=".5" stop-color="#A3163A"/><stop offset="1" stop-color="#5A0B1E"/></linearGradient>'
        f'<path id="sc-rond" d="{_arc_cercle(cx, cy, 77)}"/></defs>'
        # les deux rubans, avec leur liseré doré, coupés en V
        '<g><path d="M76 170 46 292 70 274 92 298 116 182z" fill="url(#sc-ruban)"/><path d="M76 170 46 292M116 182 92 298" stroke="#E8C267" stroke-width="3" fill="none"/>'
        '<path d="M144 170 174 292 150 274 128 298 104 182z" fill="url(#sc-ruban)"/><path d="M144 170 174 292M104 182 128 298" stroke="#E8C267" stroke-width="3" fill="none"/></g>'
        # le disque dentelé, ses anneaux, le texte en rond
        f'<polygon points="{dents}" fill="url(#sc-or)" stroke="#6E4E0C" stroke-width="1.5"/>'
        f'<circle cx="{cx}" cy="{cy}" r="88" fill="none" stroke="#6E4E0C" stroke-width="2.5"/><circle cx="{cx}" cy="{cy}" r="85" fill="none" stroke="#FFF1B8" stroke-width="1.2" opacity=".8"/>'
        f'<circle cx="{cx}" cy="{cy}" r="66" fill="url(#sc-coeur)" stroke="#6E4E0C" stroke-width="2"/>'
        '<text font-family="Poppins,sans-serif" font-weight="800" font-size="12.5" fill="#4E3606" letter-spacing="1.2">'
        '<textPath href="#sc-rond" startOffset="2" textLength="470" lengthAdjust="spacing">MEILLEUR COMMUNITY MANAGER • ÉDITION 2026 •</textPath></text>'
        # les lauriers, l'étoile, « LAURÉAT », l'année
        + _laurier(cx, cy, 51, 108, 238, 9, 1, "#7A560F") + _laurier(cx, cy, 51, 72, -58, 9, -1, "#7A560F")
        + f'<path d="M{cx} {cy - 44} l5.6 11.4 12.6 1.8-9.1 8.9 2.1 12.5-11.2-5.9-11.2 5.9 2.1-12.5-9.1-8.9 12.6-1.8z" fill="#7A560F"/>'
        f'<text x="{cx}" y="{cy + 13}" text-anchor="middle" font-family="Poppins,sans-serif" font-weight="900" font-size="17" letter-spacing="1.2" fill="#4E3606">LAURÉAT</text>'
        f'<text x="{cx}" y="{cy + 36}" text-anchor="middle" font-family="Poppins,sans-serif" font-weight="800" font-size="15" letter-spacing="3" fill="#4E3606">2026</text>'
        # un reflet en haut à gauche (le métal embouti)
        f'<path d="M{cx - 78} {cy - 30} A84 84 0 0 1 {cx + 14} {cy - 83}" stroke="#FFFBE6" stroke-width="3" fill="none" opacity=".55" stroke-linecap="round"/>'
        "</svg>"
    )


# ─── LA FAÇADE, LE SOIR : ce qui la rend accueillante (posé par-dessus la façade, dans ses coordonnées : 1000 × 1194) ──
L, H = 1000, 1194


def _ampoule(x, y, k):
    return (f'<g class="amp"><circle cx="{x:.0f}" cy="{y:.0f}" r="44" fill="url(#fa-halo)"/>'
            f'<path d="M{x - 5:.0f} {y - 20:.0f}h10v7h-10z" fill="#3A2A20"/><ellipse cx="{x:.0f}" cy="{y:.0f}" rx="11" ry="14" fill="url(#fa-amp)"/></g>')


def facade_decor():
    """La guirlande d'ampoules sous le store, deux appliques sur l'enseigne (et leur lumière), la jardinière fleurie sous
    la vitrine, deux plantes en pot de part et d'autre de la porte, le paillasson « Bienvenue », la lumière chaude
    sur les pavés."""
    r = random.Random(11)
    s = ['<svg class="fac-deco" viewBox="0 0 1000 1194" aria-hidden="true"><defs>'
         '<radialGradient id="fa-halo"><stop offset="0" stop-color="#FFD58A" stop-opacity=".75"/><stop offset=".45" stop-color="#FFB45E" stop-opacity=".25"/><stop offset="1" stop-color="#FFB45E" stop-opacity="0"/></radialGradient>'
         '<radialGradient id="fa-amp" cx=".4" cy=".35"><stop offset="0" stop-color="#FFFDF0"/><stop offset=".55" stop-color="#FFD27A"/><stop offset="1" stop-color="#E9902E"/></radialGradient>'
         '<linearGradient id="fa-cone" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FFE3A6" stop-opacity=".55"/><stop offset="1" stop-color="#FFE3A6" stop-opacity="0"/></linearGradient>'
         '<linearGradient id="fa-pot" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#7A3B1E"/><stop offset=".45" stop-color="#C46A3A"/><stop offset="1" stop-color="#6A3018"/></linearGradient>'
         '<radialGradient id="fa-buis" cx=".38" cy=".32"><stop offset="0" stop-color="#7FB45A"/><stop offset=".6" stop-color="#3F7A34"/><stop offset="1" stop-color="#1F4A22"/></radialGradient>'
         '<linearGradient id="fa-bac" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#5A3A22"/><stop offset="1" stop-color="#2E1C10"/></linearGradient>'
         "</defs>"]
    # les appliques : un bras courbé, un abat-jour, et le cône de lumière sur l'enseigne
    for x in (230, 770):
        s.append(f'<path d="M{x} 6 q0 26 -22 30" stroke="#2A1A12" stroke-width="5" fill="none" stroke-linecap="round"/>'
                 f'<polygon points="{x - 40},44 {x - 4},44 {x - 22 + 70},190 {x - 22 - 70},190" fill="url(#fa-cone)"/>'
                 f'<path d="M{x - 42} 46 q20 -20 40 0z" fill="#C9A45C" stroke="#7A5A22" stroke-width="2"/><ellipse cx="{x - 22}" cy="47" rx="14" ry="4" fill="#FFF3C8"/>')
    # la guirlande : un fil en chaînette sous le store, onze ampoules qui pendent
    pts = []
    for k in range(12):
        u = k / 11
        x = 40 + u * 920
        y = 300 + 22 * (1 - (2 * u - 1) ** 2)
        pts.append((x, y))
    s.append('<path d="M' + " L".join(f"{x:.0f},{y:.0f}" for x, y in pts) + '" stroke="#24160F" stroke-width="2.5" fill="none"/>')
    for k, (x, y) in enumerate(pts[:-1]):
        mx, my = (x + pts[k + 1][0]) / 2, (y + pts[k + 1][1]) / 2 + 2
        s.append(f'<path d="M{mx:.0f} {my:.0f}v6" stroke="#24160F" stroke-width="2"/>' + _ampoule(mx, my + 22, k))
    # la jardinière sous la vitrine : le bac, le feuillage, les fleurs, le lierre qui retombe
    s.append('<rect x="38" y="752" width="604" height="40" rx="6" fill="url(#fa-bac)" stroke="#1E120A" stroke-width="2"/>')
    for k in range(70):
        x, y = 46 + r.random() * 588, 744 + r.random() * 14
        s.append(f'<ellipse cx="{x:.0f}" cy="{y:.0f}" rx="{10 + r.random() * 8:.0f}" ry="{6 + r.random() * 5:.0f}" fill="{r.choice(["#2F6B2E", "#3F8A3A", "#4E9B45", "#285A28"])}" '
                 f'transform="rotate({r.random() * 180:.0f} {x:.0f} {y:.0f})"/>')
    for k in range(9):
        x = 60 + k * 70 + r.random() * 20
        s.append(f'<path d="M{x:.0f} 790 q{r.random() * 16 - 8:.0f} 26 {r.random() * 10 - 5:.0f} {40 + r.random() * 34:.0f}" stroke="#2F6B2E" stroke-width="4" fill="none" stroke-linecap="round"/>')
    for k in range(34):
        x, y = 50 + r.random() * 580, 728 + r.random() * 20
        c = r.choice(["#FF5DB8", "#FF3B5C", "#FFFFFF", "#FFB347", "#E0167A"])
        s.append("".join(f'<circle cx="{x + 5 * math.cos(a):.1f}" cy="{y + 5 * math.sin(a):.1f}" r="4.2" fill="{c}"/>' for a in (0, 1.26, 2.51, 3.77, 5.03))
                 + f'<circle cx="{x:.1f}" cy="{y:.1f}" r="3" fill="#FFD84D"/>')
    # deux buis en pot, de part et d'autre de la porte
    for x in (667, 970):
        s.append(f'<path d="M{x - 22} 760 h44 l-6 38 h-32z" fill="url(#fa-pot)"/><rect x="{x - 25}" y="754" width="50" height="9" rx="3" fill="#8A4424"/>'
                 f'<path d="M{x} 754 v-22" stroke="#4A2E18" stroke-width="5"/><circle cx="{x}" cy="708" r="34" fill="url(#fa-buis)"/>'
                 f'<circle cx="{x - 10}" cy="696" r="8" fill="#9CCB6E" opacity=".45"/>')
    # le paillasson devant la porte
    s.append('<rect x="726" y="796" width="188" height="30" rx="7" fill="#6B4A2A" stroke="#3E2A16" stroke-width="2"/>'
             '<text x="820" y="818" text-anchor="middle" font-family="Playfair Display,Georgia,serif" font-style="italic" font-weight="700" font-size="20" fill="#F2D49A">Bienvenue</text>')
    s.append("</svg>")
    return "".join(s)


def ardoise(petit="Aujourd’hui", titre="Garbure<br>landaise", sous="& magret", prix="19 €"):
    """L'ardoise du menu (ou de l'atelier), posée sur le trottoir (écrite à la craie : la police « Caveat »)."""
    return ('<div class="fac-ardoise" aria-hidden="true"><svg viewBox="0 0 170 240"><path d="M18 236 40 20h90l22 216" stroke="#5A3A22" stroke-width="9" fill="none" stroke-linecap="round"/>'
            '<rect x="24" y="14" width="122" height="150" rx="8" fill="#5A3A22"/><rect x="31" y="21" width="108" height="136" rx="4" fill="#20262A"/></svg>'
            f'<div><small>{petit}</small><b>{titre}</b><em>{sous}</em><strong>{prix}</strong></div></div>')


# ─── LA CAGE DORÉE ET SA SURPRISE ────────────────────────────────────────────────────────────────────────────────────
def cage_or():
    """Une cage d'or ouvragée (dôme, barreaux, anneaux, socle, coussin de velours) et, dedans, un cadeau enrubanné
    (`#dor-cadeau` : son couvercle `#dor-couvercle` saute quand la porte `.porte-tc` s'ouvre). Les barreaux du fond
    passent derrière le cadeau, ceux de devant par-dessus."""
    cx, R, haut, bas = 210, 150, 250, 520

    def dome(x):
        return haut - math.sqrt(max(0, R * R - (x - cx) ** 2))

    defs = ('<defs><linearGradient id="co-bar" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#8A6514"/><stop offset=".4" stop-color="#FFE7A0"/>'
            '<stop offset="1" stop-color="#A97A1E"/></linearGradient>'
            '<linearGradient id="co-or" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#7A560F"/><stop offset=".3" stop-color="#F2D27A"/><stop offset=".5" stop-color="#FFF4C4"/>'
            '<stop offset=".7" stop-color="#D6A73E"/><stop offset="1" stop-color="#6E4E0C"/></linearGradient>'
            '<radialGradient id="co-velours" cx=".45" cy=".35"><stop offset="0" stop-color="#E0167A"/><stop offset="1" stop-color="#6A0A36"/></radialGradient>'
            '<linearGradient id="ca-boite" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#C2126B"/><stop offset=".35" stop-color="#FF5DB8"/><stop offset=".6" stop-color="#FF3D9E"/>'
            '<stop offset="1" stop-color="#A30E5A"/></linearGradient>'
            '<linearGradient id="ca-ruban" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#B88A2A"/><stop offset=".5" stop-color="#FFF0B0"/><stop offset="1" stop-color="#B88A2A"/></linearGradient>'
            '<radialGradient id="ca-eclat"><stop offset="0" stop-color="#FFF8DC" stop-opacity=".95"/><stop offset=".5" stop-color="#FFD27A" stop-opacity=".4"/><stop offset="1" stop-color="#FFD27A" stop-opacity="0"/></radialGradient>'
            "</defs>")
    fond = []   # derrière le cadeau : la moitié arrière des anneaux, les barreaux du fond (plus sombres, plus fins)
    for y, ry in ((haut, 20), (385, 20), (bas, 24)):
        fond.append(f'<path d="M{cx - R} {y} A{R} {ry} 0 0 1 {cx + R} {y}" stroke="#8A6514" stroke-width="5" fill="none" opacity=".75"/>')
    for k in range(10):
        x = cx - R + 15 + k * 30
        fond.append(f'<path d="M{x:.0f} {dome(x):.0f} V{bas}" stroke="#9A7420" stroke-width="3.5" opacity=".7"/>')
    fond.append(f'<ellipse cx="{cx}" cy="{bas - 6}" rx="118" ry="20" fill="url(#co-velours)"/>')
    cadeau = ('<g id="dor-cadeau"><ellipse cx="210" cy="512" rx="78" ry="10" fill="#000" opacity=".35"/>'
              '<circle id="dor-eclat" cx="210" cy="400" r="150" fill="url(#ca-eclat)" opacity="0"/>'
              '<rect x="142" y="410" width="136" height="100" rx="8" fill="url(#ca-boite)"/>'
              '<rect x="198" y="410" width="24" height="100" fill="url(#ca-ruban)"/>'
              '<rect x="148" y="414" width="18" height="90" rx="6" fill="#fff" opacity=".18"/>'
              '<g id="dor-couvercle"><rect x="132" y="384" width="156" height="32" rx="7" fill="url(#ca-boite)"/><rect x="198" y="384" width="24" height="32" fill="url(#ca-ruban)"/>'
              '<rect x="132" y="384" width="156" height="8" rx="4" fill="#fff" opacity=".22"/>'
              '<path d="M210 386 C180 350 150 362 168 384 Z" fill="url(#ca-ruban)" stroke="#9A7420" stroke-width="2"/>'
              '<path d="M210 386 C240 350 270 362 252 384 Z" fill="url(#ca-ruban)" stroke="#9A7420" stroke-width="2"/>'
              '<circle cx="210" cy="384" r="10" fill="#E8C267" stroke="#9A7420" stroke-width="2"/></g></g>')
    devant = []  # par-dessus : les barreaux de devant, la moitié avant des anneaux, le dôme, l'anneau du haut, le socle
    for k in range(11):
        x = cx - R + k * 30
        if 165 <= x <= 255:
            continue   # (ceux de la porte : à part)
        devant.append(f'<path d="M{x:.0f} {dome(x):.0f} V{bas}" stroke="url(#co-bar)" stroke-width="7" stroke-linecap="round"/>')
    porte = ['<g class="porte-tc">']
    for x in (180, 210, 240):
        porte.append(f'<path d="M{x} 300 V{bas - 4}" stroke="url(#co-bar)" stroke-width="7" stroke-linecap="round"/>')
    porte.append(f'<rect x="168" y="296" width="84" height="{bas - 300}" rx="6" fill="none" stroke="url(#co-or)" stroke-width="7"/>'
                 '<circle cx="246" cy="410" r="7" fill="#FFF0B0" stroke="#8A6514" stroke-width="2"/></g>')
    for y, ry in ((haut, 20), (385, 20)):
        devant.append(f'<path d="M{cx - R} {y} A{R} {ry} 0 0 0 {cx + R} {y}" stroke="url(#co-or)" stroke-width="9" fill="none"/>')
    devant.append(f'<path d="M{cx - R} {haut} A{R} {R} 0 0 1 {cx + R} {haut}" stroke="url(#co-or)" stroke-width="10" fill="none"/>')
    devant.append(f'<circle cx="{cx}" cy="{haut - R - 4}" r="14" fill="url(#co-or)"/><circle cx="{cx}" cy="{haut - R - 40}" r="22" fill="none" stroke="url(#co-or)" stroke-width="8"/>')
    devant.append(f'<path d="M{cx - 168} {bas} A168 26 0 0 0 {cx + 168} {bas} V{bas + 44} A168 26 0 0 1 {cx - 168} {bas + 44}Z" fill="url(#co-or)"/>'
                  f'<ellipse cx="{cx}" cy="{bas}" rx="168" ry="26" fill="none" stroke="#FFF4C4" stroke-width="3" opacity=".8"/>'
                  + "".join(f'<circle cx="{cx - 150 + k * 30}" cy="{bas + 30 + 6 * math.sin(k / 10 * math.pi)}" r="4" fill="#7A560F" opacity=".7"/>' for k in range(11)))
    return ('<svg viewBox="0 0 420 616" aria-hidden="true">' + defs + "".join(fond) + cadeau + "".join(devant) + "".join(porte) + "</svg>")
