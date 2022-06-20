import { useCreateStore } from "leva";

import { NodeEditor } from "./NodeEditor";
import { useOverlayEditor, OverlayEditor } from "./OverlayEditor";
import { Scene } from "./Scene";

import "./App.css";
import { Panel, PanelList } from "./Panel";


const App = () => {
    const storeColor = useCreateStore();
    const storeDebug = useCreateStore();

    useOverlayEditor(storeColor, storeDebug);

    return (
        <>
            <Scene storeColor={storeColor} />
            <PanelList>
                <Panel name="Debug" opened height="380px">
                    <OverlayEditor storeColor={storeColor} storeDebug={storeDebug} />
                </Panel>
                <Panel name="Node Editor">
                    <NodeEditor />
                </Panel>
            </PanelList>
        </>
    );
};

export default App;
