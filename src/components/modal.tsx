import React from "react";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

const modalStyle: React.CSSProperties = {
  position: "fixed",
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  backgroundColor: "#2a3441",
  color: "#ffffff",
  padding: "30px",
  borderRadius: "20px",
  boxShadow:
    "0 25px 50px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.1)",
  zIndex: 1001,
  width: "90%",
  maxWidth: "500px",
  maxHeight: "80vh",
  overflowY: "auto",
};

const overlayStyle: React.CSSProperties = {
  position: "fixed",
  top: 0,
  left: 0,
  width: "100%",
  height: "100%",
  backgroundColor: "rgba(0, 0, 0, 0.7)",
  zIndex: 1000,
  backdropFilter: "blur(4px)",
};

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
}) => {
  if (!isOpen) return null;

  return (
    <>
      <div style={overlayStyle} onClick={onClose}></div>
      <div style={modalStyle}>
        <h2
          style={{
            margin: "0 0 20px 0",
            color: "#ffffff",
            fontSize: "1.8em",
            textAlign: "center",
          }}
        >
          {title}
        </h2>
        <div style={{ marginBottom: "20px" }}>{children}</div>
        <div style={{ textAlign: "center" }}>
          <button
            onClick={onClose}
            style={{
              padding: "12px 24px",
              fontSize: "16px",
              fontWeight: "bold",
              border: "none",
              borderRadius: "12px",
              backgroundColor: "#4299e1",
              color: "white",
              cursor: "pointer",
              transition: "all 0.3s ease",
              boxShadow: "0 4px 15px #4299e140",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "translateY(-2px)";
              e.currentTarget.style.boxShadow = "0 8px 25px #4299e160";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow = "0 4px 15px #4299e140";
            }}
          >
            Close
          </button>
        </div>
      </div>
    </>
  );
};
