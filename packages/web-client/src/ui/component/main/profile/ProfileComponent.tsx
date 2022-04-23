import Avatar from 'react-avatar';
import { useSelector } from 'react-redux';
import { StoreState } from '../../../../service/Store';
import avatarImg from "../../../images/logo.png";
import styles from "./Profile.module.css";

type Props = {
    className: string
}

export default function ProfileComponent(props: Props) {
    const user = useSelector((state: StoreState) => state.user)!;

    return (
        <div className={props.className}>
            <h4><label className={styles.label}>{user.name}</label></h4>
            <Avatar className={styles.avatar} size="50" src={avatarImg} />
        </div>
    );
}