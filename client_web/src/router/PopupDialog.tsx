import {
    Button,
    Dialog,
    DialogBody,
    DialogContent,
    DialogTrigger,
    DialogSurface,
    DialogActions,
} from "@fluentui/react-components";

export default function PopupDialog({ text, open, setPopupDialogOpenState, onClose }) {
    return <Dialog modalType="alert" open={open} onOpenChange={(event, data) => setPopupDialogOpenState(data.open)}>
        <DialogSurface>
            <DialogBody>
                <DialogContent>{text}</DialogContent>
                <DialogActions>
                    <DialogTrigger disableButtonEnhancement>
                        <Button appearance="primary" onClick={() => { if (onClose) onClose(); setPopupDialogOpenState(false) }}>Close</Button>
                    </DialogTrigger>
                </DialogActions>
            </DialogBody>
        </DialogSurface>
    </Dialog>
}