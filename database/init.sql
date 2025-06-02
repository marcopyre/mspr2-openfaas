-- Création de la base de données
CREATE DATABASE cofrap;

-- Connexion à la base de données
\c cofrap;

-- Création de la table des utilisateurs
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(100) NOT NULL UNIQUE,
    password TEXT,
    mfa TEXT,
    gendate BIGINT,
    expired BOOLEAN DEFAULT FALSE
);

-- Création d'un index sur le nom d'utilisateur pour accélérer les recherches
CREATE INDEX idx_username ON users(username);

-- Création d'un utilisateur avec des privilèges limités pour l'application
CREATE USER cofrap_app WITH PASSWORD 'secure_password';
GRANT SELECT, INSERT, UPDATE ON users TO cofrap_app;
GRANT USAGE, SELECT ON SEQUENCE users_id_seq TO cofrap_app;

-- Ajout de commentaires pour documenter la table
COMMENT ON TABLE users IS 'Table stockant les informations des utilisateurs COFRAP';
COMMENT ON COLUMN users.id IS 'Identifiant unique de l''utilisateur';
COMMENT ON COLUMN users.username IS 'Nom d''utilisateur';
COMMENT ON COLUMN users.password IS 'Mot de passe chiffré';
COMMENT ON COLUMN users.mfa IS 'Secret TOTP chiffré pour l''authentification à deux facteurs';
COMMENT ON COLUMN users.gendate IS 'Date de génération des identifiants (timestamp Unix)';
COMMENT ON COLUMN users.expired IS 'Indique si les identifiants ont expiré';
