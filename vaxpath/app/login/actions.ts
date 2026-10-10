"use server"

import { AuthError } from "next-auth"
import { signIn } from "@/auth"

export async function loginAction(_prev: { error?: boolean } | undefined, formData: FormData) {
  try {
    await signIn("credentials", {
      email: formData.get("email"),
      password: formData.get("password"),
      redirectTo: "/home",
    })
  } catch (error) {
    if (error instanceof AuthError) return { error: true }
    throw error
  }
  return {}
}
