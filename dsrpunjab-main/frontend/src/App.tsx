import AppRoutes from "./routes/AppRoutes";
import { AuthProvider } from "./security/auth.context";
import SiteAssistant from "./features/site-assistant/SiteAssistant";
import WebsiteLanguageSelector from "./components/ui/WebsiteLanguageSelector";

export default function App() {
  return (
    <AuthProvider>
      <WebsiteLanguageSelector />
      <AppRoutes />
      <SiteAssistant />
    </AuthProvider>
  );
}
