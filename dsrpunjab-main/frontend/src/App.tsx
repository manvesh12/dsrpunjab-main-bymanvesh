import AppRoutes from "./routes/AppRoutes";
import { AuthProvider } from "./security/auth.context";
import SiteAssistant from "./features/site-assistant/SiteAssistant";

export default function App() {
  return (
    <AuthProvider>
      <AppRoutes />
      <SiteAssistant />
    </AuthProvider>
  );
}
