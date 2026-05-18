import { create } from "zustand";

const saveUnreadCounts = (counts) => {
  try {
    localStorage.setItem("unreadCounts", JSON.stringify(counts));
  } catch {}
};

export const clearUnreadStorage = () => {
  try {
    localStorage.removeItem("unreadCounts");
  } catch {}
};

const useGetConversation = create((set, get) => ({
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

  unreadCounts: {},
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

  clearAll: () => {
    clearUnreadStorage();
    set({
      selectedConversation: null,
      messages: [],
      unreadCounts: {},
      lastMessages: {},
    });
  },
}));

export default useGetConversation;