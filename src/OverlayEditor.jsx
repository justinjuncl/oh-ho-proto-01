import { useLayoutEffect } from "react"
import { Leva, LevaPanel, button, useControls, useCreateStore } from "leva";

import { useStore, useTreeStore, useColorStore, download } from "Storage";

function setHighlightColor(color, moduleType) {
    [...document.getElementsByClassName("react-flow__renderer")].forEach((el) => {
        el.style.setProperty(`--highlight-${moduleType}-color`, color);
    });
}


export const OverlayEditor = (props) => {
    const storeColor = useCreateStore();
    const storeDebug = useCreateStore();

    const moduleSelection = useStore(state => state.selection);

    const setTree = useTreeStore(state => state.setTree);

    const color = useColorStore(state => state.color);
    const setColor = useColorStore(state => state.setColor);

    const [, setDebug] = useControls(() => ({
        Selection: {
            value: JSON.stringify(moduleSelection, null, 2),
            editable: false
        }
    }), { store: storeDebug }, []);

    const [_color, setColorControls] = useControls(() => ({
        background: color.background,
        axis: color.axis,
        grid: color.grid,
        T_start: color.T_start,
        T_end: color.T_end,
        T_highlight: color.T_highlight,
        R_start: color.R_start,
        R_end: color.R_end,
        R_highlight: color.R_highlight,
    }), { store: storeColor }, []);

    const [{ userLoadedTreeJSON }, setUserLoadedTreeJSON] = useControls(() => ({
        userLoadedTreeJSON: {
            label: "Load JSON",
            image: undefined
        },
        "Export JSON": button(() => {
            download({ tree: useTreeStore.getState().tree, color: useColorStore.getState().color }, "export.json", "application/json");
        }),
    }), { store: storeColor }, []);

    useLayoutEffect(() => {
        setDebug({
            Selection: JSON.stringify({
                module_name: moduleSelection?.object?.name,
            }, null, 2)
        });
    }, [moduleSelection, setDebug]);

    useLayoutEffect(() => {
        if (userLoadedTreeJSON) {
            const reader = new FileReader();

            reader.onload = () => {
                setUserLoadedTreeJSON({
                    userLoadedTreeJSON: undefined
                });

                const result = JSON.parse(reader.result);

                if (result.color) {
                    setColorControls(result.color);
                    setColor(result.color);
                }
                if (result.tree) {
                    setTree(result.tree);
                }
            }

            reader.readAsText(userLoadedTreeJSON);
        }
    }, [setColorControls, setColor, setTree, setUserLoadedTreeJSON, userLoadedTreeJSON]);

    useLayoutEffect(() => {
        setColor(_color);
    }, [setColor, _color]);

    useLayoutEffect(() => {
        setHighlightColor(_color.T_highlight, "t");
        setHighlightColor(_color.R_highlight, "r");
    }, [_color.T_highlight, _color.R_highlight]);

    return (
        <div
            style={{
                position: "fixed",
                zIndex: 100,
                pointerEvents: "none",
                width: "100%",
                display: "inline-flex",
                gap: 18,
                alignItems: "start"
            }}
        >
            <div
                style={{
                    pointerEvents: "auto",
                    width: 273,
                }}
            >
                <Leva fill />
                <LevaPanel store={storeDebug} fill titleBar={false} />
            </div>
            <div
                style={{
                    pointerEvents: "auto",
                    width: 273,
                }}
            >
                <LevaPanel store={storeColor} fill titleBar={false} />
            </div>
        </div>
    );
}
