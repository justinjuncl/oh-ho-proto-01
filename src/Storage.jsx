import { useState } from "react";
import create from "zustand";
import { persist, devtools } from "zustand/middleware";

import exampleData from "assets/exampleData.json";

const exampleSensorData = {
    nodes: {},
    edges: {
        "E_s0-0": {
            source: "s0",
            sourceHandle: "source_0",
            target: "0",
            targetHandle: "target_value",
            type: "Sensor0"
        }
    },
}

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
})));

export const useTreeStore = create(devtools(persist(
    (set, get) => ({
        tree: exampleData.tree,
        setTree: (tree) => set({ tree }),
    }),
    { name: "tree" }
)));

export const useColorStore = create(devtools(persist(
    (set, get) => ({
        color: exampleData.color,
        setColor: (color) => set({ color }),
    }),
    { name: "color" }
)));

export const useNodeStore = create(devtools(persist(
    (set, get) => ({
        nodes: {},
        setNodes: (nodes) => {
            set(state => ({
                nodes: {
                    ...state.nodes,
                    ...nodes
                }
            }));
        },
        setNode: (node) => {
            set(state => ({
                nodes: {
                    ...state.nodes,
                    [node.id]: { value: node.value }
                }
            }));
        },
        removeNode: (id) => {
            set(state => ({
                nodes: (({ [id]: _, ...o }) => o)(state.nodes)
            }));
        }
    }),
    { name: "node" }
)));

export const useSensorStore = create(devtools(persist(
    (set, get) => ({
        nodes: exampleSensorData.nodes,
        setNodes: (nodes) => {
            set(state => ({
                nodes: {
                    ...state.nodes,
                    ...nodes
                }
            }));
        },
        setNode: (node) => {
            set(state => ({
                nodes: {
                    ...state.nodes,
                    [node.id]: { value: node.value }
                }
            }));
        },
        removeNode: (id) => {
            set(state => ({
                nodes: (({ [id]: _, ...o }) => o)(state.nodes)
            }));
        },
        edges: exampleSensorData.edges,
        setEdges: (edges) => {
            set(state => ({
                edges: {
                    ...state.edges,
                    ...edges
                }
            }));
        },
        setEdge: (edge) => {
            set(state => ({
                edges: {
                    ...state.edges,
                    [edge.id]: {
                        source: edge.source,
                        sourceHandle: edge.sourceHandle,
                        target: edge.target,
                        targetHandle: edge.targetHandle,
                        type: edge.type
                    }
                }
            }));
        },
        removeEdge: (id) => {
            set(state => ({
                edges: (({ [id]: _, ...o }) => o)(state.edges)
            }));
        }
    }),
    { name: "sensor" }
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

