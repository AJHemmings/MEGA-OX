import React from 'react';

interface Step { title: string; description: string; }

interface Props {
  steps: Step[];
  onComplete: () => void;
}

const TutorialOverlay: React.FC<Props> = ({ steps, onComplete }) => {
  const [currentStep, setCurrentStep] = React.useState(0);
  const step = steps[currentStep];
  const isLast = currentStep === steps.length - 1;

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 1000, display: 'flex', alignItems: 'flex-end', justifyContent: 'center', padding: '24px' }}>
      <div style={{ background: '#2a3441', borderRadius: '12px', padding: '32px', maxWidth: '480px', width: '100%' }}>
        <div style={{ color: '#a0aec0', fontSize: '12px', marginBottom: '8px' }}>Step {currentStep + 1} of {steps.length}</div>
        <h3 style={{ color: '#00d4aa', marginBottom: '12px', margin: '0 0 12px' }}>{step.title}</h3>
        <p style={{ color: '#fff', lineHeight: 1.6, marginBottom: '24px' }}>{step.description}</p>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <button onClick={onComplete} style={{ background: 'none', border: 'none', color: '#a0aec0', cursor: 'pointer' }}>Skip</button>
          <button onClick={() => isLast ? onComplete() : setCurrentStep(s => s + 1)}
            style={{ background: '#00d4aa', border: 'none', color: '#1a2332', padding: '10px 24px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>
            {isLast ? 'Got it!' : 'Next →'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default TutorialOverlay;
