import { create } from "zustand";

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

  unreadCounts: {},

  setUnreadCounts: (updater) =>
    set((state) => ({
      unreadCounts:
        typeof updater === "function"
          ? updater(state.unreadCounts)
          : updater,
    })),
}));

export default useGetConversation;