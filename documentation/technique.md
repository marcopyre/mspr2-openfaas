# Documentation Technique - Système de Gestion des Comptes Utilisateurs COFRAP

---

## 1. Vue d'ensemble

### 1.1 Objectif du projet

Le système de gestion des comptes utilisateurs COFRAP est une solution serverless conçue pour automatiser la création et la gestion des comptes utilisateurs avec authentification à deux facteurs obligatoire et rotation automatique des identifiants.

### 1.2 Fonctionnalités principales

- **Création de comptes** : Inscription avec prénom, nom et mot de passe
- **Authentification 2FA** : Authentification à deux facteurs obligatoire via TOTP
- **Rotation automatique** : Expiration des identifiants après 6 mois
- **Sécurité renforcée** : Chiffrement des données sensibles
- **Interface web** : Interface simple pour tester les fonctionnalités

### 1.3 Technologies utilisées

- **Orchestration** : Kubernetes (K3S)
- **Serverless** : OpenFaaS Community
- **Base de données** : PostgreSQL
- **Backend** : Python 3.9
- **Frontend** : Next.js 14, React 18, TypeScript
- **Chiffrement** : Cryptography (Fernet)
- **2FA** : PyOTP
- **Conteneurisation** : Docker

---

## 2. Architecture technique

### 2.1 Vue d'ensemble de l'architecture

Le système suit une architecture serverless distribuée sur un cluster Kubernetes :

```
Interface Web (Next.js)
↓
API Routes
↓
OpenFaaS Gateway
↓
Fonctions Python (create-user, generate-totp, authenticate)
↓
PostgreSQL Database
```

### 2.2 Composants principaux

1. **Cluster Kubernetes** : Infrastructure de base avec K3S
2. **OpenFaaS** : Plateforme serverless pour les fonctions
3. **PostgreSQL** : Base de données relationnelle
4. **Interface Web** : Application Next.js
5. **Fonctions Python** : Logique métier serverless

---

## 3. Composants du système

### 3.1 Cluster Kubernetes

**Configuration recommandée :**

- **Control Plane** : 2 vCPUs, 2-4 Go RAM, 15 Go disque
- **Worker Nodes** : 2 vCPUs, 4 Go RAM, 20 Go disque chacun

**Services déployés :**

- OpenFaaS (namespace: `openfaas`)
- Fonctions (namespace: `openfaas-fn`)
- PostgreSQL (namespace: `default`)
- Interface web (namespace: `default`)

### 3.2 OpenFaaS

**Configuration :**

- **Gateway** : Point d'entrée pour les fonctions
- **Scale to Zero** : Économie de ressources
- **Auto-scaling** : Adaptation automatique à la charge

**Fonctions déployées :**

- `create-user` : Création d'utilisateurs
- `generate-totp` : Génération de secrets 2FA
- `authenticate` : Authentification utilisateur

### 3.3 PostgreSQL

**Configuration :**

- **Version** : PostgreSQL 15
- **Déploiement** : StatefulSet avec PVC
- **Stockage** : 1 Go (extensible)

---

## 4. Base de données

### 4.1 Schéma de la table `users`

```sql
CREATE TABLE users (
id SERIAL PRIMARY KEY,
username VARCHAR(100) NOT NULL UNIQUE,
password TEXT NOT NULL,
first_name VARCHAR(50),
last_name VARCHAR(50),
mfa TEXT,
gendate BIGINT,
expired BOOLEAN DEFAULT FALSE
);
```

### 4.2 Description des champs

| Champ        | Type         | Description                                     |
| ------------ | ------------ | ----------------------------------------------- |
| `id`         | SERIAL       | Identifiant unique auto-incrémenté              |
| `username`   | VARCHAR(100) | Nom d'utilisateur (format: nom.prénom)          |
| `password`   | TEXT         | Mot de passe chiffré avec Fernet                |
| `first_name` | VARCHAR(50)  | Prénom de l'utilisateur                         |
| `last_name`  | VARCHAR(50)  | Nom de famille de l'utilisateur                 |
| `mfa`        | TEXT         | Secret TOTP chiffré pour l'authentification 2FA |
| `gendate`    | BIGINT       | Timestamp Unix de création des identifiants     |
| `expired`    | BOOLEAN      | Statut d'expiration des identifiants            |

### 4.3 Index

```sql
CREATE INDEX idx_username ON users(username);
```

---

## 5. Fonctions serverless

### 5.1 create-user

**Objectif :** Créer un nouvel utilisateur avec mot de passe chiffré

**Entrée :**

```json
{
  "username": "dupont.jean",
  "password": "motdepasse123",
  "firstName": "Jean",
  "lastName": "Dupont"
}
```

**Sortie :**

```json
{
  "success": true,
  "username": "dupont.jean",
  "message": "Utilisateur créé avec succès"
}
```

**Traitement :**

1. Validation des données d'entrée
2. Vérification de l'unicité du nom d'utilisateur
3. Chiffrement du mot de passe avec Fernet
4. Insertion en base de données
5. Retour du résultat

### 5.2 generate-totp

**Objectif :** Générer un secret TOTP et son QR code pour l'authentification 2FA

**Entrée :**

```json
{
  "username": "dupont.jean"
}
```

**Sortie :**

```json
{
  "success": true,
  "username": "dupont.jean",
  "qrCode": "data:image/png;base64,..."
}
```

**Traitement :**

1. Génération d'un secret TOTP aléatoire
2. Création de l'URI TOTP
3. Chiffrement du secret
4. Mise à jour en base de données
5. Retour du résultat

### 5.3 authenticate

**Objectif :** Authentifier un utilisateur avec mot de passe et code 2FA

**Entrée :**

```json
{
  "username": "dupont.jean",
  "password": "motdepasse123",
  "totpCode": "123456"
}
```

**Sortie :**

```json
{
  "success": true,
  "username": "dupont.jean",
  "firstName": "Jean",
  "lastName": "Dupont",
  "expired": false
}
```

**Traitement :**

1. Récupération des données utilisateur
2. Déchiffrement du mot de passe et du secret TOTP
3. Validation du mot de passe
4. Vérification du code TOTP
5. Vérification de l'expiration (6 mois)
6. Retour du résultat d'authentification

---

## 6. Interface utilisateur

### 6.1 Architecture Frontend

**Framework :** Next.js 14 avec App Router
**Styling :** Tailwind CSS + shadcn/ui
**État :** React hooks (useState)

### 6.2 Composants principaux

1. **Page principale** (`app/page.tsx`)

   - Gestion des onglets (Connexion, Inscription, QR Codes)
   - Affichage des messages d'état
   - Coordination entre les composants

2. **Formulaire d'inscription** (`components/register-form.tsx`)

   - Champs : username, email
   - Validation côté client
   - Génération automatique du mot de passe

3. **Formulaire de connexion** (`components/login-form.tsx`)

   - Champs : nom d'utilisateur, mot de passe, code 2FA
   - Gestion des erreurs d'authentification

4. **Affichage QR Code** (`components/qr-code-display.tsx`)
   - Génération de QR codes avec la librairie `qrcode`
   - Affichage responsive

### 6.3 API Routes

1. **POST /api/register**

   - Création d'un nouvel utilisateur
   - Appel aux fonctions OpenFaaS

2. **POST /api/auth**
   - Authentification utilisateur
   - Gestion de l'expiration des identifiants

---

## 7. Sécurité

### 7.1 Chiffrement des données

**Algorithme :** Fernet (AES 128 en mode CBC avec HMAC SHA256)
**Clé :** Stockée dans les secrets Kubernetes
**Données chiffrées :**

- Mots de passe utilisateur
- Secrets TOTP

### 7.2 Authentification à deux facteurs

**Standard :** TOTP (Time-based One-Time Password)
**Algorithme :** SHA1
**Période :** 30 secondes
**Longueur :** 6 chiffres

### 7.3 Gestion des secrets

**Kubernetes Secrets :**

```yaml
apiVersion: v1
kind: Secret
metadata:
name: encryption-key
namespace: openfaas-fn
type: Opaque
data:
encryption-key: <base64-encoded-fernet-key>
```

### 7.4 Rotation des identifiants

**Période :** 6 mois (180 jours)
**Déclenchement :** Automatique lors de la connexion
**Processus :**

1. Vérification de la date de création
2. Marquage comme expiré si > 6 mois
3. Génération de nouveaux secrets 2FA
4. Notification à l'utilisateur

---

## 8. Déploiement

### 8.1 Prérequis

- Docker
- kubectl
- Helm 3
- minikube ou cluster Kubernetes

### 8.2 Étapes de déploiement

1. **Démarrage du cluster**

   ```bash
   minikube start
   ```

2. **Déploiement PostgreSQL**

   ```bash
   kubectl apply -f kubernetes/postgres-deployment.yaml
   ```

3. **Installation OpenFaaS**

   ```bash
   helm repo add openfaas https://openfaas.github.io/faas-netes/
   helm install openfaas openfaas/openfaas \
    --namespace openfaas \
    --set functionNamespace=openfaas-fn
   ```

4. **Création des secrets**

   ```bash
   kubectl apply -f kubernetes/openfaas-secrets.yaml
   ```

5. **Déploiement des fonctions**

   ```bash
   faas-cli deploy -f openfaas/create_user.yml
   faas-cli deploy -f openfaas/generate_totp.yml
   faas-cli deploy -f openfaas/authenticate.yml
   ```

6. **Déploiement de l'interface web**
   ```bash
   docker build -t cofrap-frontend:latest .
   minikube image load cofrap-frontend:latest
   kubectl apply -f kubernetes/frontend-deployment.yaml
   ```

### 8.3 Structure des fichiers

```
cofrap-user-management/
├── app/
│ ├── api/
│ │ ├── auth/route.ts
│ │ └── register/route.ts
│ ├── globals.css
│ ├── layout.tsx
│ └── page.tsx
├── components/
│ ├── ui/
│ ├── login-form.tsx
│ ├── qr-code-display.tsx
│ ├── theme-provider.tsx
│ └── register-form.tsx
├── hooks/
│ ├── use-mobile.tsx
│ └── use-toast.ts
├── kubernetes/
│ ├── frontend-deployment.yaml
│ ├── openfaas-secrets.yaml
│ ├── openfaas-values.yaml
│ └── postgres-deployment.yaml
├── openfaas/
│ ├── authenticate/
│ ├── create_user/
│ ├── generate_totp/
│ ├── authenticate.yml
│ ├── generate_password.yml
│ └── generate_totp.yml
├── Dockerfile
├── package.json
└── README.md
```

---

## 9. Configuration

### 9.1 Variables d'environnement

**Frontend :**

- `OPENFAAS_GATEWAY` : URL de la gateway OpenFaaS
- `NEXT_TELEMETRY_DISABLED` : Désactiver la télémétrie Next.js

**Fonctions OpenFaaS :**

- `DB_HOST` : Hôte de la base de données
- `DB_NAME` : Nom de la base de données
- `DB_USER` : Utilisateur de la base de données
- `ENCRYPTION_KEY` : Clé de chiffrement Fernet

### 9.2 Secrets Kubernetes

```yaml
# Clé de chiffrement

encryption-key: <fernet-key-base64>

# Mot de passe base de données

db-password: <postgres-password-base64>
```

### 9.3 Configuration OpenFaaS

```yaml
# openfaas-values.yaml

functionNamespace: openfaas-fn
gateway:
replicas: 1
scaleFromZero: true
basicAuth: true
```

---

## 10. API

### 10.1 Endpoints disponibles

#### POST /api/register

**Description :** Créer un nouveau compte utilisateur

**Corps de la requête :**

```json
{
  "firstName": "Jean",
  "lastName": "Dupont",
  "password": "motdepasse123"
}
```

**Réponse succès (200) :**

```json
{
  "success": true,
  "username": "dupont.jean",
  "firstName": "Jean",
  "lastName": "Dupont",
  "totpQr": "data:image/png;base64,..."
}
```

**Réponse erreur (400) :**

```json
{
  "message": "Un utilisateur avec ce nom existe déjà"
}
```

#### POST /api/auth

**Description :** Authentifier un utilisateur

**Corps de la requête :**

```json
{
  "username": "dupont.jean",
  "password": "motdepasse123",
  "totpCode": "123456"
}
```

**Réponse succès (200) :**

```json
{
  "success": true,
  "username": "dupont.jean",
  "firstName": "Jean",
  "lastName": "Dupont"
}
```

**Réponse expiration (200) :**

```json
{
  "success": true,
  "expired": true,
  "totpQr": "ABCDEF!@#$%"
}
```

**Réponse erreur (401) :**

```json
{
  "message": "Mot de passe incorrect"
}
```

---

## 11. Tests

### 11.1 Tests d'intégration

**Outils :** Postman/Newman, curl

**Exemple de test :**

```bash

# Test de création d'utilisateur

curl -X POST http://localhost:8080/function/create-user \
 -H "Content-Type: application/json" \
 -d '{"username":"test.user","password":"password123","firstName":"Test","lastName":"User"}'
```

### 11.3 Tests de charge

**Outil :** Apache Bench (ab)

```bash

# Test de charge sur l'authentification

ab -n 1000 -c 10 -p auth_data.json -T application/json \
 http://localhost:8080/function/authenticate
```

---

## 12. Maintenance

### 12.1 Surveillance

**Métriques à surveiller :**

- Utilisation CPU/RAM des pods
- Temps de réponse des fonctions
- Taux d'erreur des API
- Espace disque PostgreSQL

**Outils recommandés :**

- Prometheus + Grafana
- Kubernetes Dashboard
- OpenFaaS UI

### 12.2 Sauvegardes

**Base de données :**

```bash

# Sauvegarde manuelle

kubectl exec -it postgres-0 -- pg_dump -U postgres cofrap > backup.sql

# Restauration

kubectl exec -i postgres-0 -- psql -U postgres cofrap < backup.sql
```

### 12.3 Mise à jour

**Fonctions OpenFaaS :**

```bash

# Mise à jour d'une fonction

faas-cli build -f function.yml
faas-cli push -f function.yml
faas-cli deploy -f function.yml
```

**Interface web :**

```bash

# Reconstruction et redéploiement

docker build -t cofrap-frontend:latest .
minikube image load cofrap-frontend:latest
kubectl rollout restart deployment cofrap-frontend
```
