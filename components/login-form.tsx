"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { User, Lock, KeyRound } from "lucide-react"

interface LoginFormProps {
  onSuccess: () => void
  onError: (message: string) => void
  onExpired: (data: any) => void
}

export default function LoginForm({ onSuccess, onError, onExpired }: LoginFormProps) {
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [totpCode, setTotpCode] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!username || !password || !totpCode) {
      onError("Veuillez remplir tous les champs")
      return
    }

    setIsLoading(true)

    try {
      // Simulation d'appel à l'API OpenFaaS
      const response = await fetch("/api/auth", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, password, totpCode }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || "Erreur d'authentification")
      }

      if (data.expired) {
        onExpired(data)
      } else {
        onSuccess()
      }
    } catch (error) {
      onError(error instanceof Error ? error.message : "Une erreur est survenue")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="username">Nom d'utilisateur</Label>
        <div className="relative">
          <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 h-4 w-4" />
          <Input
            id="username"
            type="text"
            placeholder="Entrez votre nom d'utilisateur"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">Mot de passe</Label>
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 h-4 w-4" />
          <Input
            id="password"
            type="password"
            placeholder="Entrez votre mot de passe"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="totp">Code d'authentification (2FA)</Label>
        <div className="relative">
          <KeyRound className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 h-4 w-4" />
          <Input
            id="totp"
            type="text"
            placeholder="Entrez votre code 2FA"
            value={totpCode}
            onChange={(e) => setTotpCode(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? "Authentification..." : "Se connecter"}
      </Button>
    </form>
  )
}
