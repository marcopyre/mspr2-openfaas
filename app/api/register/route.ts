import { NextResponse } from "next/server";

// URL de la gateway OpenFaaS
const OPENFAAS_GATEWAY =
  process.env.OPENFAAS_GATEWAY || "http://localhost:8080";
const OPENFAAS_USERNAME = process.env.OPENFAAS_USERNAME || "admin";
const OPENFAAS_PASSWORD = process.env.OPENFAAS_PASSWORD;

// Fonction helper pour créer les headers d'authentification
function getAuthHeaders() {
  const credentials = Buffer.from(
    `${OPENFAAS_USERNAME}:${OPENFAAS_PASSWORD}`
  ).toString("base64");
  return {
    "Content-Type": "application/json",
    Authorization: `Basic ${credentials}`,
  };
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { username, email } = body;

    if (!username || !email) {
      return NextResponse.json(
        { message: "Le nom d'utilisateur et l'email sont requis" },
        { status: 400 }
      );
    }

    const passwordResponse = await generatePassword(username);

    const totpResponse = await generateTOTP(username);

    return NextResponse.json({
      success: true,
      username,
      passwordQr: passwordResponse.qrCode,
      totpQr: totpResponse.qrCode,
    });
  } catch (error) {
    console.error("Error in register API:", error);
    return NextResponse.json(
      { message: "Une erreur est survenue lors de l'inscription" },
      { status: 500 }
    );
  }
}

async function generatePassword(username: string) {
  const passwordResponse = await fetch(
    `${OPENFAAS_GATEWAY}/function/generate-password`,
    {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify({ username }),
    }
  );

  if (!passwordResponse.ok) {
    throw new Error(
      `Password function failed: ${await passwordResponse.text()}`
    );
  }

  const data = await passwordResponse.json();

  return {
    success: true,
    qrCode: data.qrCode,
  };
}

async function generateTOTP(username: string) {
  const totpResponse = await fetch(
    `${OPENFAAS_GATEWAY}/function/generate-totp`,
    {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify({ username }),
    }
  );

  if (!totpResponse.ok) {
    throw new Error(`TOTP function failed: ${await totpResponse.text()}`);
  }

  const data = await totpResponse.json();
  return {
    success: true,
    qrCode: data.qrCode,
  };
}
