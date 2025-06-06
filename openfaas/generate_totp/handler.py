import json
import os
import base64
import io
import psycopg2
import pyotp
from cryptography.fernet import Fernet
from datetime import datetime

def get_secret(key):
    with open("/var/openfaas/secrets/{}".format(key)) as f:
        return f.read().strip()

def get_db_connection():
    """Établit une connexion à la base de données PostgreSQL"""
    conn = psycopg2.connect(
        host=os.environ.get('DB_HOST', 'postgres'),
        database=os.environ.get('DB_NAME', 'cofrap'),
        user=os.environ.get('DB_USER', 'postgres'),
        password=get_secret('db-password')
    )
    return conn

def generate_totp_secret():
    """Génère un secret TOTP aléatoire"""
    return pyotp.random_base32()

def generate_totp_uri(username, secret, issuer="COFRAP"):
    """Génère l'URI TOTP pour l'application d'authentification"""
    totp = pyotp.TOTP(secret)
    return totp.provisioning_uri(name=username, issuer_name=issuer)


def encrypt_data(data, key):
    """Chiffre les données avec la clé fournie"""
    f = Fernet(key)
    return f.encrypt(data.encode()).decode()

def handle(req):
    """Fonction principale qui traite la requête"""
    try:
        # Charger les données de la requête
        request_data = json.loads(req)
        username = request_data.get('username')
        
        if not username:
            return json.dumps({"success": False, "message": "Le nom d'utilisateur est requis"})

        # Générer un secret TOTP
        totp_secret = generate_totp_secret()
        
        # Générer l'URI TOTP
        totp_uri = generate_totp_uri(username, totp_secret)
        
        # Générer un QR code contenant l'URI TOTP
        
        # Récupérer la clé de chiffrement depuis les variables d'environnement
        encryption_key = get_secret('encryption-key')
        if not encryption_key:
            return json.dumps({"success": False, "message": "Clé de chiffrement non configurée"})
        
        # Chiffrer le secret TOTP
        encrypted_totp = encrypt_data(totp_secret, encryption_key)
        
        # Enregistrer dans la base de données
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Vérifier si l'utilisateur existe déjà
        cursor.execute("SELECT id FROM users WHERE username = %s", (username,))
        user = cursor.fetchone()
        current_time = int(datetime.now().timestamp())
        
        if user:
            # Mettre à jour l'utilisateur existant
            cursor.execute(
                "UPDATE users SET mfa = %s, gendate = %s, expired = %s WHERE username = %s",
                (encrypted_totp, current_time, False, username)
            )
        else:
            # Créer un nouvel utilisateur avec password explicitement à NULL
            cursor.execute(
                "INSERT INTO users (username, password, mfa, gendate, expired) VALUES (%s, %s, %s, %s, %s)",
                (username, '', encrypted_totp, current_time, False)
            )
        
        conn.commit()
        cursor.close()
        conn.close()
        
        # Retourner le résultat
        return json.dumps({
            "success": True,
            "username": username,
            "qrCode": totp_uri
        })
        
    except Exception as e:
        return json.dumps({"success": False, "message": str(e)})