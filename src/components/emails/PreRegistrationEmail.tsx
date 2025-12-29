import * as React from 'react';

interface PreRegistrationEmailProps {
  firstName: string;
}

export const PreRegistrationEmail: React.FC<PreRegistrationEmailProps> = ({
  firstName,
}) => (
  <div style={{ fontFamily: 'sans-serif', lineHeight: '1.5', color: '#333' }}>
    <h1>Félicitations {firstName} !</h1>
    <p>
      Ta pré-inscription a été validée par notre équipe. Tu fais désormais partie des créateurs sélectionnés pour cette cohorte.
    </p>
    <p style={{ fontWeight: 'bold', fontSize: '18px', color: '#e11d48' }}>
      ⚠️ Attention : Tu as 6 heures pour finaliser ton inscription.
    </p>
    <p>
      Passé ce délai, ta place sera libérée pour un autre créateur sur liste d'attente.
    </p>
    <div style={{ marginTop: '24px', marginBottom: '24px' }}>
      <a
        href="http://localhost:3000/signup"
        style={{
          backgroundColor: '#000',
          color: '#fff',
          padding: '12px 24px',
          textDecoration: 'none',
          borderRadius: '6px',
          fontWeight: 'bold',
        }}
      >
        Commencer l'aventure maintenant
      </a>
    </div>
    <p style={{ fontSize: '14px', color: '#666' }}>
      Si le bouton ne fonctionne pas, copie ce lien : http://localhost:3000/signup
    </p>
    <hr style={{ margin: '32px 0', border: 'none', borderTop: '1px solid #eee' }} />
    <p style={{ fontSize: '12px', color: '#888' }}>
      L'équipe Troupers
    </p>
  </div>
);

export default PreRegistrationEmail;
