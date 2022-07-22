import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react"
import ReactFlow, { Handle, Position, ReactFlowProvider, useReactFlow, applyNodeChanges, applyEdgeChanges } from "react-flow-renderer";
import dagre from "dagre";
import { invalidate } from "@react-three/fiber";

import { TangleText } from "TangleText";
import { useStore, useNodeStore, useTreeStore } from "Storage";

import "NodeEditor.css";


const nodeWidth = 122;
const nodeHeight = 76;

const nodeTypes = {
    K: BaseModuleNode,
    R: BaseModuleNode,
    T: BaseModuleNode,
};

const getId = (nodes) => {
    return Math.max(...nodes.map(node => Number(node.id))) + 1;
}

function BaseModuleNode({ data }) {
    const setSingleNodeData = useNodeStore(state => state.setSingleNodeData);
    const setTreeData = useTreeStore(state => state.setTreeData);
    const reactFlowInstance = useReactFlow();

    const id = data.label.replace("Module_", "");
    const name = data.moduleType + data.label.replace("Module_", "");
    const moduleType = data.moduleType;
    const defaultValue = useNodeStore.getState().nodeData[id].value;
    // const defaultValue = data.value;

    const onChange = useCallback(
        (value) => {
            setSingleNodeData({ id, value, moduleType });
            invalidate();
        },
        [moduleType, id, setSingleNodeData]
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
            setTreeData(tree);
        },
        [id, reactFlowInstance, setTreeData],
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
                <Handle type="target" position={Position.Left} id="target_value" />
                <div className="module-node-inner">
                    <h1 className="module-node-drag-handle">{name}</h1>
                    <label className="label-face">face</label>
                    <div className="values">
                        <label className="label-value-text">value</label>
                        <TangleText
                            className="label-value"
                            value={defaultValue}
                            step={0.01} min={0} max={1} decimals={2}
                            onChange={onChange}
                            onBlur={onBlur}
                        />
                    </div>
                    <label>face</label>
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

    return (
        <div className="modules-list">
            {Object.keys(nodeTypes).map((nodeType) => (
                <div
                    key={nodeType}
                    className={`modules-list-item modules-list-item-${nodeType}`}
                    onDragStart={(event) => onDragStart(event, nodeType)}
                    draggable
                >
                    {nodeType} Module
                </div>
            ))}
        </div>
    );
}

function NodeEditor_({ nodes, edges, ...props }) {
    const reactFlowStyle = {
        background: "white"
    };

    const setTreeData = useTreeStore(state => state.setTreeData);

    const setSingleNodeData = useNodeStore(state => state.setSingleNodeData);

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
                        selected = true;
                        setLastSelection(change.id);
                    } else if (!selected) {
                        setSelection({});
                        setLastSelection("");
                    }
                }
            }
            reactFlowInstance.setNodes((ns) => applyNodeChanges(changes, ns));
            invalidate();
        },
        [reactFlowInstance, setSelection]
    );

    const onEdgesChange = useCallback(
        (changes) => {
            if (changes[0]?.type === "select") return;
            const nodes = reactFlowInstance.getNodes();
            const edges = reactFlowInstance.getEdges();
            const tree = getTreeFromNodesEdges(nodes, edges);
            setTreeData(tree);
        },
        [reactFlowInstance, setTreeData]
    );

    const onConnect = useCallback(
        (edge) => {
            const source = edge.source;
            const sourceHandle = edge.sourceHandle;
            const target = edge.target;
            let edges = reactFlowInstance.getEdges();

            const changes = [];
            edges.forEach(_edge => {
                if ((_edge.source === source && _edge.sourceHandle === sourceHandle) ^
                    (_edge.target === target)) {
                    changes.push({ id: _edge.id, type: "remove" });
                }
            });
            reactFlowInstance.setEdges((edges) => applyNodeChanges(changes, edges));

            const nodes = reactFlowInstance.getNodes();
            edges = reactFlowInstance.getEdges();
            const tree = getTreeFromNodesEdges(nodes, edges);
            setTreeData(tree);
        },
        [reactFlowInstance, setTreeData]
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
                setTreeData(tree);
            } else {
                // Add new node
                const zoom = reactFlowInstance.getViewport().zoom;
                const position = reactFlowInstance.project({
                    x: event.clientX - reactFlowBounds.left - (nodeWidth / 2) * zoom,
                    y: event.clientY - reactFlowBounds.top - (nodeHeight / 2) * zoom,
                });
                const newId = getId(reactFlowInstance.getNodes());

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

                setSingleNodeData({
                    id: `${newId}`,
                    value: 0,
                });

                reactFlowInstance.setNodes((nodes) => nodes.concat(newNode));
            }
        },
        [reactFlowInstance, setTreeData]
    );

    const onDragOver = useCallback((event) => {
        event.preventDefault();
        event.dataTransfer.dropEffect = "move";
    }, []);

    return (
        <div className="reactflow-wrapper" ref={reactFlowWrapper}>
            <ReactFlow
                style={reactFlowStyle}
                nodeTypes={nodeTypes}
                defaultNodes={nodes}
                defaultEdges={edges}
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

const dagreGraph = new dagre.graphlib.Graph();
dagreGraph.setDefaultEdgeLabel(() => ({}));

function getLayoutedElements(nodes, edges, direction = "TB") {
    const isHorizontal = direction === "LR";
    dagreGraph.setGraph({ rankdir: direction });

    nodes.forEach((node) => {
        dagreGraph.setNode(node.id, { width: nodeWidth, height: nodeHeight });
    });

    edges.forEach((edge) => {
        dagreGraph.setEdge(edge.source, edge.target);
    });

    dagre.layout(dagreGraph);

    nodes.forEach((node) => {
        const nodeWithPosition = dagreGraph.node(node.id);
        node.targetPosition = isHorizontal ? "left" : "top";
        node.sourcePosition = isHorizontal ? "right" : "bottom";

        node.position = {
            x: nodeWithPosition.x - nodeWidth / 2,
            y: nodeWithPosition.y - nodeHeight / 2,
        };

        return node;
    });

    return [nodes, edges];
};

function getNodesEdgesFromTree(tree) {
    let nodes = [];
    let edges = [];

    const dfs = (node) => {
        nodes.push({
            id: `${node.id}`,
            data: {
                label: `Module_${node.id}`,
                value: node.value,
                moduleType: node.moduleType
            },
            position: { x: 0, y: 0 },
            type: node.moduleType,
            dragHandle: ".module-node-drag-handle",
        });

        for (const child of node.children) {
            edges.push({
                id: `E_${node.id}-${child.id}`,
                source: `${node.id}`,
                sourceHandle: `source_${child.face}`,
                target: `${child.id}`,
                targetHandle: "target_face",
            });

            dfs(child);
        }
    };

    dfs(tree);

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
        for (const child_id of successors[node.id] || []) {
            const child_node = id_to_node[child_id];
            const edge_id = `E_${node.id}-${child_id}`;
            child_node.face = edge_to_face[edge_id];
            node.children.push(child_node);

            fillChildren(child_node);
        }
    }

    const id_to_node = {};
    for (const node of nodes) {
        id_to_node[node.id] = getNode(node);
    }

    const edge_to_face = {};
    const predecessors = {};
    const successors = {};
    for (const edge of edges) {
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
    const setNodeData = useNodeStore(state => state.setNodeData);
    const setTreeData = useTreeStore(state => state.setTreeData);

    useInterval(() => {
        let n = Math.max(3, Math.floor(Math.random() * nodes.length));
        let selectedNodes = randomlySelectNode(n, nodes, (id) =>
            useNodeStore.getState().nodeData[id].value + 0.1 * (Math.random() - 0.5)
        );
        setNodeData(selectedNodes);

        const tree = coerceTree(useTreeStore.getState().treeData, (id) =>
            useNodeStore.getState().nodeData[id].value
        );
        setTreeData(tree);

        invalidate();
    }, 5000);
}

function getInitNodeDataFromTree(tree) {
    let nodeData = {};

    const dfs = (node) => {
        nodeData[node.id] = { value: node.value };
        for (const child of node.children) {
            dfs(child);
        }
    };

    dfs(tree);

    return nodeData;
}

export function NodeEditor(props) {
    // console.log('node editor');
    const tree = useTreeStore(state => state.treeData);
    const [nodes, edges] = useMemo(() => {
        let [nodes, edges] = getNodesEdgesFromTree(tree);
        return getLayoutedElements(nodes, edges);
    }, [tree]);

    const setNodeData = useNodeStore(state => state.setNodeData);

    useEffect(() => {
        const initNodeData = getInitNodeDataFromTree(tree);
        setNodeData(initNodeData);
    }, [tree]);

    // useRandomPose(nodes);

    return (
        <ReactFlowProvider>
            <NodeEditor_ nodes={nodes} edges={edges} {...props} />
        </ReactFlowProvider>
    );
}
