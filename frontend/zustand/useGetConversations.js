import { create } from "zustand";

const loadUnreadCounts = () => {
  try {
    const stored = localStorage.getItem("unreadCounts");
    return stored ? JSON.parse(stored) : {};
  } catch {
    return {};
  }
};

const saveUnreadCounts = (counts) => {
  try {
    localStorage.setItem("unreadCounts", JSON.stringify(counts));
  } catch {}
};

const useGetConversation = create((set) => ({
  selectedConversation: null,
  setSelectedConversation: (selectedConversation) =>
    set({ selectedConversation }),

  messages: [],
  setMessages: (messages) =>
    set((state) => ({
      messages:
        typeof messages === "function"
          ? messages(state.messages)
          : messages,
    })),

  unreadCounts: loadUnreadCounts(),
  setUnreadCounts: (updater) =>
    set((state) => {
      const next =
        typeof updater === "function"
          ? updater(state.unreadCounts)
          : updater;
      saveUnreadCounts(next);
      return { unreadCounts: next };
    }),

  lastMessages: {},
  setLastMessage: (userId, messageObj) =>
    set((state) => ({
      lastMessages: {
        ...state.lastMessages,
        [userId]: messageObj,
      },
    })),
}));

export default useGetConversation;