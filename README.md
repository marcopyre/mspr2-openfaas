## 1. Démarrer un cluster Kubernetes local

# Démarrer minikube

minikube start --memory=4096 --cpus=2

# Vérifier que le cluster fonctionne

kubectl get nodes

## 2. Déployer PostgreSQL

# Créer le secret pour PostgreSQL

kubectl create secret generic postgres-secrets \
 --from-literal=POSTGRES_PASSWORD=postgres_password \
 --from-literal=POSTGRES_USER=postgres \
 --from-literal=POSTGRES_DB=cofrap

# Appliquer le fichier de déploiement PostgreSQL

kubectl apply -f kubernetes/postgres-deployment.yaml

# Vérifier que PostgreSQL est en cours d'exécution

kubectl get pods -l app=postgres

## 3. Installer OpenFaaS

# Ajouter le repo Helm d'OpenFaaS

helm repo add openfaas https://openfaas.github.io/faas-netes/
helm repo update

# Créer les namespaces pour OpenFaaS

kubectl apply -f https://raw.githubusercontent.com/openfaas/faas-netes/master/namespaces.yml

# Installer OpenFaaS avec Helm

helm install openfaas openfaas/openfaas \
 --namespace openfaas \
 --set functionNamespace=openfaas-fn \
 --set serviceType=NodePort \
 -f kubernetes/openfaas-values.yaml

# Attendre que tous les pods soient prêts

kubectl -n openfaas get deployments -l "app.kubernetes.io/name=openfaas" -w

## 4. Configurer le client OpenFaaS

# Installer le CLI OpenFaaS

curl -sSL https://cli.openfaas.com | sudo sh

# Récupérer le mot de passe admin

PASSWORD=$(kubectl -n openfaas get secret basic-auth -o jsonpath="{.data.basic-auth-password}" | base64 --decode)

# Exposer le service OpenFaaS

kubectl port-forward -n openfaas svc/gateway 8080:8080 &

# Se connecter à OpenFaaS

echo -n $PASSWORD | faas-cli login --username admin --password-stdin

## 5. Déployer les fonctions serverless

# Créer le secret pour le chiffrement

kubectl -n openfaas-fn create secret generic openfaas-secrets \
 --from-literal=encryption-key="FernetKey--\_ThisIsASecretKeyForCofrapApplication" \
 --from-literal=db-password="postgres_password"

# Déployer les fonctions

cd openfaas
faas-cli deploy -f generate_password.yml
faas-cli deploy -f generate_totp.yml
faas-cli deploy -f authenticate.yml

## 6. Déployer l'interface web

# Construire l'image Docker de l'interface web

docker build -t cofrap-frontend:latest .

# Déployer l'interface web

kubectl apply -f kubernetes/frontend-deployment.yaml

# Exposer l'interface web

kubectl port-forward svc/cofrap-frontend 3000:80 &

##7. Tester l'application
Ouvrez votre navigateur et accédez à `http://localhost:3000` pour utiliser l'application.
