import React, { useState } from "react";
import { Mail, Lock, AlertCircle } from "lucide-react";
import { useTranslation } from "react-i18next";
import { supabase } from "../lib/supabase";
import logo from "../assets/logo-dark.png";

interface LoginProps {
  onLogin: () => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const { t } = useTranslation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showCreateAccount, setShowCreateAccount] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        if (error.message.includes("Invalid login credentials")) {
          setError(t("login.invalidCredentials"));
          setShowCreateAccount(true);
        } else {
          throw error;
        }
        return;
      }

      if (data.user) {
        onLogin();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : t("login.loginFailed"));
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignUp = async () => {
    if (!email || !password) {
      setError(t("login.enterBothFields"));
      return;
    }

    if (password.length < 8) {
      setError(t("login.passwordTooShort"));
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) throw error;

      if (data.user) {
        setError(t("login.accountCreated"));
        setShowCreateAccount(false);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : t("login.signUpFailed"));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center mobile-container py-8">
      <div className="max-w-md w-full">
        {/* Logo and Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center mb-4">
            <img src={logo} alt="Logo" className="h-16 w-auto object-contain" />
          </div>
          <p className="text-gray-600">{t("login.subtitle")}</p>
        </div>

        {/* Login Form */}
        <div className="mobile-card rounded-2xl shadow-xl border-gray-100">
          <form onSubmit={handleLogin} className="space-y-6">
            {/* Email Field */}
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                {t("login.emailAddress")}
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={t("login.emailPlaceholder")}
                  className="mobile-input pl-10 mobile-input-icon"
                  required
                  autoComplete="email"
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                {t("login.password")}
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={t("login.passwordPlaceholder")}
                  className="mobile-input mobile-input-icon"
                  required
                  autoComplete="current-password"
                  minLength={8}
                />
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div
                className={`flex items-center p-4 rounded-lg ${
                  error.includes(t("login.accountCreated"))
                    ? "bg-green-50 border border-green-200"
                    : "bg-red-50 border border-red-200"
                }`}
              >
                <AlertCircle
                  className={`h-5 w-5 mr-2 flex-shrink-0 ${
                    error.includes(t("login.accountCreated"))
                      ? "text-green-600"
                      : "text-red-600"
                  }`}
                />
                <p
                  className={`text-sm ${
                    error.includes(t("login.accountCreated"))
                      ? "text-green-800"
                      : "text-red-800"
                  }`}
                >
                  {error}
                </p>
              </div>
            )}

            {/* Login Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full mobile-button justify-center bg-blue-600 text-white hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  {t("login.signingIn")}
                </>
              ) : (
                t("login.signIn")
              )}
            </button>

            {/* Create Account Section */}
            {showCreateAccount && (
              <div className="space-y-3">
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-300" />
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-2 bg-white text-gray-500">
                      {t("login.or")}
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleSignUp}
                  disabled={isLoading}
                  className="w-full mobile-button justify-center bg-gray-100 text-gray-700 hover:bg-gray-200 focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {t("login.createNewAccount")}
                </button>
              </div>
            )}
          </form>
        </div>

        {/* Footer */}
        <div className="text-center mt-8">
          <p className="text-sm text-gray-500">{t("login.footer")}</p>
        </div>
      </div>
    </div>
  );
};

export default Login;
