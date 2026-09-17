# Tour de Rôle

Application de prise de rendez-vous et de file d'attente virtuelle pour les
centres de santé sénégalais. Authentification par OTP SMS via **LAfricaMobile**,
backend **Supabase**, web déployé sur **Vercel**, mobile natif via **Expo**.

## Structure du dépôt

```
./
├── backend/               # Supabase
│   ├── schema.sql            # tables + RLS
│   └── functions/
│       ├── send-otp/         # envoie le code par SMS (LAMPUSH)
│       └── verify-otp/       # vérifie le code, crée la session
└── frontend/
    ├── web/       # Next.js — déployé sur Vercel
    └── mobile/    # Expo / React Native — build via EAS
```

## 1. Mettre en place Supabase

```bash
npm install -g supabase
supabase login
supabase link --project-ref <votre-project-ref>

# Appliquer le schéma
supabase db push --file backend/schema.sql

# Déployer les fonctions OTP
supabase functions deploy send-otp --project-ref <votre-project-ref> --import-map backend/functions/send-otp
supabase functions deploy verify-otp --project-ref <votre-project-ref> --import-map backend/functions/verify-otp

# Secrets nécessaires aux fonctions (valeurs reçues de LAfricaMobile
# une fois votre compte de production activé — cf. assistance@lafricamobile.com)
supabase secrets set LAM_ACCOUNT_ID=xxxx
supabase secrets set LAM_PASSWORD=xxxx
supabase secrets set LAM_SENDER=TourDeRole
```

> Les Edge Functions vivent maintenant dans `backend/functions/` — lance les
> commandes `supabase functions deploy` depuis la racine de `backend/`, ou
> ajoute `--project-ref` / le chemin complet selon ta version de la CLI.

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
