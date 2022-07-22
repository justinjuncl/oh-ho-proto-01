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

    const setTreeData = useTreeStore(state => state.setTreeData);

    const colorData = useColorStore(state => state.colorData);
    const setColorData = useColorStore(state => state.setColorData);

    const [, setDebug] = useControls(() => ({
        Selection: {
            value: JSON.stringify(moduleSelection, null, 2),
            editable: false
        }
    }), { store: storeDebug }, [moduleSelection]);

    const [color, setColorControls] = useControls(() => ({
        background: colorData.background,
        axis: colorData.axis,
        grid: colorData.grid,
        T_start: colorData.T_start,
        T_end: colorData.T_end,
        T_highlight: colorData.T_highlight,
        R_start: colorData.R_start,
        R_end: colorData.R_end,
        R_highlight: colorData.R_highlight,
    }), { store: storeColor }, [colorData]);

    const [{ userLoadedTreeJSON }, setUserLoadedTreeJSON] = useControls(() => ({
        userLoadedTreeJSON: {
            label: "Load JSON",
            image: undefined
        },
        "Export JSON": button(() => {
            download({ tree: useTreeStore.getState().treeData, color: useColorStore.getState().colorData }, "export.json", "application/json");
        }),
    }), { store: storeColor });

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
                    setColorData(result.color);
                }
                if (result.tree) {
                    setTreeData(result.tree);
                }
            }

            reader.readAsText(userLoadedTreeJSON);
        }
    }, [setColorControls, setColorData, setTreeData, setUserLoadedTreeJSON, userLoadedTreeJSON]);

    useLayoutEffect(() => {
        setColorData(color);
    }, [setColorData, color]);

    useLayoutEffect(() => {
        setHighlightColor(color.T_highlight, "t");
        setHighlightColor(color.R_highlight, "r");
    }, [color.T_highlight, color.R_highlight]);

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
