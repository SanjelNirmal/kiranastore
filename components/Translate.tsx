
import React, { useState, useEffect, useRef } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { translateText } from '../utils/translationHelper';

interface TranslateProps {
    text: string;
    className?: string;
    as?: any; // Allow rendering as generic tag
}

// Module-level cache: lang -> text -> translated string (prevents repeated async requests)
const translationCache = new Map<string, string>();

const Translate: React.FC<TranslateProps> = ({ text, className, as: Component = 'span' }) => {
    const { language } = useLanguage();
    const [display, setDisplay] = useState(text);
    const pendingRef = useRef(false);

    useEffect(() => {
        if (language === 'en') {
            setDisplay(text);
            return;
        }

        const cacheKey = `${language}::${text}`;
        const cached = translationCache.get(cacheKey);
        if (cached !== undefined) {
            setDisplay(cached);
            return;
        }

        // Keep previous translation visible while fetching the new one
        let cancelled = false;
        pendingRef.current = true;
        translateText(text, 'ne').then(res => {
            if (!cancelled) {
                translationCache.set(cacheKey, res);
                setDisplay(res);
                pendingRef.current = false;
            }
        });

        return () => {
            cancelled = true;
        };
    }, [text, language]);

    return <Component className={className}>{display}</Component>;
};

export default Translate;
