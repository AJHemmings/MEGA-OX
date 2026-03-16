import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Modal } from "./modal";

type View = "main" | "difficulty";

const MainMenu: React.FC = () => {
  const navigate = useNavigate();
  const [view, setView] = useState<View>("main");
  const [showRules, setShowRules] = useState(false);

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#1a2332",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "Segoe UI, Tahoma, Geneva, Verdana, sans-serif",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Animated background elements */}
      <div style={{ position: "absolute", top: "10%", left: "10%", width: "100px", height: "100px", backgroundColor: "#ff6b35", borderRadius: "50%", opacity: 0.1, animation: "float 6s ease-in-out infinite" }} />
      <div style={{ position: "absolute", top: "60%", right: "15%", width: "150px", height: "150px", backgroundColor: "#f7931e", borderRadius: "50%", opacity: 0.1, animation: "float 8s ease-in-out infinite reverse" }} />
      <div style={{ position: "absolute", bottom: "20%", left: "20%", width: "80px", height: "80px", backgroundColor: "#00d4aa", borderRadius: "50%", opacity: 0.1, animation: "float 7s ease-in-out infinite" }} />

      <div
        style={{
          backgroundColor: "#2a3441",
          borderRadius: "24px",
          padding: "50px 40px",
          textAlign: "center",
          boxShadow: "0 25px 50px rgba(0, 0, 0, 0.3), 0 0 0 1px rgba(255, 255, 255, 0.1)",
          maxWidth: "420px",
          width: "90%",
          position: "relative",
          animation: "slideUp 0.8s ease-out",
        }}
      >
        <h1
          style={{
            fontSize: "3.5em",
            margin: "0 0 15px 0",
            color: "#ffffff",
            fontWeight: "bold",
            textShadow: "0 2px 4px rgba(0, 0, 0, 0.3)",
            animation: "titleGlow 2s ease-in-out infinite alternate",
          }}
        >
          Mega OX
        </h1>

        <p style={{ color: "#a0aec0", fontSize: "1.2em", marginBottom: "40px", fontWeight: "500" }}>
          The Ultimate Naughts and Crosses Experience
        </p>

        {view === "main" && (
          <div style={{ marginBottom: "30px" }}>
            <MenuButton onClick={() => setView("difficulty")} primary={true} color="#ff6b35">
              🤖 Player vs AI
            </MenuButton>
            <MenuButton onClick={() => navigate("/multiplayer")} primary={true} color="#00d4aa">
              👥 Multiplayer
            </MenuButton>
            <MenuButton onClick={() => setShowRules(true)} primary={false} color="#4299e1">
              📖 Rules
            </MenuButton>
          </div>
        )}

        {view === "difficulty" && (
          <div style={{ marginBottom: "30px" }}>
            <p style={{ color: "#a0aec0", fontSize: "1em", marginBottom: "20px" }}>
              Select difficulty
            </p>
            <MenuButton onClick={() => navigate("/training")} primary={true} color="#00d4aa">
              🟢 Easy
            </MenuButton>
            <MenuButton onClick={() => navigate("/training")} primary={true} color="#f7931e">
              🟡 Medium
            </MenuButton>
            <MenuButton onClick={() => navigate("/training")} primary={true} color="#ff6b35">
              🔴 Hard
            </MenuButton>
            <MenuButton onClick={() => setView("main")} primary={false} color="#718096">
              ← Back
            </MenuButton>
          </div>
        )}

        <Modal isOpen={showRules} onClose={() => setShowRules(false)} title="How to Play Mega OX">
          <div style={{ textAlign: "left", fontSize: "14px", lineHeight: "1.6" }}>
            <h3>🎯 Objective</h3>
            <p>Win 3 micro boards in a row on the macro board to win the game.</p>
            <h3>🎮 How to Play</h3>
            <ul>
              <li>Players take turns placing their marker (X or O) in cells</li>
              <li>The first player can choose any cell on the macro board</li>
              <li>Your move determines which micro board your opponent must play in next</li>
              <li>Win a micro board by getting 3 in a row within it</li>
              <li>If the required micro board is full, you can choose any available board</li>
            </ul>
            <h3>🏆 Winning</h3>
            <ul>
              <li>Get 3 micro board wins in a row (horizontal, vertical, or diagonal)</li>
              <li>If all micro boards are filled without a macro winner, it's a draw</li>
            </ul>
          </div>
        </Modal>
      </div>
    </div>
  );
};

const MenuButton: React.FC<{
  children: React.ReactNode;
  onClick: () => void;
  primary: boolean;
  color: string;
}> = ({ children, onClick, primary, color }) => (
  <button
    onClick={onClick}
    style={{
      display: "block",
      width: "100%",
      padding: "18px 24px",
      margin: "12px 0",
      fontSize: "18px",
      fontWeight: "bold",
      border: primary ? "none" : `2px solid ${color}`,
      borderRadius: "16px",
      background: primary ? color : "transparent",
      color: primary ? "white" : color,
      cursor: "pointer",
      transition: "all 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
      transform: "translateY(0) scale(1)",
      boxShadow: primary ? `0 8px 25px ${color}40, 0 4px 10px rgba(0, 0, 0, 0.1)` : "0 4px 15px rgba(0, 0, 0, 0.1)",
      position: "relative",
      overflow: "hidden",
    }}
    onMouseEnter={(e) => {
      e.currentTarget.style.transform = "translateY(-3px) scale(1.02)";
      e.currentTarget.style.boxShadow = primary
        ? `0 12px 35px ${color}60, 0 8px 20px rgba(0, 0, 0, 0.15)`
        : `0 8px 25px ${color}30, 0 4px 15px rgba(0, 0, 0, 0.1)`;
      if (!primary) e.currentTarget.style.backgroundColor = `${color}15`;
    }}
    onMouseLeave={(e) => {
      e.currentTarget.style.transform = "translateY(0) scale(1)";
      e.currentTarget.style.boxShadow = primary
        ? `0 8px 25px ${color}40, 0 4px 10px rgba(0, 0, 0, 0.1)`
        : "0 4px 15px rgba(0, 0, 0, 0.1)";
      if (!primary) e.currentTarget.style.backgroundColor = "transparent";
    }}
    onMouseDown={(e) => { e.currentTarget.style.transform = "translateY(-1px) scale(0.98)"; }}
    onMouseUp={(e) => { e.currentTarget.style.transform = "translateY(-3px) scale(1.02)"; }}
  >
    {children}
  </button>
);

export default MainMenu;

const style = document.createElement("style");
style.textContent = `
  @keyframes float {
    0%, 100% { transform: translateY(0px) rotate(0deg); }
    50% { transform: translateY(-20px) rotate(180deg); }
  }
  @keyframes slideUp {
    0% { opacity: 0; transform: translateY(30px); }
    100% { opacity: 1; transform: translateY(0px); }
  }
  @keyframes titleGlow {
    0% { text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3); }
    100% { text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3), 0 0 20px rgba(255, 255, 255, 0.3); }
  }
`;
document.head.appendChild(style);
