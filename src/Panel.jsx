
import { useState, useRef, useCallback } from "react";
import "./Panel.css";

export function Panel(props) {
    const [isOpen, setOpen] = useState(false);
    const ref = useRef(null);

    const onClick = useCallback(
        () => {
            ref.current.classList.toggle('hide');
        }, []
    );

    return (
        <div className="panel-wrapper" ref={ref}>
            <div className="button" onClick={onClick} >
                {props.name}
            </div>
            <div className="panel-inner">
                {props.children}
            </div>
        </div>
    );
}
