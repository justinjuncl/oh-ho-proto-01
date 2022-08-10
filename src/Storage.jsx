import { useState } from "react";
import create from "zustand";
import { persist, devtools } from "zustand/middleware";

import exampleData from "assets/exampleData.json";

const exampleSensorData = {
    nodeData: {},
    edgeData: {
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
        treeData: exampleData.tree,
        setTreeData: (treeData) => set({ treeData }),
    }),
    { name: "treeData" }
)));

export const useColorStore = create(devtools(persist(
    (set, get) => ({
        colorData: exampleData.color,
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

export const useSensorStore = create(devtools(persist(
    (set, get) => ({
        nodeData: exampleSensorData.nodeData,
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
        },
        edgeData: exampleSensorData.edgeData,
        setEdgeData: (edges) => {
            set(state => ({
                edgeData: {
                    ...state.edgeData,
                    ...edges
                }
            }));
        },
        setSingleEdgeData: (edge) => {
            set(state => ({
                edgeData: {
                    ...state.edgeData,
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
        removeEdgeData: (id) => {
            set(state => ({
                edgeData: (({ [id]: _, ...o }) => o)(state.edgeData)
            }));
        }
    }),
    { name: "sensorData" }
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

