"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, CheckCircle2 } from "lucide-react";
import QRCodeDisplay from "@/components/qr-code-display";
import LoginForm from "@/components/login-form";
import RegisterForm from "@/components/register-form";

export default function Home() {
  const [activeTab, setActiveTab] = useState("login");
  const [message, setMessage] = useState({ type: "", content: "" });
  const [qrData, setQrData] = useState({ password: null, totp: null });

  const showMessage = (type: string, content: string) => {
    setMessage({ type, content });
    // Clear message after 5 seconds
    setTimeout(() => setMessage({ type: "", content: "" }), 5000);
  };

  const handleRegisterSuccess = (data: any) => {
    setQrData({
      password: data.passwordQr,
      totp: data.totpQr,
    });
    showMessage(
      "success",
      "Compte créé avec succès! Scannez les QR codes pour obtenir votre mot de passe et configurer votre authentification à deux facteurs."
    );
    setActiveTab("qrcodes");
  };

  const handleLoginSuccess = () => {
    showMessage("success", "Authentification réussie!");
  };

  const handleLoginExpired = (data: any) => {
    setQrData({
      password: data.passwordQr,
      totp: data.totpQr,
    });
    showMessage(
      "warning",
      "Vos identifiants ont expiré. Veuillez scanner les nouveaux QR codes."
    );
    setActiveTab("qrcodes");
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 bg-gray-50">
      <div className="w-full max-w-md">
        <Card className="w-full">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold">COFRAP</CardTitle>
            <CardDescription>Gestion des comptes utilisateurs</CardDescription>
          </CardHeader>
          <CardContent>
            {message.content && (
              <Alert
                className={`mb-4 ${
                  message.type === "success"
                    ? "bg-green-50 text-green-800 border-green-200"
                    : message.type === "error"
                    ? "bg-red-50 text-red-800 border-red-200"
                    : "bg-yellow-50 text-yellow-800 border-yellow-200"
                }`}
              >
                {message.type === "success" ? (
                  <CheckCircle2 className="h-4 w-4" />
                ) : (
                  <AlertCircle className="h-4 w-4" />
                )}
                <AlertTitle>
                  {message.type === "success"
                    ? "Succès"
                    : message.type === "error"
                    ? "Erreur"
                    : "Attention"}
                </AlertTitle>
                <AlertDescription>{message.content}</AlertDescription>
              </Alert>
            )}

            <Tabs
              value={activeTab}
              onValueChange={setActiveTab}
              className="w-full"
            >
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="login">Connexion</TabsTrigger>
                <TabsTrigger value="register">Inscription</TabsTrigger>
                <TabsTrigger value="qrcodes">QR Codes</TabsTrigger>
              </TabsList>

              <TabsContent value="login">
                <LoginForm
                  onSuccess={handleLoginSuccess}
                  onError={(msg) => showMessage("error", msg)}
                  onExpired={handleLoginExpired}
                />
              </TabsContent>

              <TabsContent value="register">
                <RegisterForm
                  onSuccess={handleRegisterSuccess}
                  onError={(msg) => showMessage("error", msg)}
                />
              </TabsContent>

              <TabsContent value="qrcodes">
                <div className="space-y-4">
                  {qrData.password && (
                    <div className="space-y-2">
                      <Label>Votre mot de passe (à scanner)</Label>
                      <QRCodeDisplay
                        value={qrData.password}
                        title="Mot de passe"
                      />
                    </div>
                  )}

                  {qrData.totp && (
                    <div className="space-y-2">
                      <Label>
                        Votre code d'authentification 2FA (à scanner)
                      </Label>
                      <QRCodeDisplay value={qrData.totp} title="Code 2FA" />
                    </div>
                  )}

                  {!qrData.password && !qrData.totp && (
                    <div className="text-center p-4">
                      <p className="text-gray-500">
                        Aucun QR code à afficher. Veuillez vous inscrire ou vous
                        connecter.
                      </p>
                    </div>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
