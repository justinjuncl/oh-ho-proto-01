import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react"
import ReactFlow, { Handle, Position, ReactFlowProvider, useReactFlow, applyNodeChanges, applyEdgeChanges, getBezierPath, addEdge } from "react-flow-renderer";
import Elk from "elkjs";
import { invalidate } from "@react-three/fiber";

import Draggable from "react-draggable";
import { TangleText } from "TangleText";
import { useStore, useNodeStore, useSensorStore, useTreeStore } from "Storage";


import "NodeEditor.css";


const nodeWidth = 102;
const nodeHeight = 47;

const nodeTypes = {
    K: KModuleNode,
    R: BaseModuleNode,
    T: BaseModuleNode,
    Sensor: SensorNode,
};

const edgeTypes = {
    Sensor0: SensorEdge(0),
    Sensor1: SensorEdge(1),
    Sensor2: SensorEdge(2),
};

const getId = (nodes) => {
    return Math.max(...nodes.map(node => Number(node.id))) + 1;
}

function ConnectionLine({ sourceX, sourceY, sourcePosition, targetPosition, targetX, targetY, connectionLineType, connectionLineStyle, fromNode, fromHandle, }) {
    const isSensor = fromNode.type === "Sensor";
    const style = {};

    if (isSensor) {
        const source_id = Number(fromHandle.id.replace("source_", ""));
        style.stroke = `var(--sensor${source_id}-stroke-color)`;
    } else {
        style.stroke = "var(--default-stroke-color)"
    }

    const d = getBezierPath({ sourceX, sourceY, sourcePosition, targetPosition, targetX, targetY, });

    return (
        <path fill="none" style={style} strokeWidth={1.5} d={d} />
    );
}

function SensorEdge(sensor_id) {
    return ({ id, sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition, markerEnd }) => {
        const edgePath = getBezierPath({ sourceX, sourceY, sourcePosition, targetX, targetY, targetPosition, });

        return (
            <path id={id} className="react-flow__edge-path" d={edgePath} markerEnd={markerEnd} />
        );
    }
}

function SensorNode({ data }) {
    const isValidConnection = useCallback((connection) => (
        connection.targetHandle === "target_value"
    ), []);

    const onChange = useCallback((e) => {
        console.log(e.target.name, e.target.checked);
    }, []);

    return (
        <div className="module-node-wrapper">
            <div className="module-node sensor">
                <div className="module-node-inner">
                    <h1 className="module-node-drag-handle">{data.label}</h1>
                    <div className="handles">
                        <div className="values">
                            <Handle type="source" position={Position.Right} isValidConnection={isValidConnection} id="source_0" />
                            <input type="checkbox" name="source_0" onChange={onChange}></input>
                            <label className="label-value-text">Source 0</label>
                        </div>
                        <div className="values">
                            <Handle type="source" position={Position.Right} isValidConnection={isValidConnection} id="source_1" />
                            <input type="checkbox" name="source_1" onChange={onChange}></input>
                            <label className="label-value-text">Source 1</label>
                        </div>
                        <div className="values">
                            <Handle type="source" position={Position.Right} isValidConnection={isValidConnection} id="source_2" />
                            <input type="checkbox" name="source_2" onChange={onChange}></input>
                            <label className="label-value-text">Source 2</label>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
}


function BaseModuleNode({ data }) {
    const setNode = useNodeStore(state => state.setNode);
    const setTree = useTreeStore(state => state.setTree);
    const reactFlowInstance = useReactFlow();

    const id = data.label.replace("Module_", "");
    const name = data.moduleType + data.label.replace("Module_", "");
    const moduleType = data.moduleType;
    const defaultValue = useNodeStore.getState().nodes[id].value;
    // const defaultValue = data.value;

    const onChange = useCallback(
        (value) => {
            setNode({ id, value, moduleType });
            invalidate();
        },
        [moduleType, id, setNode]
    );

    const onBlur = useCallback(
        (value) => {
            const nodes = reactFlowInstance.getNodes().map((node) => {
                if (node.id === id) {
                    return {
                        ...node,
                        data: { ...node.data, value }
                    };
                }
                return node;
            });
            const edges = reactFlowInstance.getEdges();
            const tree = getTreeFromNodesEdges(nodes, edges);
            setTree(tree);
        },
        [id, reactFlowInstance, setTree],
    );

    const [dragTarget, setDragTarget] = useState(null);
    const [dragHover, setDragHover] = useState(false);

    return (
        <div className="module-node-wrapper"
            onDragEnter={(event) => {
                event.stopPropagation();
                event.preventDefault();
                setDragTarget(event.target);
                setDragHover(true);
                return false;
            }}
            onDragLeave={(event) => {
                if (dragTarget === event.target) {
                    event.stopPropagation();
                    event.preventDefault();
                    setDragHover(false);
                }
            }}
            onDrop={(event) => {
                setDragHover(false);
            }}
        >
            <div className={`module-node ${dragHover ? 'drag-hover' : ''}`}
            >
                <Handle type="target" position={Position.Top} id="target_face" />
                <div className="module-node-inner">
                    <h1 className="module-node-drag-handle">{name}</h1>
                    <div className="values">
                        <Handle type="target" position={Position.Left} id="target_value" />
                        <label className="label-value-text">value</label>
                        <TangleText
                            className="label-value"
                            value={defaultValue}
                            step={0.01} min={0} max={1} decimals={2}
                            onChange={onChange}
                            onBlur={onBlur}
                        />
                    </div>
                </div>
                <div className="handles">
                    <Handle type="source" position={Position.Bottom} id="source_0" />
                    <Handle type="source" position={Position.Bottom} id="source_1" />
                    <Handle type="source" position={Position.Bottom} id="source_2" />
                    <Handle type="source" position={Position.Bottom} id="source_3" />
                    <Handle type="source" position={Position.Bottom} id="source_4" />
                </div>
            </div>
        </div>
    );
}

function KModuleNode({ data }) {
    const name = data.moduleType + data.label.replace("Module_", "");

    const [dragTarget, setDragTarget] = useState(null);
    const [dragHover, setDragHover] = useState(false);

    return (
        <div className="module-node-wrapper"
            onDragEnter={(event) => {
                event.stopPropagation();
                event.preventDefault();
                setDragTarget(event.target);
                setDragHover(true);
                return false;
            }}
            onDragLeave={(event) => {
                if (dragTarget === event.target) {
                    event.stopPropagation();
                    event.preventDefault();
                    setDragHover(false);
                }
            }}
            onDrop={(event) => {
                setDragHover(false);
            }}
        >
            <div className={`module-node ${dragHover ? 'drag-hover' : ''}`}
            >
                <Handle type="target" position={Position.Top} id="target_face" />
                <div className="module-node-inner">
                    <h1 className="module-node-drag-handle">{name}</h1>
                </div>
                <div className="handles">
                    <Handle type="source" position={Position.Bottom} id="source_0" />
                    <Handle type="source" position={Position.Bottom} id="source_1" />
                    <Handle type="source" position={Position.Bottom} id="source_2" />
                </div>
            </div>
        </div>
    );
}


function ModulesList() {
    const onDragStart = (event, nodeType) => {
        // const ghost = document.getElementsByClassName("module-node")[0].cloneNode(true);
        const ghost = document.getElementsByClassName(`modules-list-item-${nodeType}`)[0].cloneNode(true);

        // ghost element needs to be inside user viewport
        const rect = ghost.getBoundingClientRect();
        ghost.className += " ghost";
        ghost.style.position = "absolute";
        ghost.style.top = `${rect.x}px`;
        ghost.style.left = `${rect.y}px`;
        document.body.appendChild(ghost);
        window.setTimeout(() => ghost.parentNode.removeChild(ghost), 0);

        event.dataTransfer.setDragImage(ghost, ghost.offsetWidth / 2, ghost.offsetHeight / 2);
        event.dataTransfer.setData("application/reactflow", nodeType);
        event.dataTransfer.effectAllowed = "move";
    };

    const dragRef = useRef();
    const rowRef = useRef();

    const onClick = useCallback((e) => {
        if (rowRef.current) {
            rowRef.current.classList.toggle('opened');
        }
    }, []);

    return (
        <Draggable handle=".module-node-drag-handle" nodeRef={dragRef} bounds="parent">
            <div className="modules-list" ref={dragRef}>
                <div className="modules-list-inner">
                    <div className="modules-list-header">
                        <h1 className="module-node-drag-handle">Add node</h1>
                        <span onClick={onClick}>=</span>
                    </div>

                    <div className="modules-list-row opened" ref={rowRef}>
                        {Object.keys(nodeTypes).map((nodeType) => (
                            <div
                                key={nodeType}
                                className={`modules-list-item modules-list-item-${nodeType}`}
                                onDragStart={(event) => onDragStart(event, nodeType)}
                                draggable
                            >
                                <img src={require(`assets/icon_module_${nodeType.toLowerCase()}.png`)} alt="" />
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </Draggable>
    );
}

function NodeEditor_({ nodes, edges, ...props }) {
    const reactFlowStyle = {
        background: "white"
    };

    const setTree = useTreeStore(state => state.setTree);
    const setNode = useNodeStore(state => state.setNode);

    const selection = useStore(state => state.selection);
    const setSelection = useStore(state => state.setSelection);
    const [lastSelection, setLastSelection] = useState("");

    const reactFlowInstance = useReactFlow();
    const reactFlowWrapper = useRef(null);

    useEffect(() => {
        const id = selection?.object?.name.replace("Module_", "");
        const changes = [];
        if (id !== lastSelection) {
            changes.push({
                id: lastSelection,
                type: "select",
                selected: false
            });
        }
        if (id) {
            changes.push({
                id: id,
                type: "select",
                selected: true
            });
            // console.log(getDescendantsFromNode(id, nodes, edges));
        }
        setLastSelection(id);
        reactFlowInstance.setNodes((nodes) => applyNodeChanges(changes, nodes));
    }, [reactFlowInstance, selection?.object?.name]);


    const onNodesChange = useCallback(
        (changes) => {
            let selected = false;
            for (const change of changes) {
                if (change.type === "select") {
                    if (change.selected) {
                        setSelection({
                            object: {
                                name: "Module_" + change.id,
                            },
                        });
                        setLastSelection(change.id);
                        selected = true;
                    } else if (!selected) {
                        setSelection({});
                        setLastSelection("");
                    }
                }
            }
            invalidate();
        },
        [setSelection]
    );

    const onEdgesChange = useCallback(
        (changes) => {
            if (changes[0]?.type === "select") return;
            for (const change of changes) {
                if (change.id.includes("E_s") && change.type === "remove") {
                    useSensorStore.getState().removeEdge(change.id);
                }
            }
            const nodes = reactFlowInstance.getNodes();
            const edges = reactFlowInstance.getEdges();
            const tree = getTreeFromNodesEdges(nodes, edges);
            setTree(tree);
        },
        [reactFlowInstance, setTree]
    );

    const onConnect = useCallback(
        (edge) => {
            const source = edge.source;
            const sourceHandle = edge.sourceHandle;
            const target = edge.target;
            const targetHandle = edge.targetHandle;
            let edges = reactFlowInstance.getEdges();

            edge.id = `E_${edge.source}-${edge.target}`;
            const new_id = `reactflow__edge-${source}${sourceHandle}-${target}${targetHandle}`;
            const changes = [{ id: new_id, type: "remove" }];
            edges.forEach(_edge => {
                if (edge.id === _edge.id) {
                    changes.push({ id: _edge.id, type: "remove" });
                }
            });

            if (edge.source.includes("s")) {
                edge.type = edge.sourceHandle.replace("source_", "Sensor");

                const setEdge = useSensorStore.getState().setEdge;
                setEdge(edge);
            }

            reactFlowInstance.setEdges((edges) => applyEdgeChanges(changes, edges));
            reactFlowInstance.addEdges(edge);

            const nodes = reactFlowInstance.getNodes();
            edges = reactFlowInstance.getEdges();
            const tree = getTreeFromNodesEdges(nodes, edges);
            setTree(tree);
        },
        [reactFlowInstance, setTree]
    );

    const onDrop = useCallback(
        (event) => {
            event.preventDefault();

            const reactFlowBounds = reactFlowWrapper.current.getBoundingClientRect();
            const type = event.dataTransfer.getData("application/reactflow");

            const targetNode = event.target?.closest(".react-flow__node");

            if (targetNode) {
                // Replace existing node's moduleType
                const targetId = targetNode.getAttribute("data-id");
                const targetType = targetNode.className.match(/react-flow__node-(\w)/)[1];
                if (type === targetType)
                    return

                const nodes = reactFlowInstance.getNodes().map((node) => {
                    if (node.id === targetId) {
                        return {
                            ...node,
                            type,
                            data: { ...node.data, moduleType: type }
                        };
                    }
                    return node;
                });
                const edges = reactFlowInstance.getEdges();
                const tree = getTreeFromNodesEdges(nodes, edges);
                setTree(tree);
            } else {
                // Add new node
                const zoom = reactFlowInstance.getViewport().zoom;
                const nodes = reactFlowInstance.getNodes();
                const position = reactFlowInstance.project({
                    x: event.clientX - reactFlowBounds.left - (nodeWidth / 2) * zoom,
                    y: event.clientY - reactFlowBounds.top - (nodeHeight / 2) * zoom,
                });
                const newId = getId(nodes);

                const newNode = {
                    id: `${newId}`,
                    data: {
                        label: `Module_${newId}`,
                        value: 0,
                        moduleType: type
                    },
                    position,
                    type,
                };

                setNode({
                    id: `${newId}`,
                    value: 0,
                });

                reactFlowInstance.setNodes((nodes) => nodes.concat(newNode));
            }
        },
        [reactFlowInstance, setTree]
    );

    const onDragOver = useCallback((event) => {
        event.preventDefault();
        event.dataTransfer.dropEffect = "move";
    }, []);

    const onInit = useCallback(
        (reactFlowInstance) => {
            createGraphLayout(reactFlowInstance.getNodes(), reactFlowInstance.getEdges())
                .then((nodes) => {
                    reactFlowInstance.setNodes(nodes);
                    const rootNode = reactFlowInstance.getNodes().find(node => node.id === "0");
                    const x = rootNode.position.x + rootNode.width / 2;
                    const y = rootNode.position.y + rootNode.height / 2;
                    reactFlowInstance.setCenter(x, y, { zoom: 1, duration: 1500 });
                })
                .catch((err) => console.error(err));
        }, []
    );

    return (
        <div className="reactflow-wrapper" ref={reactFlowWrapper}>
            <ReactFlow
                style={reactFlowStyle}
                nodeTypes={nodeTypes}
                edgeTypes={edgeTypes}
                connectionLineComponent={ConnectionLine}
                defaultNodes={nodes}
                defaultEdges={edges}
                onInit={onInit}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                onConnect={onConnect}
                onDrop={onDrop}
                onDragOver={onDragOver}
                proOptions={{ account: "paid-pro", hideAttribution: true }}
            >
            </ReactFlow>
            <ModulesList />
        </div>
    );
}

const elk = new Elk({
    defaultLayoutOptions: {
        'elk.algorithm': 'layered',
        "elk.direction": 'DOWN',
        "elk.spacing.nodeNode": "75",
        "elk.layered.spacing.nodeNodeBetweenLayers": "75",
        "elk.layered.nodePlacement.bk.fixedAlignment": "BALANCED",
        "portConstraints": "FIXED_ORDER",
    },
});

const createGraphLayout = async (nodes: [], edges: []) => {
    const elkNodes = [];
    const elkEdges = [];

    nodes.forEach((flowNode) => {
        if (flowNode?.type === "Sensor") return;
        elkNodes.push({
            id: flowNode.id,
            width: flowNode.width,
            height: flowNode.height,
        });
    });
    edges.forEach((flowEdge) => {
        if (flowEdge?.type?.includes("Sensor")) return;
        elkEdges.push({
            id: flowEdge.id,
            target: flowEdge.target,
            source: flowEdge.source,
        });
    });

    const graph = await elk.layout({
        id: "root",
        children: elkNodes,
        edges: elkEdges,
    });

    const positions = {};
    graph.children.forEach((node) => {
        positions[node.id] = {
            x: node.x - node.width / 2,
            y: node.y - node.height / 2
        };
    });

    return nodes.map((flowNode) => {
        if (flowNode?.type === "Sensor") return flowNode;
        flowNode.position = {
            x: positions[flowNode.id].x,
            y: positions[flowNode.id].y,
        };
        return flowNode;
    });
};

function getDescendantsFromNode(targetNodeId, nodes, edges) {
    const successors = {};
    for (const edge of edges) {
        if (successors[edge.source]) {
            successors[edge.source].push(edge.target);
        } else {
            successors[edge.source] = [edge.target];
        }
    }

    let children = [];
    if (successors[targetNodeId])
        children.push(...successors[targetNodeId]);
    const descendants = [{ id: targetNodeId }];

    while (children.length > 0) {
        const new_children = [];
        for (const child_id of children) {
            descendants.push({ id: child_id });
            if (successors[child_id])
                new_children.push(...successors[child_id]);
        }
        children = new_children;
    }

    return descendants;
}

function getNodesEdgesFromTree(tree) {
    let nodes = [];
    let edges = [];

    const dfs = (node) => {
        nodes.push({
            id: `${node.id}`,
            data: {
                label: `Module_${node.id}`,
                value: node.value,
                moduleType: node.moduleType,
                face: node.face,
            },
            position: { x: 0, y: 0 },
            type: node.moduleType,
            dragHandle: ".module-node-drag-handle",
        });

        for (const child of node.children.sort((a, b) =>
            a.face - b.face
        )) {
            dfs(child);

            edges.push({
                id: `E_${node.id}-${child.id}`,
                source: `${node.id}`,
                sourceHandle: `source_${child.face}`,
                target: `${child.id}`,
                targetHandle: "target_face",
            });
        }
    };

    dfs(tree);

    const sensorNodes = ["s0"];
    for (const node_id of sensorNodes) {
        nodes.push({
            id: node_id,
            data: {
                label: node_id,
            },
            position: { x: 0, y: 0 },
            type: "Sensor",
            dragHandle: ".module-node-drag-handle",
        });
    }

    const sensorEdges = useSensorStore.getState().edges;
    for (const [edge_id, edge] of Object.entries(sensorEdges)) {
        edges.push({
            id: edge_id,
            source: edge.source,
            sourceHandle: edge.sourceHandle,
            target: edge.target,
            targetHandle: edge.targetHandle,
            type: edge.type,
        });
    }

    return [nodes, edges];
}

function getTreeFromNodesEdges(nodes, edges) {
    const getNode = (node) => {
        return {
            id: Number(node.id),
            face: 0,
            moduleType: node.data.moduleType,
            value: node.data.value,
            children: []
        }
    }

    const fillChildren = (node) => {
        for (const child_id of successors[node?.id] || []) {
            const child_node = id_to_node[child_id];
            const edge_id = `E_${node.id}-${child_id}`;
            child_node.face = edge_to_face[edge_id];
            node.children.push(child_node);

            fillChildren(child_node);
        }
    }

    const id_to_node = {};
    for (const node of nodes) {
        if (node.id.includes("s")) continue;

        id_to_node[node.id] = getNode(node);
    }

    const edge_to_face = {};
    const predecessors = {};
    const successors = {};
    for (const edge of edges) {
        if (edge.source.includes("s")) continue;

        const edge_id = `E_${edge.source}-${edge.target}`;
        edge_to_face[edge_id] = Number(edge.sourceHandle.replace("source_", ""));

        if (predecessors[edge.target]) {
            predecessors[edge.target].push(edge.source);
        } else {
            predecessors[edge.target] = [edge.source];
        }

        if (successors[edge.source]) {
            successors[edge.source].push(edge.target);
        } else {
            successors[edge.source] = [edge.target];
        }
    }

    const sources = nodes
        .filter(node => !predecessors.hasOwnProperty(node.id))
        .map(node => node.id);

    const roots = [];
    for (const source of sources) {
        roots.push(id_to_node[source]);
    }

    for (const root of roots) {
        fillChildren(root);
    }

    return roots[0];
}

function useInterval(callback, delay) {
    const savedCallback = useRef();

    useEffect(() => {
        savedCallback.current = callback;
    });

    useEffect(() => {
        function tick() {
            savedCallback.current();
        }

        let id = setInterval(tick, delay);
        return () => clearInterval(id);
    }, [delay]);
}

const randomlySelectNode = (n, nodes, getValue) => {
    let res = {};
    for (let i = 0; i < n; i++) {
        let node = nodes[Math.floor(Math.random() * (nodes.length))];
        while (res.hasOwnProperty(node.id)) {
            node = nodes[Math.floor(Math.random() * (nodes.length - 1))];
        }
        const value = Math.min(Math.max(0, getValue(node.id)), 1);
        res[node.id] = { value };
    }
    return res;
}

export function coerceTree(node, getValue) {
    const newNode = {
        id: node.id,
        face: node.face,
        moduleType: node.moduleType,
        children: []
    };

    if (typeof getValue === "function") {
        newNode.value = getValue(node.id);
    }

    node.children.forEach(child => {
        newNode.children.push(coerceTree(child, getValue));
    })

    return newNode;
}

function useRandomPose(nodes) {
    const setNodes = useNodeStore(state => state.setNodes);
    const setTree = useTreeStore(state => state.setTree);

    useInterval(() => {
        let n = Math.max(3, Math.floor(Math.random() * nodes.length));
        let selectedNodes = randomlySelectNode(n, nodes, (id) =>
            useNodeStore.getState().nodes[id].value + 0.1 * (Math.random() - 0.5)
        );
        setNodes(selectedNodes);

        const tree = coerceTree(useTreeStore.getState().tree, (id) =>
            useNodeStore.getState().node[id].value
        );
        setTree(tree);

        invalidate();
    }, 5000);
}

function getInitNodesFromTree(tree) {
    let nodes = {};

    const dfs = (node) => {
        nodes[node.id] = { value: node.value };
        for (const child of node.children) {
            dfs(child);
        }
    };

    dfs(tree);

    return nodes;
}

export function NodeEditor(props) {
    const [nodes, edges] = useMemo(() => {
        const tree = useTreeStore.getState().tree;
        const initNodes = getInitNodesFromTree(tree);
        const setNodes = useNodeStore.getState().setNodes;

        setNodes(initNodes);
        return getNodesEdgesFromTree(tree);
    }, []);

    // useRandomPose(nodes);

    return (
        <ReactFlowProvider>
            <NodeEditor_ nodes={nodes} edges={edges} {...props} />
        </ReactFlowProvider>
    );
}
