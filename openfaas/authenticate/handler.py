import json
import os
import time
import psycopg2
import pyotp
from cryptography.fernet import Fernet
from datetime import datetime, timedelta

def get_db_connection():
    """Établit une connexion à la base de données PostgreSQL"""
    conn = psycopg2.connect(
        host=os.environ.get('DB_HOST', 'postgres'),
        database=os.environ.get('DB_NAME', 'cofrap'),
        user=os.environ.get('DB_USER', 'postgres'),
        password=os.environ.get('DB_PASSWORD', 'postgres')
    )
    return conn

def decrypt_data(encrypted_data, key):
    """Déchiffre les données avec la clé fournie"""
    f = Fernet(key)
    return f.decrypt(encrypted_data.encode()).decode()

def verify_totp(secret, code):
    """Vérifie si le code TOTP est valide"""
    totp = pyotp.TOTP(secret)
    return totp.verify(code)

def check_expiration(gendate):
    """Vérifie si les identifiants ont expiré (plus de 6 mois)"""
    # Convertir le timestamp en datetime
    gen_datetime = datetime.fromtimestamp(gendate)
    # Calculer la date d'expiration (6 mois après la génération)
    expiration_date = gen_datetime + timedelta(days=180)
    # Vérifier si la date actuelle est postérieure à la date d'expiration
    return datetime.now() > expiration_date

def handle(req):
    """Fonction principale qui traite la requête"""
    try:
        # Charger les données de la requête
        request_data = json.loads(req)
        username = request_data.get('username')
        password = request_data.get('password')
        totp_code = request_data.get('totpCode')
        
        if not username or not password or not totp_code:
            return json.dumps({"success": False, "message": "Tous les champs sont requis"})
        
        # Récupérer la clé de chiffrement depuis les variables d'environnement
        encryption_key = os.environ.get('ENCRYPTION_KEY')
        if not encryption_key:
            return json.dumps({"success": False, "message": "Clé de chiffrement non configurée"})
        
        # Récupérer les informations de l'utilisateur depuis la base de données
        conn = get_db_connection()
        cursor = conn.cursor()
        
        cursor.execute(
            "SELECT id, password, mfa, gendate, expired FROM users WHERE username = %s",
            (username,)
        )
        user = cursor.fetchone()
        
        if not user:
            conn.close()
            return json.dumps({"success": False, "message": "Utilisateur non trouvé"})
        
        user_id, encrypted_password, encrypted_mfa, gendate, expired = user
        
        # Vérifier si les identifiants sont déjà marqués comme expirés
        if expired:
            conn.close()
            return json.dumps({"success": True, "expired": True})
        
        # Vérifier si les identifiants ont expiré (plus de 6 mois)
        if check_expiration(gendate):
            # Marquer les identifiants comme expirés
            cursor.execute(
                "UPDATE users SET expired = %s WHERE id = %s",
                (True, user_id)
            )
            conn.commit()
            conn.close()
            return json.dumps({"success": True, "expired": True})
        
        # Déchiffrer le mot de passe et le secret TOTP
        try:
            decrypted_password = decrypt_data(encrypted_password, encryption_key)
            decrypted_mfa = decrypt_data(encrypted_mfa, encryption_key)
        except Exception:
            conn.close()
            return json.dumps({"success": False, "message": "Erreur de déchiffrement"})
        
        # Vérifier le mot de passe
        if password != decrypted_password:
            conn.close()
            return json.dumps({"success": False, "message": "Mot de passe incorrect"})
        
        # Vérifier le code TOTP
        if not verify_totp(decrypted_mfa, totp_code):
            conn.close()
            return json.dumps({"success": False, "message": "Code d'authentification incorrect"})
        
        # Authentification réussie
        conn.close()
        return json.dumps({
            "success": True,
            "username": username,
            "expired": False
        })
        
    except Exception as e:
        return json.dumps({"success": False, "message": str(e)})
