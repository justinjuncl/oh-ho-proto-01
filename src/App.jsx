import { useState, useEffect, useCallback, useMemo } from "react"
import { Canvas } from "@react-three/fiber";
import { softShadows, OrbitControls } from "@react-three/drei";

import { useLocalStorage } from "./Storage";
import { download } from "./utils";

import { ModuleTree } from "./Modules";

import { LevaPanel, LevaStoreProvider, useControls, useCreateStore, useStoreContext, folder, button } from "leva";

import "./App.css";

const closestParent = (group) => {
    let g = group.parent;
    while (g && g.type !== "Group") {
        g = g.parent;
    }
    return g;
};

const traverse = (scene) => {
    const table = [];
    scene.traverse( c => {
        if (c.name.includes('Module')) {
            table.push({id: c.id, parent_id: closestParent(c).id, face: c.face, moduleType: c.moduleType, value: c.value, children: []});
        }
    });

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

    let treeData = JSON.stringify(roots[0], null, 2);

    return treeData;
};

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


const getTreeFolder = (tree, treeName) => {
    console.log(tree);

    let childTreeFolder = tree.children.map(n => ({
        ['Module_' + n.id]: getTreeFolder(n, treeName + '_' + n.id),
    }));

    let _folder = folder(Object.assign({
            ['face_' + treeName]: { label: 'face', value: tree.face, options: [0, 1, 2, 3, 4, 5] },
            ['moduleType_' + treeName]: { label: 'moduleType', value: tree.moduleType, options: ['T', 'R'] },
            ['value_' + treeName]: { label: 'value', value: tree.value, min: 0, max: 1 }
        },
        ...childTreeFolder
    ));

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
                table.push({id, face, moduleType, value, children: []});
            } else {
                table.push({id, parent_id: Number(nodes[nodes.length - 2]), face, moduleType, value, children: []});
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

const flattenTreeData = (treeData) => {
    let treeValues = {};

    const dfs = (node, history) => {
        treeValues['face' + history + node.id] = node.face;
        treeValues['moduleType' + history + node.id] = node.moduleType;
        treeValues['value' + history + node.id] = node.value;

        for (const child of node.children) {
            dfs(child, history + node.id + '_');
        }
    };

    dfs(treeData, '_');
    return treeValues;
};

const resetModules = (store) => {
    const paths = store.getVisiblePaths();
    const toRemove = [];
    for (const path of paths) {
        if (path.includes('Module')) {
            toRemove.push(path);
        }
    }

    console.log(toRemove);
    // store.disposePaths(["Module_0.face_0", "Module_0.moduleType_0", "Module_0.value_0"]);
    store.disposePaths(toRemove);
};

const Scene = ({ tree, ...props }) => {
    const store = useStoreContext();
    
    const background = store.get('background');
    const axis = store.get('axix');
    const grid = store.get('grid');

    return (
        <Canvas
            camera={{ position: [-5, 2, 10], fov: 60 }}
            onCreated={(state) => traverse(state.scene)}
        >
            <LevaStoreProvider store={store}>
                <color attach="background" args={[background]} />

                <ambientLight intensity={0.3} />
                <pointLight position={[0, 20, 0]} intensity={1.5} />

                <group>
                    <group position={[0, 0, 0]}>
                        <ModuleTree root={tree}/>
                    </group>
                    <gridHelper args={[100, 20, axis, grid]} position={[0, 0, 0]} />
                </group>
                <OrbitControls />
            </LevaStoreProvider>
        </Canvas>
    );
};

const App = () => {
    const [, updateState] = useState();
    const forceUpdate = useCallback(() => updateState({}), []);

    console.log('render app');
    const [treeData, setTreeData] = useLocalStorage("treeData", exampleTree);
    const [colorData, setColorData] = useLocalStorage("colorData", exampleColor);

    const store = useCreateStore();

    const [ treeValues, ] = useControls(() => ({
        ['Module_' + treeData.id]: getTreeFolder(treeData, treeData.id)
    }), { store }, [treeData]);

    const [ colors, ] = useControls(() => ({
        background: colorData.background,
        axis: colorData.axis,
        grid: colorData.grid,
        T_start: colorData.T_start,
        T_end: colorData.T_end,
        T_highlight: colorData.T_highlight,
        R_start: colorData.R_start,
        R_end: colorData.R_end,
        R_highlight: colorData.R_highlight,
    }), { store }, [colorData]);

    const [{ userLoadedtreeJSON }, ] = useControls(() => ({
        userLoadedtreeJSON: {
            label: 'Load JSON',
            image: undefined
        },
        'Export JSON': button((get) => {
            const exportData = {
                tree: treeData,
                color: colors
            };

            download(JSON.stringify(exportData, null, 2), 'export.json', 'application/json');
        }, ),
    }), { store });

    useEffect(() => {
        if (userLoadedtreeJSON) {
            const reader = new FileReader();

            reader.onload = () => {
                const result = JSON.parse(reader.result);
                // const newTreeValues = flattenTreeData(result.tree);

                // resetModules(store);
                if (result.tree) {
                    setTreeData(result.tree);
                }
                if (result.color) {
                    setColorData(result.color);
                }
                console.log('update_before');
                // setTreeValues(newTreeValues);
                forceUpdate();
                console.log('update_after');
                // window.location.reload(false);
            }

            reader.readAsText(userLoadedtreeJSON);
        }
    }, [userLoadedtreeJSON, setTreeData, setColorData, forceUpdate]);

    const parsedTree = useMemo(() => parseFromTreeValues(treeValues), [treeValues]);

    useEffect(() => {
        setTreeData(parsedTree);
    }, [setTreeData, parsedTree]);

    useEffect(() => {
        setColorData(colors);
    }, [setColorData, colors]);

    return (
        <>
        <LevaPanel store={store} />
        <LevaStoreProvider store={store}>
            <Scene tree={parsedTree} />
        </LevaStoreProvider>
        </>
    );
};

export default App;
