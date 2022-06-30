import { useCreateStore } from "leva";

import { Scene } from "Scene";
import { Logo } from "Logo";
import { Panel, PanelList } from "Panel";
import { NodeEditor } from "NodeEditor";
import { useOverlayEditor, OverlayEditor } from "OverlayEditor";

import "App.css";


const App = () => {
    const storeColor = useCreateStore();
    const storeDebug = useCreateStore();

    useOverlayEditor(storeColor, storeDebug);

    return (
        <>
            <Scene storeColor={storeColor} />
            <Logo />
            <PanelList offset={50}>
                <Panel name="Debug">
                    <OverlayEditor storeColor={storeColor} storeDebug={storeDebug} />
                </Panel>
                <Panel name="Node Editor" opened>
                    <NodeEditor storeColor={storeColor} />
                </Panel>
            </PanelList>
            <PanelList left>
                <Panel name="Gallery">
                    <div style={{ textAlign: "center", padding: "100% 0", fontStyle: "italic" }}>Coming soon</div>
                </Panel>
                <Panel name="About">
                    <div style={{ textAlign: "center", padding: "100% 0", fontStyle: "italic" }}>Coming soon</div>
                </Panel>
            </PanelList>
        </>
    );
};

export default App;
