import React from 'react';

const TrashIcon = () => <span>🗑️</span>;

function Chatpartner({ user, chatMessages = [], chatText, setChatText, chatLoading, sendMessage, deleteMessage }) {
  const displayName = user?.full_name || user?.email?.split('@')[0] || 'You';

  return (
    <div className="form-card chat-panel">
      <h3 className="form-card-title">
        <span>💬</span> Team Chat
      </h3>
      <p className="form-card-subtitle">Chat is stored locally in this demo build.</p>

      <div className="chat-messages-box">
        {chatMessages.length === 0 ? (
          <div className="empty-state">No messages yet. Start the conversation.</div>
        ) : (
          chatMessages.map((msg) => {
            const isMine = msg.sender_id === user?.id;
            return (
              <div key={msg.id} className={`chat-row ${isMine ? 'mine' : 'theirs'}`}>
                <div className={`chat-bubble ${isMine ? 'mine' : 'theirs'}`}>
                  <div className="chat-author">{isMine ? 'You' : displayName}</div>
                  <div className="chat-text">{msg.message_text}</div>
                </div>
                {isMine && (
                  <button
                    type="button"
                    className="chat-delete"
                    onClick={() => deleteMessage(msg.id)}
                    title="Delete message"
                  >
                    <TrashIcon />
                  </button>
                )}
              </div>
            );
          })
        )}
      </div>

      <form onSubmit={sendMessage} className="chat-input-row">
        <input
          type="text"
          className="glass-input"
          placeholder="Type your message..."
          value={chatText}
          onChange={(e) => setChatText(e.target.value)}
          disabled={chatLoading}
        />
        <button type="submit" className="btn-primary" disabled={chatLoading}>
          {chatLoading ? 'Sending...' : 'Send'}
        </button>
      </form>
    </div>
  );
}

export default Chatpartner;
