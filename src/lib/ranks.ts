import { Shield, Medal, Star, Trophy, Crown, Swords, Target, Zap, Flag, Award } from "lucide-react"

export const RANKS = [
  { level: 1, name: "Soldat", minPoints: 0, benefit: "Accès Lecture", icon: Shield, color: "text-slate-500" },
  { level: 2, name: "Caporal", minPoints: 60, benefit: "Accès Lecture", icon: Shield, color: "text-slate-600" },
  { level: 3, name: "Sergent", minPoints: 120, benefit: "Accès Lecture", icon: Medal, color: "text-blue-500" },
  { level: 4, name: "Adjudant", minPoints: 180, benefit: "Accès Lecture", icon: Medal, color: "text-blue-600" },
  { level: 5, name: "Major", minPoints: 240, benefit: "Accès Lecture", icon: Star, color: "text-indigo-500" },
  { level: 6, name: "Lieutenant", minPoints: 300, benefit: "⚡️ CRÉATION DUO (1 invité)", icon: Swords, color: "text-purple-500" },
  { level: 7, name: "Capitaine", minPoints: 360, benefit: "⚡️ CRÉATION TRIO (2 invités)", icon: Target, color: "text-purple-600" },
  { level: 8, name: "Commandant", minPoints: 420, benefit: "⚡️ TABLE RONDE (3 invités)", icon: Zap, color: "text-pink-500" },
  { level: 9, name: "Colonel", minPoints: 480, benefit: "⚡️ RAID CRÉATIF (4 invités)", icon: Flag, color: "text-red-500" },
  { level: 10, name: "Général", minPoints: 540, benefit: "⚡️ DOCUMENTAIRE (5 invités)", icon: Award, color: "text-orange-500" },
  { level: 11, name: "Maréchal", minPoints: 600, benefit: "🌟 SUPRÉMATIE (+50€ Pub)", icon: Crown, color: "text-yellow-500" },
]

export function getRank(points: number) {
    // Rank calculation: 1 + floor(points / 60)
    // Example: 0-59 -> Lv 1, 60-119 -> Lv 2
    const level = Math.min(11, Math.floor(points / 60) + 1)
    return RANKS.find(r => r.level === level) || RANKS[0]
}

export function getNextRank(currentLevel: number) {
    if (currentLevel >= 11) return null
    return RANKS.find(r => r.level === currentLevel + 1)
}