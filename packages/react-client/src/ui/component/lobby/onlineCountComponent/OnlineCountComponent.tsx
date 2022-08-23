import { API } from "@tix320/noir-web-client-core";
import { useState } from "react";
import { useServerConnectedEffect } from "../../common/Hooks";
import styles from "./OnlineCountComponent.module.css";
import onlineIcon from "@tix320/noir-web-client-core/src/images/online.png";
import classNames from "classnames";

type Props = {
    className? : string,
    refreshMillis: number
}

export default function OnlineCountComponent(props: Props) {

    const [onlineCount, setOnlineCount] = useState<number>(0);

    useServerConnectedEffect(() => {
        API.getOnlineCount().then(value => setOnlineCount(value));
    
        const intervalId = setInterval(() => {
            API.getOnlineCount().then(value => setOnlineCount(value));
        }, props.refreshMillis);

        return () => {
            clearInterval(intervalId);
        }
    }, []);


    return (
        <div className={classNames(styles.container, props.className)}>
            <img className={styles.icon} src={onlineIcon} />
            <div className={styles.label}>
                {onlineCount}
            </div>
        </div>
    )
}