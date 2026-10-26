# 🎨 LES DESSINS COMMUNS AUX DÉMOS DU NOUVEAU MOTEUR (`tour-court2.py`, `tour-entrepreneurs2.py`) : la toque du chef,
# les petites cages dorées de la fin de la vidéo.

# la toque du chef (`I_TOQUE` de tour-intro3.py), un identifiant par copie
TOQUE = ('<svg class="toque" viewBox="0 0 100 80" aria-hidden="true"><defs><radialGradient id="@1" cx="40%" cy="30%" r="75%"><stop offset="0" stop-color="#fff"/>'
         '<stop offset=".6" stop-color="#F4F1EC"/><stop offset="1" stop-color="#D9D2C8"/></radialGradient><linearGradient id="@2" x1="0" x2="1"><stop offset="0" stop-color="#DCD5CB"/>'
         '<stop offset=".3" stop-color="#fff"/><stop offset=".7" stop-color="#F7F4EF"/><stop offset="1" stop-color="#CFC7BB"/></linearGradient></defs>'
         '<g fill="url(#@1)"><circle cx="24" cy="36" r="18"/><circle cx="76" cy="36" r="18"/><circle cx="38" cy="22" r="20"/><circle cx="62" cy="22" r="20"/><circle cx="50" cy="30" r="22"/></g>'
         '<path d="M50 6c-4 8-4 22 0 34M33 12c-2 9 0 20 4 28M67 12c2 9 0 20-4 28" stroke="#D8D0C4" stroke-width="1" fill="none" opacity=".7"/>'
         '<path d="M11 44Q50 38 89 44L92 79Q50 70 8 79Z" fill="url(#@2)"/><path d="M11 44Q50 38 89 44" stroke="#E2DBD0" stroke-width="1.2" fill="none"/>'
         '<path d="M24 43V74M37 41.5V71M50 41V70M63 41.5V71M76 43V74" stroke="#E4DED4" stroke-width=".9"/></svg>')
_n = [0]


def toque():
    _n[0] += 1
    return TOQUE.replace("@1", f"tq{_n[0]}a").replace("@2", f"tq{_n[0]}b")


def cage_mini(couleur, premiere):
    """Une petite cage dorée (pour la fin de sa vidéo), sa porte à part pour qu'elle s'ouvre."""
    defs = '<defs><clipPath id="dm"><path d="M10 200V96C10 42 42 14 75 14S140 42 140 96V200Z"/></clipPath></defs>' if premiere else ""
    return (f'<svg viewBox="0 0 150 220" aria-hidden="true">{defs}'
            '<path d="M10 200V96C10 42 42 14 75 14S140 42 140 96V200Z" fill="rgba(255,235,210,.05)"/>'
            '<g clip-path="url(#dm)" fill="url(#orb)"><rect x="30" y="0" width="5" height="210"/><rect x="52" y="0" width="5" height="210"/><rect x="93" y="0" width="5" height="210"/><rect x="115" y="0" width="5" height="210"/></g>'
            '<rect x="8" y="92" width="134" height="7" rx="3" fill="url(#or)"/>'
            '<path d="M10 200V96C10 42 42 14 75 14S140 42 140 96V200" fill="none" stroke="url(#or)" stroke-width="7"/>'
            '<circle cx="75" cy="7" r="7" fill="none" stroke="url(#or)" stroke-width="4"/>'
            f'<g fill="{couleur}"><ellipse cx="65" cy="20" rx="11" ry="6"/><ellipse cx="85" cy="20" rx="11" ry="6"/><circle cx="75" cy="20" r="5"/></g>'
            '<g class="porte-tc"><path d="M52 200V146C52 130 62 120 75 120S98 130 98 146V200" fill="rgba(30,15,20,.15)" stroke="url(#or)" stroke-width="5"/><rect x="73" y="122" width="4" height="78" fill="url(#orb)"/></g>'
            f'<rect x="2" y="196" width="146" height="22" rx="9" fill="url(#or)"/><rect x="6" y="210" width="138" height="6" rx="3" fill="{couleur}"/></svg>')
