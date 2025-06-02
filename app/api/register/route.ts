import { NextResponse } from "next/server"

// Simulation de l'appel aux fonctions OpenFaaS
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { username, email } = body

    if (!username || !email) {
      return NextResponse.json({ message: "Le nom d'utilisateur et l'email sont requis" }, { status: 400 })
    }

    // Simulation de l'appel à la fonction OpenFaaS de génération de mot de passe
    // Dans un environnement réel, cela appellerait l'API OpenFaaS
    const passwordResponse = await generatePassword(username)

    // Simulation de l'appel à la fonction OpenFaaS de génération de TOTP
    const totpResponse = await generateTOTP(username)

    return NextResponse.json({
      success: true,
      username,
      passwordQr: passwordResponse.qrCode,
      totpQr: totpResponse.qrCode,
    })
  } catch (error) {
    console.error("Error in register API:", error)
    return NextResponse.json({ message: "Une erreur est survenue lors de l'inscription" }, { status: 500 })
  }
}

// Simulation des fonctions OpenFaaS
async function generatePassword(username: string) {
  // Dans un environnement réel, cela appellerait l'API OpenFaaS
  // Simulation d'un QR code contenant un mot de passe
  return {
    success: true,
    qrCode: `otpauth://totp/COFRAP:${username}?secret=JBSWY3DPEHPK3PXP&issuer=COFRAP&algorithm=SHA1&digits=6&period=30`,
  }
}

async function generateTOTP(username: string) {
  // Dans un environnement réel, cela appellerait l'API OpenFaaS
  // Simulation d'un QR code pour l'authentification TOTP
  return {
    success: true,
    qrCode: `otpauth://totp/COFRAP:${username}?secret=HXDMVJECJJWSRB3HWIZR4IFUGFTMXBOZ&issuer=COFRAP&algorithm=SHA1&digits=6&period=30`,
  }
}
