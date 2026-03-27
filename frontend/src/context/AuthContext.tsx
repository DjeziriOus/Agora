"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import type { User } from "@/types";

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isSeller: boolean;
  isLoading: boolean;
  /** true when the server rejected login specifically because email is unverified */
  emailNotVerified: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    role: "buyer" | "seller";
  }) => Promise<void>;
  logout: () => Promise<void>;
  resendVerification: (email: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

/** Map Better Auth session user → our User type */
function mapUser(sessionUser: Record<string, unknown>): User {
  return {
    id: sessionUser.id as string,
    email: sessionUser.email as string,
    firstName: (sessionUser.firstName as string) ?? "",
    lastName: (sessionUser.lastName as string) ?? "",
    role: (sessionUser.role as "buyer" | "seller") ?? "buyer",
    emailVerified: Boolean(sessionUser.emailVerified),
    photo: (sessionUser.photo as string | undefined) ?? undefined,
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [emailNotVerified, setEmailNotVerified] = useState(false);
  const router = useRouter();

  // Hydrate session on mount
  useEffect(() => {
    authClient.getSession().then(({ data }) => {
      if (data?.user) {
        setUser(mapUser(data.user as Record<string, unknown>));
      }
      setIsLoading(false);
    });
  }, []);

  const login = useCallback(
    async (email: string, password: string) => {
      setIsLoading(true);
      setEmailNotVerified(false);

      const { data, error } = await authClient.signIn.email({ email, password });

      setIsLoading(false);

      if (error) {
        // Better Auth returns this code when email is not verified
        if (
          error.code === "EMAIL_NOT_VERIFIED" ||
          error.status === 403 ||
          (error.message ?? "").toLowerCase().includes("verif")
        ) {
          setEmailNotVerified(true);
          return;
        }
        throw new Error(error.message ?? "Une erreur est survenue");
      }

      if (data?.user) {
        const mapped = mapUser(data.user as Record<string, unknown>);
        setUser(mapped);
        router.push(mapped.role === "seller" ? "/vendeur" : "/catalogue");
      }
    },
    [router]
  );

  const register = useCallback(
    async (data: {
      firstName: string;
      lastName: string;
      email: string;
      password: string;
      role: "buyer" | "seller";
    }) => {
      setIsLoading(true);

      const { error } = await authClient.signUp.email({
        email: data.email,
        password: data.password,
        name: `${data.firstName} ${data.lastName}`,
        firstName: data.firstName,
        lastName: data.lastName,
        role: data.role,
      } as Parameters<typeof authClient.signUp.email>[0]);

      setIsLoading(false);

      if (error) {
        throw new Error(error.message ?? "Une erreur est survenue lors de l'inscription");
      }
      // Success — caller handles the UI message (no redirect)
    },
    []
  );

  const logout = useCallback(async () => {
    await authClient.signOut();
    setUser(null);
    router.push("/login");
  }, [router]);

  const resendVerification = useCallback(async (email: string) => {
    const { error } = await authClient.sendVerificationEmail({
      email,
      callbackURL: "/verify-email",
    });
    if (error) throw new Error(error.message ?? "Impossible d'envoyer l'email");
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isSeller: user?.role === "seller",
        isLoading,
        emailNotVerified,
        login,
        register,
        logout,
        resendVerification,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
