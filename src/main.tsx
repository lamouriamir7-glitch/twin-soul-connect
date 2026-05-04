import { createRoot } from "react-dom/client";
import { Auth0Provider } from "@auth0/auth0-react";
import App from "./App.tsx";
import "./index.css";
import { LanguageProvider } from "./i18n/LanguageContext";

createRoot(document.getElementById("root")!).render(
  <Auth0Provider
    domain="dev-ii30ojv5xtugbd1u.eu.auth0.com"
    clientId="BhO9vrG9BU9kwvH0BeWnECT5CbSXpXcy"
    authorizationParams={{
      redirect_uri: window.location.origin,
    }}
  >
    <LanguageProvider>
      <App />
    </LanguageProvider>
  </Auth0Provider>
);
