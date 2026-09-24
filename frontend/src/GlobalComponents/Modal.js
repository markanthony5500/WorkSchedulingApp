import BootstrapModal from "react-bootstrap/Modal";

// Thin wrapper around react-bootstrap's Modal for simple show/title/body modals
export default function Modal({ show, handleClose, title, children }) {
    return (
        <BootstrapModal show={show} onHide={handleClose}>
            <BootstrapModal.Header closeButton>
                <BootstrapModal.Title>{title}</BootstrapModal.Title>
            </BootstrapModal.Header>
            <BootstrapModal.Body>{children}</BootstrapModal.Body>
        </BootstrapModal>
    );
}
