import {
    Button,
    Dialog,
    DialogBody,
    DialogContent,
    DialogTrigger,
    DialogSurface,
    DialogActions,
} from "@fluentui/react-components";

export default function PopupDialog({ text, open, setPopupDialogOpenState, onClose }: {
    text: string,
    open: boolean,
    setPopupDialogOpenState: React.Dispatch<React.SetStateAction<boolean>>,
    onClose?: () => void,
}) {
    return <Dialog modalType="alert" open={open} onOpenChange={(_, data) => setPopupDialogOpenState(data.open)}>
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