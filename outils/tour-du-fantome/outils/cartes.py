# 🗺️ LES CARTES DES DÉMOS ENTREPRENEURS (`tour-entrepreneurs.py`, `tour-entrepreneurs2.py`) : la France à grands
# traits et ses villes (Nina, qui envoie partout), Annecy et ses communes à 20 km (Claire, qui reçoit près de chez
# elle). Tout est projeté sur 1000 × 1000.
import math

# La France, à grands traits (longitude, latitude) ; la Corse à part.
CONTOUR = [(2.54, 51.09), (3.0, 50.8), (4.2, 50.3), (4.8, 50.15), (5.8, 49.55), (6.4, 49.47), (7.6, 49.05), (8.2, 48.97), (7.55, 47.6),
           (6.9, 47.4), (6.1, 46.55), (5.95, 46.15), (6.8, 46.0), (7.0, 45.3), (6.65, 44.85), (7.05, 44.2), (7.5, 43.78), (6.6, 43.15),
           (5.4, 43.2), (4.6, 43.4), (3.5, 43.27), (3.05, 42.6), (3.17, 42.43), (1.7, 42.5), (0.7, 42.8), (-0.75, 42.95), (-1.78, 43.37),
           (-1.25, 44.6), (-1.2, 45.7), (-2.2, 46.9), (-2.5, 47.3), (-3.4, 47.7), (-4.7, 47.8), (-4.75, 48.35), (-3.5, 48.8), (-2.0, 48.65),
           (-1.55, 48.65), (-1.95, 49.7), (-1.2, 49.35), (0.1, 49.45), (1.4, 50.05), (1.6, 50.8)]
CORSE = [(9.4, 43.0), (9.55, 42.1), (9.25, 41.4), (8.6, 41.9), (8.7, 42.6)]
VILLES = [("Lille", 3.06, 50.63), ("Paris", 2.35, 48.86), ("Rennes", -1.68, 48.11), ("Nantes", -1.55, 47.22), ("Bordeaux", -0.58, 44.84),
          ("Toulouse", 1.44, 43.60), ("Montpellier", 3.88, 43.61), ("Marseille", 5.37, 43.30), ("Nice", 7.26, 43.70), ("Lyon", 4.83, 45.76),
          ("Strasbourg", 7.75, 48.58), ("Dijon", 5.04, 47.32), ("Brest", -4.49, 48.39), ("Tours", 0.69, 47.39)]
NINA = (2.6, 46.6)          # son atelier, quelque part au milieu de la France
ANNECY = (6.129, 45.899)
# Autour d'Annecy (≈ 20 km) : la carte locale, centrée sur Claire. Le lac, à grands traits.
# (Épagny et Poisy, trop près d'Annecy, passaient sous son fantôme)
COMMUNES = [("Annecy", 6.129, 45.899), ("Frangy", 5.931, 46.019), ("Alby-sur-Chéran", 6.017, 45.817), ("Sévrier", 6.142, 45.865), ("Talloires", 6.214, 45.840),
            ("Rumilly", 5.944, 45.866), ("Thônes", 6.325, 45.882), ("Faverges", 6.293, 45.749), ("La Roche-sur-Foron", 6.311, 46.067), ("Cruseilles", 6.108, 46.034)]
LAC = [(6.140, 45.902), (6.150, 45.885), (6.165, 45.865), (6.185, 45.845), (6.200, 45.825), (6.215, 45.805), (6.230, 45.790), (6.236, 45.775),
       (6.225, 45.778), (6.205, 45.795), (6.183, 45.815), (6.163, 45.838), (6.145, 45.862), (6.133, 45.884)]
DEMI = 0.46                 # la demi-largeur de la carte locale, en degrés de latitude (≈ 51 km)


def fr(lon, lat):
    return round(30 + (lon + 5.2) * 0.688 * 93), round(40 + (51.2 - lat) * 93)


def lo(lon, lat):
    c = math.cos(math.radians(ANNECY[1]))
    return round(500 + (lon - ANNECY[0]) * c / DEMI * 1000), round(500 + (ANNECY[1] - lat) / DEMI * 1000)


def chemin(points, proj):
    return "M" + "L".join(f"{x} {y}" for x, y in (proj(*p) for p in points)) + "Z"


FRANCE = chemin(CONTOUR, fr) + chemin(CORSE, fr)
RAYON = round(0.18 / DEMI * 1000)   # 20 km
