import { useCreateStore } from "leva";

import { NodeEditor } from "./NodeEditor";
import { useOverlayEditor, OverlayEditor } from "./OverlayEditor";
import { Scene } from "./Scene";

import "./App.css";
import { Logo } from "./Logo";
import { Panel, PanelList } from "./Panel";


const App = () => {
    const storeColor = useCreateStore();
    const storeDebug = useCreateStore();

    useOverlayEditor(storeColor, storeDebug);

    return (
        <>
            <Scene storeColor={storeColor} />
            <Logo />
            <PanelList offset={50}>
                <Panel name="Debug" opened>
                    <OverlayEditor storeColor={storeColor} storeDebug={storeDebug} />
                </Panel>
                <Panel name="Node Editor">
                    <NodeEditor />
                </Panel>
            </PanelList>
            <PanelList left>
                <Panel name="Gallery">
                    hi
                </Panel>
                <Panel name="About">
                    hi
                </Panel>
            </PanelList>
        </>
    );
};

export default App;
