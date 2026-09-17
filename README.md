# Tour de Rôle

Application de prise de rendez-vous et de file d'attente virtuelle pour les
centres de santé sénégalais. Authentification par OTP SMS via **LAfricaMobile**,
backend **Supabase**, web déployé sur **Vercel**, mobile natif via **Expo**.

## Structure du dépôt

```
./
├── backend/
│   └── supabase/            # convention standard de la CLI Supabase
│       ├── schema.sql          # tables + RLS + trigger queue_tickets
│       └── functions/
│           ├── send-otp/       # envoie le code par SMS (LAMPUSH), fallback dev-mode sans creds LAM
│           └── verify-otp/     # vérifie le code, crée la session
└── frontend/
    ├── web/       # Next.js — déployé sur Vercel
    └── mobile/    # Expo / React Native — build via EAS
```

## 1. Mettre en place Supabase

Depuis `backend/` (la CLI y trouve `supabase/` automatiquement) :

```bash
cd backend
npm install -g supabase
supabase login                                    # ou SUPABASE_ACCESS_TOKEN=<token perso>
supabase link --project-ref <votre-project-ref>

# Appliquer le schéma (ou coller son contenu dans l'éditeur SQL du dashboard)
supabase db push --file supabase/schema.sql

# Déployer les fonctions OTP (--use-api évite d'avoir besoin de Docker)
supabase functions deploy send-otp --use-api
supabase functions deploy verify-otp --use-api

# Secrets nécessaires aux fonctions (valeurs reçues de LAfricaMobile
# une fois votre compte de production activé — cf. assistance@lafricamobile.com)
# Tant qu'ils ne sont pas définis, send-otp bascule en mode dev : le code
# OTP est affiché dans les logs de la fonction au lieu d'être envoyé par SMS.
supabase secrets set LAM_ACCOUNT_ID=xxxx
supabase secrets set LAM_PASSWORD=xxxx
supabase secrets set LAM_SENDER=TourDeRole
```

Récupérez ensuite, dans **Project Settings → API** :
- `SUPABASE_URL`
- `anon public key` → pour le web et le mobile
- `service_role key` → déjà utilisée automatiquement par les Edge Functions

## 2. Déployer le web sur Vercel

```bash
cd frontend/web
npm install
vercel link
vercel env add NEXT_PUBLIC_SUPABASE_URL
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY
vercel --prod
```

Le `vercel.json` à la racine du dépôt pointe déjà Vercel vers `frontend/web` si
vous connectez le repo GitHub directement dans le dashboard Vercel (Root
Directory peut aussi être réglé sur `frontend/web` dans les Project Settings).

## 3. Build et publication du mobile (Expo / EAS)

```bash
cd frontend/mobile
npm install
npx eas login
npx eas build:configure

# Variables d'env (mêmes valeurs Supabase que le web)
cp .env.example .env
# éditez .env avec vos vraies valeurs

npx eas build --platform android
npx eas build --platform ios
```

Pour tester en local pendant le développement : `npm run start` puis scanner
le QR code avec l'app **Expo Go**.

## 4. Pousser sur GitHub

```bash
cd "applications de file d'attente pour les structures de sante"
git init
git add .
git commit -m "Initial commit: backend Supabase + frontend web/mobile"
git branch -M main
git remote add origin https://github.com/<votre-compte>/<votre-repo>.git
git push -u origin main
```

> ⚠️ Ne committez jamais vos fichiers `.env` (déjà exclus par `.gitignore`) —
> configurez les variables d'environnement directement dans Vercel, Supabase
> et EAS.

## Prochaines étapes suggérées

- Générer automatiquement les `queue_tickets` et `ticket_number` du jour à
  partir des `appointments` confirmés (trigger SQL ou tâche planifiée).
- Ajouter l'envoi du SMS "bientôt votre tour" (Edge Function déclenchée quand
  un ticket passe en position n°2).
- Ajouter la création des `services` / `slots` côté agent (actuellement
  gérée manuellement dans `schema.sql` ou via le dashboard Supabase).
- Ajouter une garde d'accès (rôle `agent`/`admin`) sur la page `/agent` côté
  client, en plus des policies RLS déjà en place côté base.
