import { useCreateStore } from "leva";

import { NodeEditor } from "./NodeEditor";
import { useOverlayEditor, OverlayEditor } from "./OverlayEditor";
import { Scene } from "./Scene";

import "./App.css";


const App = () => {
    const storeColor = useCreateStore();
    const storeDebug = useCreateStore();

    useOverlayEditor(storeColor, storeDebug);

    return (
        <>
            <NodeEditor />
            <OverlayEditor storeColor={storeColor} storeDebug={storeDebug} />
            <Scene storeColor={storeColor} />
        </>
    );
};

export default App;
