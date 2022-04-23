import { Modal, ModalProps } from "react-bootstrap"
import styles from './ActionDialogComponent.module.css';

type Props = ModalProps & {}

export default function ActionDialogComponent(props: Props) {
    return (
        <Modal
            size="lg"
            animation={true}
            dialogClassName={styles.dialog}
            contentClassName={styles.dialogContent} {...props} >

            <Modal.Body>
            <div className={styles.contentRoot}> 
                {props.children}
                </div>
            </Modal.Body>
        </Modal>
    );
}

