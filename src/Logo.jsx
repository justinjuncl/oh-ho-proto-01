import "./Logo.css";

export const Logo = (props) => {
    return (
        <div id="logo">
            <img src={process.env.PUBLIC_URL + '/logo.png'} alt="logo" />
        </div>
    );
}
