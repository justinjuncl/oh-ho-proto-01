import LOGO from "assets/logo.png";

import "Logo.css";


export const Logo = (props) => {
    return (
        <div id="logo">
            <img src={LOGO} alt="logo" />
        </div>
    );
}
