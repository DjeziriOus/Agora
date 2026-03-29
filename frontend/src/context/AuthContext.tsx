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
import { apiFetch } from "@/lib/api";
import type { User } from "@/types";

const PENDING_VERIFICATION_EMAIL_STORAGE_KEY = "agora_pending_verification_email";

type AuthConfigResponse = {
  requireEmailVerification: boolean;
};

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isSeller: boolean;
  isLoading: boolean;
  isAuthConfigLoading: boolean;
  requireEmailVerification: boolean;
  /** true when the server rejected login specifically because email is unverified */
  emailNotVerified: boolean;
  pendingVerificationEmail: string | null;
  clearEmailNotVerified: () => void;
  ensureAuthConfig: () => Promise<boolean>;
  setPendingVerificationEmail: (email: string) => void;
  clearPendingVerificationEmail: () => void;
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
  const [isAuthConfigLoading, setIsAuthConfigLoading] = useState(true);
  const [requireEmailVerification, setRequireEmailVerification] = useState(true);
  const [emailNotVerified, setEmailNotVerified] = useState(false);
  const [pendingVerificationEmailState, setPendingVerificationEmailState] =
    useState<string | null>(null);
  const router = useRouter();

  const ensureAuthConfig = useCallback(async () => {
    try {
      const data = await apiFetch<AuthConfigResponse>("/api/public/auth-config");
      setRequireEmailVerification(data.requireEmailVerification);
      return data.requireEmailVerification;
    } catch {
      // Fail closed: keep verification enabled in the UI when config cannot be loaded.
      return true;
    } finally {
      setIsAuthConfigLoading(false);
    }
  }, []);

  const setPendingVerificationEmail = useCallback((email: string) => {
    setPendingVerificationEmailState(email);

    try {
      window.sessionStorage.setItem(PENDING_VERIFICATION_EMAIL_STORAGE_KEY, email);
    } catch {
      // Ignore storage failures and keep the in-memory state.
    }
  }, []);

  const clearPendingVerificationEmail = useCallback(() => {
    setPendingVerificationEmailState(null);

    try {
      window.sessionStorage.removeItem(PENDING_VERIFICATION_EMAIL_STORAGE_KEY);
    } catch {
      // Ignore storage failures and keep the in-memory state cleared.
    }
  }, []);

  // Hydrate session on mount
  useEffect(() => {
    const initAuth = async () => {
      try {
        const { data } = await authClient.getSession();

        if (data?.user) {
          setUser(mapUser(data.user as Record<string, unknown>));
        } else {
          setUser(null);
        }
      } catch {
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();
    void ensureAuthConfig();

    try {
      const storedEmail = window.sessionStorage.getItem(
        PENDING_VERIFICATION_EMAIL_STORAGE_KEY
      );
      if (storedEmail) {
        setPendingVerificationEmailState(storedEmail);
      }
    } catch {
      // Ignore storage failures and keep the pending email empty.
    }
  }, [ensureAuthConfig]);

  const login = useCallback(
    async (email: string, password: string) => {
      setIsLoading(true);
      setEmailNotVerified(false);
      clearPendingVerificationEmail();

      const { data, error } = await authClient.signIn.email({ email, password });

      setIsLoading(false);

      if (error) {
        // Better Auth returns this code when email is not verified
        if (
          error.code === "EMAIL_NOT_VERIFIED" ||
          error.status === 403 ||
          (error.message ?? "").toLowerCase().includes("verif")
        ) {
          setPendingVerificationEmail(email);
          setEmailNotVerified(true);
          return;
        }
        throw new Error(error.message ?? "Une erreur est survenue");
      }

      // On success, remap the Better Auth user payload to our own User model,
      // then redirect to the appropriate page based on the user's role.
      if (data?.user) {
        const mapped = mapUser(data.user as Record<string, unknown>);
        setUser(mapped);
        router.push(mapped.role === "seller" ? "/vendeur" : "/catalogue");
      }
    },
    [clearPendingVerificationEmail, router, setPendingVerificationEmail]
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

      //Handle register errors
      if (error) {
        if (error.code === "USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL") {
          throw new Error(
            "Cette adresse e-mail est déjà utilisée. Veuillez en choisir une autre."
          );
        } else {
          throw new Error(error.message ?? "Une erreur est survenue");
        }
      }
      // Success — caller handles the UI message (no redirect)
    },
    []
  );

  const logout = useCallback(async () => {
    await authClient.signOut();
    setUser(null);
    clearPendingVerificationEmail();
    router.push("/login");
  }, [clearPendingVerificationEmail, router]);

  const clearEmailNotVerified = useCallback(() => {
    setEmailNotVerified(false);
  }, []);

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
        isAuthConfigLoading,
        requireEmailVerification,
        emailNotVerified,
        pendingVerificationEmail: pendingVerificationEmailState,
        clearEmailNotVerified,
        ensureAuthConfig,
        setPendingVerificationEmail,
        clearPendingVerificationEmail,
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
