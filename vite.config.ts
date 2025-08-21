import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

// Load environment variables and make them available as keys
export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory
  const env = loadEnv(mode, process.cwd(), "");

  return {
    plugins: [react()],
    optimizeDeps: {
      exclude: ["lucide-react"],
    },
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
    define: {
      // Make selected env variables available as keys
      "import.meta.env.VITE_SUPABASE_ANON_KEY": JSON.stringify(
        env.VITE_SUPABASE_ANON_KEY
      ),
      "import.meta.env.VITE_SUPABASE_URL": JSON.stringify(
        env.VITE_SUPABASE_URL
      ),
      "import.meta.env.VITE_SMSAPI_OAUTH_TOKEN": JSON.stringify(
        env.VITE_SMSAPI_OAUTH_TOKEN
      ),
      "import.meta.env.VITE_INFOBIP_API_KEY": JSON.stringify(
        env.VITE_INFOBIP_API_KEY
      ),
      "import.meta.env.VITE_GOOGLE_MAPS_API_KEY": JSON.stringify(
        env.VITE_GOOGLE_MAPS_API_KEY
      ),
    },
  };
});
