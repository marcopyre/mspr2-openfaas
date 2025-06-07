## Démarrer minikube

minikube start

## Appliquer le fichier de déploiement PostgreSQL

kubectl create namespace cofrap
kubectl apply -f kubernetes/postgres-deployment.yaml

## Ajouter le repo Helm d'OpenFaaS

helm repo add openfaas https://openfaas.github.io/faas-netes/
helm repo update

## Créer les namespaces pour OpenFaaS

kubectl apply -f https://raw.githubusercontent.com/openfaas/faas-netes/master/namespaces.yml

## Installer OpenFaaS avec Helm

helm install openfaas openfaas/openfaas \
 --namespace openfaas \
 --set functionNamespace=openfaas-fn \
 --set serviceType=NodePort \
 -f kubernetes/openfaas-values.yaml

## Installer le CLI OpenFaaS

curl -sSL https://cli.openfaas.com | sudo sh

## Récupérer le mot de passe admin

PASSWORD=$(kubectl -n openfaas get secret basic-auth -o jsonpath="{.data.basic-auth-password}" | base64 --decode)

## Exposer le service OpenFaaS

kubectl port-forward -n openfaas svc/gateway 8080:8080 &

## Se connecter à OpenFaaS

echo -n $PASSWORD | faas-cli login --username admin --password-stdin

## Créer les secret pour le chiffrement

kubectl apply -f kubernetes/openfaas-secrets.yaml

cd openfaas

docker login

faas-cli up -f generate_password.yml
faas-cli up -f generate_totp.yml
faas-cli up -f authenticate.yml

## Construire l'image Docker de l'interface web

docker build -t cofrap-frontend:latest .
minikube image load cofrap-frontend:latest

## Déployer l'interface web

kubectl apply -f kubernetes/frontend-deployment.yaml

## Exposer l'interface web

kubectl port-forward svc/cofrap-frontend 3000:80 &

## Tester l'application

Ouvrez votre navigateur et accédez à `http://localhost:3000` pour utiliser l'application.
