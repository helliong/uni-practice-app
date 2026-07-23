"use client";

import { useEffect, useState } from "react";
import "./CookieBanner.scss";

const COOKIE_CONSENT_KEY = "campus-code-cookie-consent";

export default function CookieBanner() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(localStorage.getItem(COOKIE_CONSENT_KEY) !== "accepted");
  }, []);

  const acceptCookies = () => {
    localStorage.setItem(COOKIE_CONSENT_KEY, "accepted");
    setIsVisible(false);
  };

  if (!isVisible) {
    return null;
  }

  return (
    <section className="cookie-banner" aria-label="Уведомление о куки">
      <div className="cookie-banner__content">
        <p>
          Мы используем куки, чтобы сайт работал стабильнее и покупки были
          удобнее.
        </p>
        <button type="button" onClick={acceptCookies}>
          Понятно
        </button>
      </div>
    </section>
  );
}
