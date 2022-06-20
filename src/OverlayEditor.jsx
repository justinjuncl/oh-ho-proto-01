import { useLayoutEffect } from "react"
import { useControls } from "leva";

import { useStore, useTreeStore, useLocalStorage, download, exampleColor } from "./Storage";
import { Leva, LevaPanel, button } from "leva";


export const useOverlayEditor = (storeColor, storeDebug) => {
    const moduleSelection = useStore(store => store.selection);
    const treeData = useTreeStore(store => store.treeData);
    const setTreeData = useTreeStore(store => store.setTreeData);

    const [colorData, setColorData] = useLocalStorage("colorData", exampleColor);

    const [, setDebug] = useControls(() => ({
        Selection: {
            value: JSON.stringify(moduleSelection, null, 2),
            editable: false
        }
    }), { store: storeDebug }, [moduleSelection]);

    const [color,] = useControls(() => ({
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
            label: 'Load JSON',
            image: undefined
        },
        'Export JSON': button(() => {
            download({ tree: treeData, color }, 'export.json', 'application/json');
        }),
    }), { store: storeColor }, [treeData, color]);

    useLayoutEffect(() => {
        setDebug({
            Selection: JSON.stringify({
                module_name: moduleSelection?.object?.name,
                select_face: moduleSelection?.face
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
                setColorData(result.color);
                setTreeData(result.tree);
            }

            reader.readAsText(userLoadedTreeJSON);
        }
    }, [userLoadedTreeJSON, setColorData, setTreeData, setUserLoadedTreeJSON]);

    useLayoutEffect(() => {
        setColorData(color);
    }, [color, setColorData]);
}


export const OverlayEditor = ({ storeColor, storeDebug }) => {
    return (
        <div
            style={{
                position: 'fixed',
                zIndex: 100,
                pointerEvents: 'none',
                width: '100%',
                padding: 10,
                display: 'inline-flex',
                gap: 10,
                alignItems: 'start'
            }}
        >
            <div
                style={{
                    pointerEvents: 'auto',
                    width: 300,
                }}
            >
                <Leva fill />
                <LevaPanel store={storeDebug} fill titleBar={false} />
            </div>
            <div
                style={{
                    pointerEvents: 'auto',
                    width: 300,
                }}
            >
                <LevaPanel store={storeColor} fill titleBar={false} />
            </div>
        </div>
    );
}
