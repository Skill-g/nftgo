"use client";

import { I18nProvider } from "@lingui/react";
import { i18n } from "@lingui/core";
import { useEffect } from "react";

export default function LinguiClientProvider({
                                                 locale,
                                                 messages,
                                                 children,
                                             }: {
    locale: "ru" | "en";
    messages: Record<string, string>;
    children: React.ReactNode;
}) {
    useEffect(() => {
        i18n.load({ [locale]: messages });
        i18n.activate(locale);
    }, [locale, messages]);

    return <I18nProvider i18n={i18n}>{children}</I18nProvider>;
}