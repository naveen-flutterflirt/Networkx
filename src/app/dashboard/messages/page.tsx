"use client";
import { useState, useEffect, useRef } from "react";
import { MessagesAPI } from "@/lib/api";
import { TokenStore } from "@/lib/api";
import UserSearchPicker from "@/components/ui/UserSearchPicker";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faComment,
  faPlus,
  faPaperPlane,
  faArrowLeft,
} from "@fortawesome/free-solid-svg-icons";

export default function MessagesPage() {
  const [convos, setConvos] = useState<any[]>([]);
  const [selected, setSelected] = useState<any | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMsg, setNewMsg] = useState("");
  const [loading, setLoading] = useState(true);
  const [msgLoading, setMsgLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [newConvo, setNewConvo] = useState(false);
  const [recipientId, setRecipientId] = useState("");
  const [recipientPreset, setRecipientPreset] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [firstMsg, setFirstMsg] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);
  const me = TokenStore.getUser();

  useEffect(() => {
    fetchConvos();
  }, []);

  // Deep link from "Message" buttons elsewhere in the app —
  // /dashboard/messages?to=<user_id>&name=<name> — previously every one of
  // those buttons just navigated here with no context, landing on the
  // generic inbox instead of that person's chat.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const to = params.get("to");
    const name = params.get("name") || "";
    if (!to || loading) return;

    const existing = convos.find((c: any) =>
      (c.participants || []).includes(to),
    );
    if (existing) {
      openConvo(existing);
    } else {
      setRecipientId(to);
      setRecipientPreset({ id: to, name });
      setNewConvo(true);
    }
    // Clean the URL so re-fetching/back-nav doesn't re-trigger this
    window.history.replaceState({}, "", "/dashboard/messages");
  }, [loading]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const fetchConvos = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await MessagesAPI.conversations();
      setConvos(res.items || res);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const openConvo = async (conv: any) => {
    setSelected(conv);
    setMsgLoading(true);
    try {
      const res = await MessagesAPI.get(conv.id);
      const msgs = (res.items || res).reverse();
      setMessages(msgs);
      await MessagesAPI.markRead(conv.id);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setMsgLoading(false);
    }
  };

  // Real fix for "messages from the other person don't show up unless I
  // reopen the chat" — there was no polling at all before. Refetches the
  // open conversation every 5s while it's open, and the conversation list
  // every 15s so previews/unread state stay current too.
  useEffect(() => {
    if (!selected) return;
    const poll = setInterval(async () => {
      try {
        const res = await MessagesAPI.get(selected.id);
        const msgs = (res.items || res).reverse();
        // Only replace (and let the scroll-to-bottom effect below fire)
        // if something actually changed — otherwise every 5s poll tick
        // would yank the view back to the bottom even if the person had
        // scrolled up to read earlier messages.
        setMessages((prev) => {
          const changed =
            msgs.length !== prev.length ||
            msgs[msgs.length - 1]?.id !== prev[prev.length - 1]?.id;
          if (changed) MessagesAPI.markRead(selected.id).catch(() => {});
          return changed ? msgs : prev;
        });
      } catch {
        /* silent — don't disrupt an open chat over a transient poll failure */
      }
    }, 5000);
    return () => clearInterval(poll);
  }, [selected?.id]);

  useEffect(() => {
    const poll = setInterval(() => {
      fetchConvos();
    }, 15000);
    return () => clearInterval(poll);
  }, []);

  const sendMessage = async () => {
    if (!newMsg.trim() || !selected) return;
    setSending(true);
    try {
      const msg = await MessagesAPI.send(selected.id, { text: newMsg.trim() });
      setMessages((prev) => [...prev, msg]);
      setNewMsg("");
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSending(false);
    }
  };

  const startConvo = async () => {
    if (!recipientId.trim() || !firstMsg.trim()) return;
    setSending(true);
    try {
      const conv = await MessagesAPI.start({
        recipient_id: recipientId.trim(),
        message: firstMsg.trim(),
      });
      setConvos((prev) => [conv, ...prev]);
      setNewConvo(false);
      setRecipientId("");
      setRecipientPreset(null);
      setFirstMsg("");
      openConvo(conv);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSending(false);
    }
  };

  const otherParticipant = (conv: any) => {
    return conv?.user?.name || "Unknown Member";
  };

  return (
    <div className="page messages-page">
      {/* Left — conversation list */}
      <aside className="messages-inbox">
        <div className="messages-inbox-header">
          <div>
            <span>YOUR NETWORK</span>
            <h2>Messages</h2>
          </div>
          <button
            className="btn btn-p btn-sm"
            onClick={() => {
              setRecipientId("");
              setRecipientPreset(null);
              setNewConvo(true);
            }}
          >
            <FontAwesomeIcon icon={faPlus} /> New
          </button>
        </div>
        <div className="messages-conversation-list">
          {loading ? (
            [...Array(4)].map((_, i) => (
              <div key={i} className="messages-conversation messages-skeleton">
                <div className="messages-skeleton-avatar" />
                <div className="messages-skeleton-copy">
                  <div />
                  <div />
                </div>
              </div>
            ))
          ) : convos.length === 0 ? (
            <div className="messages-list-empty">
              <FontAwesomeIcon icon={faComment} />
              <strong>No conversations yet</strong>
              <span>Start a conversation with someone in your network.</span>
            </div>
          ) : (
            convos.map((conv) => (
              <button
                key={conv.id}
                onClick={() => openConvo(conv)}
                className={`messages-conversation${selected?.id === conv.id ? " active" : ""}`}
              >
                <div className="messages-avatar">
                  {conv.user?.avatar_url ? (
                    <img
                      src={conv.user.avatar_url}
                      alt={otherParticipant(conv)}
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                      }}
                    />
                  ) : (
                    (conv.user?.name || "?").charAt(0).toUpperCase()
                  )}
                </div>
                <div className="messages-conversation-copy">
                  <strong>{otherParticipant(conv)}</strong>
                  <span>{conv.last_message || "No messages yet"}</span>
                </div>
                <span className="messages-conversation-chevron">›</span>
              </button>
            ))
          )}
        </div>
      </aside>

      {/* Right — message thread */}
      <section className="messages-thread">
        {!selected ? (
          <div className="messages-welcome">
            <div className="messages-welcome-icon">
              <FontAwesomeIcon icon={faComment} />
            </div>
            <span>STAY CONNECTED</span>
            <h2>Your conversations, all in one place</h2>
            <p>
              Select a conversation from the left, or start a new message with a
              NetworkX member.
            </p>
            <button
              className="btn btn-p"
              onClick={() => {
                setRecipientId("");
                setRecipientPreset(null);
                setNewConvo(true);
              }}
            >
              <FontAwesomeIcon icon={faPlus} /> Start conversation
            </button>
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="messages-thread-header">
              <button
                className="messages-mobile-back"
                onClick={() => setSelected(null)}
                aria-label="Back to conversations"
              >
                <FontAwesomeIcon icon={faArrowLeft} />
              </button>
              <div className="messages-avatar messages-avatar-lg">
                {selected.user?.avatar_url ? (
                  <img
                    src={selected.user.avatar_url}
                    alt={otherParticipant(selected)}
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                    }}
                  />
                ) : (
                  otherParticipant(selected).charAt(0).toUpperCase()
                )}
              </div>
              <div>
                <strong>{otherParticipant(selected)}</strong>
                <span>NetworkX member</span>
              </div>
            </div>

            {/* Messages */}
            <div className="messages-stream">
              {msgLoading ? (
                <div className="messages-loading">Loading conversation…</div>
              ) : messages.length === 0 ? (
                <div className="messages-stream-empty">
                  <FontAwesomeIcon icon={faComment} />
                  <strong>Start the conversation</strong>
                  <span>Send a friendly message below.</span>
                </div>
              ) : (
                messages.map((msg, i) => {
                  const isMe = msg.sender_id === me?.id;
                  return (
                    <div
                      key={i}
                      className={`messages-message-row ${isMe ? "mine" : "theirs"}`}
                    >
                      <div className="messages-bubble">
                        <div>{msg.text}</div>
                        <time>
                          {msg.sent_at
                            ? new Date(msg.sent_at).toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                              })
                            : ""}
                        </time>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={bottomRef} />
            </div>

            {/* Input */}
            <div className="messages-composer">
              <input
                value={newMsg}
                onChange={(e) => setNewMsg(e.target.value)}
                onKeyDown={(e) =>
                  e.key === "Enter" && !e.shiftKey && sendMessage()
                }
                placeholder="Write a message…"
              />
              <button
                className="btn btn-p"
                onClick={sendMessage}
                disabled={sending || !newMsg.trim()}
                aria-label="Send message"
              >
                {sending ? "…" : <FontAwesomeIcon icon={faPaperPlane} />}
              </button>
            </div>
          </>
        )}
      </section>

      {/* New Conversation Modal */}
      {newConvo && (
        <div
          className="overlay"
          onClick={(e) =>
            e.target === e.currentTarget &&
            (setNewConvo(false), setRecipientPreset(null))
          }
        >
          <div className="modal">
            <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 14 }}>
              New Conversation
            </h3>
            <div className="fg" style={{ marginBottom: 10 }}>
              <UserSearchPicker
                label="Recipient"
                required
                placeholder="Search member by name, email or city…"
                value={recipientId}
                initialUser={recipientPreset}
                onChange={(id, user) => {
                  setRecipientId(id);
                  setRecipientPreset(user ? { id, name: user.name } : null);
                }}
              />
            </div>
            <div className="fg" style={{ marginBottom: 14 }}>
              <label>First Message</label>
              <input
                value={firstMsg}
                onChange={(e) => setFirstMsg(e.target.value)}
                placeholder="Type your message..."
                autoFocus={!!recipientPreset}
              />
            </div>
            {error && (
              <div style={{ color: "#ef4444", fontSize: 13, marginBottom: 10 }}>
                {error}
              </div>
            )}
            <div style={{ display: "flex", gap: 8 }}>
              <button
                className="btn btn-p"
                style={{ flex: 1 }}
                onClick={startConvo}
                disabled={sending || !recipientId || !firstMsg}
              >
                {sending ? "Starting…" : "Start Conversation"}
              </button>
              <button
                className="btn btn-g"
                style={{ flex: 1 }}
                onClick={() => {
                  setNewConvo(false);
                  setRecipientPreset(null);
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
