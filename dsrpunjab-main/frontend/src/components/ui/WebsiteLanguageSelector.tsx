import { Languages } from "lucide-react";
import { useEffect, useState } from "react";

type WebsiteLanguage = "en" | "pa";

const STORAGE_KEY = "dsr-website-language";
const COOKIE_NAME = "googtrans";

declare global {
  interface Window {
    google?: {
      translate?: {
        TranslateElement: new (
          options: { pageLanguage: string; includedLanguages: string; autoDisplay: boolean },
          elementId: string,
        ) => void;
      };
    };
    googleTranslateElementInit?: () => void;
  }
}

function readLanguage(): WebsiteLanguage {
  return localStorage.getItem(STORAGE_KEY) === "pa" ? "pa" : "en";
}

function expireTranslationCookie() {
  const expired = `${COOKIE_NAME}=;path=/;expires=Thu, 01 Jan 1970 00:00:00 GMT`;
  document.cookie = expired;
  if (window.location.hostname.includes(".")) {
    document.cookie = `${expired};domain=.${window.location.hostname}`;
  }
}

function enablePunjabiTranslation() {
  document.cookie = `${COOKIE_NAME}=/en/pa;path=/;max-age=31536000;SameSite=Lax`;
  if (window.location.hostname.includes(".")) {
    document.cookie = `${COOKIE_NAME}=/en/pa;path=/;max-age=31536000;domain=.${window.location.hostname};SameSite=Lax`;
  }
}

export default function WebsiteLanguageSelector() {
  const [language, setLanguage] = useState<WebsiteLanguage>(readLanguage);

  useEffect(() => {
    if (language !== "pa") return;

    enablePunjabiTranslation();
    document.documentElement.lang = "pa";

    window.googleTranslateElementInit = () => {
      const TranslateElement = window.google?.translate?.TranslateElement;
      if (TranslateElement && !document.querySelector("#google_translate_element select")) {
        new TranslateElement(
          { pageLanguage: "en", includedLanguages: "en,pa", autoDisplay: false },
          "google_translate_element",
        );
      }
    };

    if (window.google?.translate?.TranslateElement) {
      window.googleTranslateElementInit();
      return;
    }

    if (!document.getElementById("google-translate-script")) {
      const script = document.createElement("script");
      script.id = "google-translate-script";
      script.src = "https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit";
      script.async = true;
      document.head.appendChild(script);
    }
  }, [language]);

  function changeLanguage(nextLanguage: WebsiteLanguage) {
    if (nextLanguage === language) return;
    localStorage.setItem(STORAGE_KEY, nextLanguage);

    if (nextLanguage === "pa") enablePunjabiTranslation();
    else expireTranslationCookie();

    setLanguage(nextLanguage);
    window.location.reload();
  }

  return (
    <div className="website-language-selector notranslate" translate="no">
      <Languages size={16} aria-hidden="true" />
      <label className="sr-only" htmlFor="website-language">Website language</label>
      <select
        id="website-language"
        value={language}
        onChange={(event) => changeLanguage(event.target.value as WebsiteLanguage)}
        aria-label="Website language"
        title="Translate the complete website"
      >
        <option value="en">English</option>
        <option value="pa">ਪੰਜਾਬੀ</option>
      </select>
      <div id="google_translate_element" aria-hidden="true" />
    </div>
  );
}

