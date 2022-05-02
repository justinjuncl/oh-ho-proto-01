// https://blog.logrocket.com/using-localstorage-react-hooks/

import { useState, useEffect } from "react";

export function getStorageValue(key, defaultValue) {
    if (typeof window !== "undefined") {
        const saved = localStorage.getItem(key);
        const initial = saved !== null ? JSON.parse(saved) : defaultValue;
        return initial;
    }
}

export function setStorageValue(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
}

export const useLocalStorage = (key, defaultValue) => {
    const [value, setValue] = useState(() => {
        return getStorageValue(key, defaultValue);
    });

    useEffect(() => {
        setStorageValue(key, value);
    }, [key, value]);

    return [value, setValue];
};
