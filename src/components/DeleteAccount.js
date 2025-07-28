// ✅ src/components/DeleteAccount.js
import React from 'react';

const DeleteAccount = () => {
  return (
    <div style={{ padding: '2rem', maxWidth: '600px', margin: 'auto' }}>
      <h2>Delete Your CrickEdge Account</h2>
      <p>
        To delete your CrickEdge account and all associated data, please send an email to:
      </p>
      <p>
        <strong>support@crickedge.in</strong><br />
        Subject: <strong>Delete My CrickEdge Account</strong><br />
        Include: your registered email or username.
      </p>
      <p>
        We will process your request within 7 working days.
      </p>
    </div>
  );
};

export default DeleteAccount;
