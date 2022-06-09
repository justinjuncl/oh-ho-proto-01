import { useLayoutEffect, useMemo, Suspense } from "react"
import { Canvas } from "@react-three/fiber";
import { softShadows, OrbitControls } from "@react-three/drei";
import { EffectComposer, Outline, Selection, Vignette } from "@react-three/postprocessing";

import { LevaStoreProvider, useControls, useCreateStore, folder, button } from "leva";

import { useLocalStorage, useStore, download } from "./Storage";
import { ModuleTree } from "./Modules";
import { NodeEditor } from "./NodeEditor";
import { OverlayEditor } from "./OverlayEditor";

import "./App.css";
import "./node-editor.css";

// softShadows();

const exampleTree = {
    id: 0,
    face: 0,
    moduleType: 'T',
    value: 0,
    children: [{
        id: 15,
        face: 2,
        moduleType: 'R',
        value: 0,
        children: [{
            id: 25,
            face: 1,
            moduleType: 'R',
            value: 0,
            children: [],
        }],
    }, {
        id: 16,
        face: 3,
        moduleType: 'R',
        value: 0,
        children: [{
            id: 26,
            face: 1,
            moduleType: 'R',
            value: 0,
            children: [],
        }],

    }],
};

const exampleColor = {
    background: '#111111',
    axis: '#151515',
    grid: '#060606',
    T_start: '#85AA85',
    T_end: '#384938',
    T_highlight: '#282cce',
    R_start: '#85AA85',
    R_end: '#384938',
    R_highlight: '#e5851b',
};

const getTreeFolder = (tree, treeName, moduleSelection) => {
    let childTreeFolder = tree.children.map(n => ({
        ['Module_' + n.id]: getTreeFolder(n, treeName + '_' + n.id, moduleSelection),
    }));

    let _folder = folder(Object.assign({
        ['face_' + treeName]: { label: 'face', value: tree.face, options: [0, 1, 2, 3, 4] },
        ['moduleType_' + treeName]: { label: 'moduleType', value: tree.moduleType, options: ['T', 'R'] },
        ['value_' + treeName]: { label: 'value', value: tree.value, min: 0, max: 1 },
    },
        ...childTreeFolder
    ), {
        collapsed: false,
        color: 'Module_' + tree.id === moduleSelection?.object?.name ? 'yellow' : 'white'
    });

    return _folder;
};


const parseFromTreeValues = (treeValues) => {
    const table = [];
    for (const key in treeValues) {
        if (key.includes('face')) {
            let nodes = key.substring(5).split('_')

            let id = Number(nodes[nodes.length - 1]);
            let face = treeValues[key];
            let moduleType = treeValues[key.replace('face', 'moduleType')];
            let value = treeValues[key.replace('face', 'value')];

            if (nodes.length === 1) {
                table.push({ id, face, moduleType, value, children: [] });
            } else {
                table.push({ id, parent_id: Number(nodes[nodes.length - 2]), face, moduleType, value, children: [] });
            }
        }
    }

    let node_map = {}, roots = [], node;
    for (let i = 0; i < table.length; i++) {
        node = table[i];
        node_map[node.id] = i;

        if (i === 0) {
            roots.push(node);
        } else {
            table[node_map[node.parent_id]].children.push(node);
        }

        delete node.parent_id;
    }

    return roots[0];
};

const Scene = ({ tree, storeColor, ...props }) => {
    const background = storeColor.get('background');
    const axis = storeColor.get('axix');
    const grid = storeColor.get('grid');

    const setSelection = useStore(state => state.setSelection);

    // const s = [];
    // if (selection?.object) {
    //     s.push(selection.object.children[0]);
    // }
    //
    // console.log(s);
    // console.log(1);

    return (
        <Canvas
            camera={{ position: [-5, 2, 10], fov: 60 }}
            onPointerMissed={(e) => {
                if (e.button === 0) {
                    setSelection({});
                }
            }}
        >
            {/* <EffectComposer> */}
            {/*     <Vignette */}
            {/*         offset={0.1} // vignette offset */}
            {/*         darkness={1} // vignette darkness */}
            {/*         eskil={false} // Eskil's vignette technique */}
            {/*     /> */}
            {/* </EffectComposer> */}
            <Suspense fallback={null} >
                <LevaStoreProvider store={storeColor}>
                    <color attach="background" args={[background]} />

                    <ambientLight intensity={0.3} />
                    {/* <pointLight position={[0, 20, 0]} intensity={1.5} /> */}
                    <directionalLight
                        castShadow
                        position={[0, 20, 0]}
                        intensity={1.5}
                        shadow-mapSize-width={1024}
                        shadow-mapSize-height={1024}
                        shadow-camera-far={50}
                        shadow-camera-left={-10}
                        shadow-camera-right={10}
                        shadow-camera-top={10}
                        shadow-camera-bottom={-10}
                    />

                    <group>
                        {/* <group position={[0, 0.5, 0]} rotation={[0, 0, Math.PI]}> */}
                        <group>
                            <ModuleTree root={tree} />
                        </group>
                        <gridHelper args={[100, 20, axis, grid]} position={[0, 0, 0]} />
                    </group>
                    <OrbitControls />
                </LevaStoreProvider>
            </Suspense>
        </Canvas>
    );
};


export const useTree = (storeTree, storeColor, storeDebug) => {
    const moduleSelection = useStore(state => state.selection);

    // console.log('useTree');

    const [treeData, setTreeData] = useLocalStorage("treeData", exampleTree);
    const [colorData, setColorData] = useLocalStorage("colorData", exampleColor);

    const [, setDebug] = useControls(() => ({
        Selection: {
            value: JSON.stringify(moduleSelection, null, 2),
            editable: false
        }
    }), { store: storeDebug }, [moduleSelection]);

    const [treeValues,] = useControls(() => ({
        ['Module_' + treeData.id]: getTreeFolder(treeData, treeData.id, moduleSelection)
    }), { store: storeTree }, [treeData]);

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
            download({ tree: parseFromTreeValues(treeValues), color }, 'export.json', 'application/json');
        }),
    }), { store: storeColor }, [treeValues, color]);

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

    const tree = useMemo(() => parseFromTreeValues(treeValues), [treeValues]);

    useLayoutEffect(() => {
        setTreeData(tree);
    }, [tree, setTreeData]);

    useLayoutEffect(() => {
        setColorData(color);
    }, [color, setColorData]);

    return [tree, setTreeData];
}


const App = () => {
    const storeTree = useCreateStore();
    const storeColor = useCreateStore();
    const storeDebug = useCreateStore();

    const [tree, setTreeData] = useTree(storeTree, storeColor, storeDebug);

    return (
        <>
            <NodeEditor tree={tree} setTreeData={setTreeData} />
            <OverlayEditor storeTree={storeTree} storeColor={storeColor} storeDebug={storeDebug} />
            <Scene tree={tree} storeColor={storeColor} />
        </>
    );
};

export default App;
