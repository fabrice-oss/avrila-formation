#!/bin/bash
# Lance l'application AVRILA FORMATION en local
echo "🚀 Démarrage AVRILA FORMATION..."
echo "📂 Dossier : $(pwd)"
echo ""
echo "➡️  Ouvrez votre navigateur sur : http://localhost:8080"
echo "   (Ctrl+C pour arrêter)"
echo ""
cd "$(dirname "$0")"
python3 -m http.server 8080
