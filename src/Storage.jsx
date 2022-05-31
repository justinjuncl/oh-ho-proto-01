import { useState } from "react";
import create from "zustand";

// https://www.30secondsofcode.org/react/s/use-local-storage
export const useLocalStorage = (key, defaultValue) => {
    const [storedValue, setStoredValue] = useState(() => {
        try {
            const value = window.localStorage.getItem(key);

            if (value) {
                return JSON.parse(value);
            } else {
                window.localStorage.setItem(key, JSON.stringify(defaultValue));
                return defaultValue;
            }
        } catch (err) {
            return defaultValue;
        }
    });

    const setValue = newValue => {
        try {
            window.localStorage.setItem(key, JSON.stringify(newValue));
        } catch (err) { }
        setStoredValue(newValue);
    };

    return [storedValue, setValue];
};

export const useStore = create(set => ({
    selection: {},
    setSelection: (selection) => set({ selection: selection })
}));

export function download(data, filename, type) {
    if (type.includes('json')) {
        data = JSON.stringify(data, null, 2);
    }

    let file = new Blob([data], { type: type });
    let a = document.createElement('a');
    let url = URL.createObjectURL(file);

    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    setTimeout(function() {
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
    }, 0);
}

