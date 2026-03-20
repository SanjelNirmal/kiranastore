
import React, { useState, useEffect } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { translateText } from '../utils/translationHelper';

interface TranslateProps {
    text: string;
    className?: string;
    as?: any; // Allow rendering as generic tag
}

const Translate: React.FC<TranslateProps> = ({ text, className, as: Component = 'span' }) => {
    const { language } = useLanguage();
    const [display, setDisplay] = useState(text);
    const [prevText, setPrevText] = useState(text);

    // Reset display if the input text prop changes significantly (dynamic content change)
    if (text !== prevText) {
        setPrevText(text);
        setDisplay(text);
    }

    useEffect(() => {
        let isMounted = true;
        if (language === 'en') {
            setDisplay(text);
        } else {
            // Show current text (English) while loading, or a placeholder if preferred
            translateText(text, 'ne').then(res => {
                if (isMounted) setDisplay(res);
            });
        }
        return () => { isMounted = false; };
    }, [text, language]);

    return <Component className={className}>{display}</Component>;
};

export default Translate;
