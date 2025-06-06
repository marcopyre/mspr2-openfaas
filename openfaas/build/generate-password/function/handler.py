import json
import os
import string
import random
import qrcode
import io
import base64
import psycopg2
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
        password=os.environ.get('DB_PASSWORD', 'postgres')
    )
    return conn

def generate_password(length=24):
    """Génère un mot de passe aléatoire avec la complexité requise"""
    # Définir les caractères à utiliser
    lowercase = string.ascii_lowercase
    uppercase = string.ascii_uppercase
    digits = string.digits
    special = "!@#$%^&*()-_=+[]{}|;:,.<>?"
    
    # S'assurer que le mot de passe contient au moins un caractère de chaque type
    password = [
        random.choice(lowercase),
        random.choice(uppercase),
        random.choice(digits),
        random.choice(special)
    ]
    
    # Compléter le reste du mot de passe
    all_chars = lowercase + uppercase + digits + special
    password.extend(random.choice(all_chars) for _ in range(length - 4))
    
    # Mélanger le mot de passe
    random.shuffle(password)
    
    return ''.join(password)

def generate_qr_code(data):
    """Génère un QR code à partir des données fournies"""
    qr = qrcode.QRCode(
        version=1,
        error_correction=qrcode.constants.ERROR_CORRECT_L,
        box_size=10,
        border=4,
    )
    qr.add_data(data)
    qr.make(fit=True)
    
    img = qr.make_image(fill_color="black", back_color="white")
    
    # Convertir l'image en base64
    buffered = io.BytesIO()
    img.save(buffered)
    img_str = base64.b64encode(buffered.getvalue()).decode()
    
    return f"data:image/png;base64,{img_str}"

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
        
        # Générer un mot de passe
        password = generate_password()
        
        # Générer un QR code contenant le mot de passe
        qr_code = generate_qr_code(password)
        
        # Récupérer la clé de chiffrement depuis les variables d'environnement
        encryption_key = get_secret('encryption-key')
        if not encryption_key:
            return json.dumps({"success": False, "message": "Clé de chiffrement non configurée"})
        
        # Chiffrer le mot de passe
        encrypted_password = encrypt_data(password, encryption_key)
        
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
                "UPDATE users SET password = %s, gendate = %s, expired = %s WHERE username = %s",
                (encrypted_password, current_time, False, username)
            )
        else:
            # Créer un nouvel utilisateur
            cursor.execute(
                "INSERT INTO users (username, password, gendate, expired) VALUES (%s, %s, %s, %s)",
                (username, encrypted_password, current_time, False)
            )
        
        conn.commit()
        cursor.close()
        conn.close()
        
        # Retourner le résultat
        return json.dumps({
            "success": True,
            "username": username,
            "qrCode": qr_code
        })
        
    except Exception as e:
        return json.dumps({"success": False, "message": str(e)})
