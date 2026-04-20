# 🌍 HKEYETNA — Plateforme de Tourisme IA pour la Tunisie

> *"Hkeyetna"* signifie **notre histoire** en dialecte tunisien.

Une plateforme moderne et intelligente pour explorer, planifier et vivre la Tunisie authentique.

---

## ✨ Fonctionnalités

| Feature | Description |
|---|---|
| 🤖 **Générateur IA** | Itinéraires personnalisés jour par jour via Google Gemini |
| 🌦️ **Météo temps réel** | Intégration Open-Meteo, alternatives si mauvais temps |
| 💬 **Chatbot Hayet** | Assistante IA contextualisée sur la Tunisie |
| 🗺️ **Carte interactive** | Leaflet avec marqueurs cliquables et tracé d'itinéraire |
| 📸 **Feed social** | Inspiration Instagram-style avec posts tunisiens |
| 💱 **Convertisseur devise** | TND / EUR / USD en temps réel (Context API) |
| 🔍 **Page Explorer** | Filtres par catégorie, tag, recherche + vue carte/grille |

---

## 🚀 Installation & Démarrage

### 1. Cloner le projet
```bash
git clone <repo>
cd hkeyetna
```

### 2. Installer les dépendances
```bash
npm install
```

### 3. Variables d'environnement
Créez un fichier `.env.local` :
```env
GEMINI_API_KEY=AIza_votre_cle_ici
```

### 4. Lancer en développement
```bash
npm run dev
```

Ouvrez [http://localhost:3000](http://localhost:3000)

---

## 🏗️ Architecture

```
/hkeyetna
├── app/
│   ├── layout.tsx          # Layout principal + providers
│   ├── page.tsx            # Page d'accueil
│   ├── globals.css         # Styles globaux + Tailwind
│   ├── explore/
│   │   └── page.tsx        # Page d'exploration
│   └── api/
│       ├── generate-trip/  # Génération d'itinéraire IA
│       ├── weather/        # Météo Open-Meteo
│       └── chat/           # Chatbot Hayet
├── components/
│   ├── Navbar.tsx
│   ├── HeroSection.tsx
│   ├── TripGenerator.tsx
│   ├── ItineraryView.tsx
│   ├── ChatbotWidget.tsx
│   ├── MapView.tsx
│   ├── MapContent.tsx      # Leaflet (dynamic import)
│   ├── CurrencySwitcher.tsx
│   └── SocialFeed.tsx
├── context/
│   └── CurrencyContext.tsx # Gestion devise globale
├── lib/
│   ├── weather.ts          # Logique météo + alternatives
│   ├── currency.ts         # Conversion devises
│   └── tripGenerator.ts    # Fallback mock trip generator
└── data/
    ├── places.json         # 12 destinations tunisiennes
    └── experiences.json    # 8 expériences uniques
```

---

## 🎨 Stack Technique

- **Framework** : Next.js 14 (App Router)
- **UI** : React 18 + TailwindCSS + Framer Motion
- **IA** : Google Gemini API (gemini-1.5-flash)
- **Carte** : React-Leaflet + OpenStreetMap
- **Météo** : Open-Meteo API (gratuit, sans clé)
- **Fonts** : Cormorant Garamond + DM Sans

---

## 🌐 APIs utilisées

| API | Usage | Clé requise |
|---|---|---|
| Google Gemini | Génération de voyage + chatbot | ✅ Oui |
| Open-Meteo | Météo temps réel | ❌ Non |
| OpenStreetMap | Tuiles de carte | ❌ Non |

---

## 📦 Build Production

```bash
npm run build
npm run start
```

---

Made with ❤️ for Tunisia 🇹🇳
