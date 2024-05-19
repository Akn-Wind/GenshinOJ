import {
    makeStyles,
} from "@fluentui/react-components";

import "../css/style.css";

const useStyles = makeStyles({
    root: {
        display: "flex",
        flexDirection: "column",
        rowGap: "4px",
        columnGap: "4px",
        maxWidth: "250px",
    },
});

export default function Home() {
    return (
        <>
            <div className={useStyles().root}>

            </div>
        </>
    );
}