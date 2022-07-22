import { useState } from "react";
import create from "zustand";
import { persist, devtools } from "zustand/middleware";

export const exampleTree = {
    id: 0,
    face: 0,
    moduleType: "T",
    value: 0,
    children: [{
        id: 15,
        face: 2,
        moduleType: "R",
        value: 0,
        children: [{
            id: 25,
            face: 1,
            moduleType: "R",
            value: 0,
            children: [],
        }],
    }, {
        id: 16,
        face: 3,
        moduleType: "R",
        value: 0,
        children: [{
            id: 26,
            face: 1,
            moduleType: "R",
            value: 0,
            children: [],
        }],

    }],
};

export const exampleColor = {
    background: "#111111",
    axis: "#151515",
    grid: "#060606",
    T_start: "#85AA85",
    T_end: "#384938",
    T_highlight: "#282cce",
    R_start: "#85AA85",
    R_end: "#384938",
    R_highlight: "#e5851b",
};

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

export const useStore = create(devtools(set => ({
    selection: {},
    setSelection: (selection) => set({ selection }),

    shouldRenderFlag: true,
    shouldRender: (shouldRenderFlag = true) => set({ shouldRenderFlag })
})));


export const useTreeStore = create(devtools(persist(
    (set, get) => ({
        treeData: exampleTree,
        setTreeData: (treeData) => set({ treeData }),
    }),
    { name: "treeData" }
)));

export const useColorStore = create(devtools(persist(
    (set, get) => ({
        colorData: exampleColor,
        setColorData: (colorData) => set({ colorData }),
    }),
    { name: "colorData" }
)));


export const useNodeStore = create(devtools(persist(
    (set, get) => ({
        nodeData: {},
        setNodeData: (nodes) => {
            set(state => ({
                nodeData: {
                    ...state.nodeData,
                    ...nodes
                }
            }));
        },
        setSingleNodeData: (node) => {
            set(state => ({
                nodeData: {
                    ...state.nodeData,
                    [node.id]: { value: node.value }
                }
            }));
        },
        removeNodeData: (id) => {
            set(state => ({
                nodeData: (({ [id]: _, ...o }) => o)(state.nodeData)
            }));
        }
    }),
    { name: "nodeData" }
)));

export function download(data, filename, type) {
    if (type.includes("json")) {
        data = JSON.stringify(data, null, 2);
    }

    let file = new Blob([data], { type: type });
    let a = document.createElement("a");
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

