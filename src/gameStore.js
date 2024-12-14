const { createStore } = require('zustand/vanilla');

const useGameStore = createStore((set) => ({
    isJoiningAllowed: false,
    isGameRunning: false,
    currentQuestionTimeout: null,
    currentQuestionIndex: 0,
    currentPlayerIndex: 0,
    currentPlayer: null,
    players: [],
    topic: null,
    joiningTimeLimit: 30,
    questionTime: 10,
    addPlayer: (player) => set((state) => ({
        players: [...state.players, player],
    })),
    resetGame: () =>
        set({
            isJoiningAllowed: false,
            isGameRunning: false,
            currentQuestionTimeout: null,
            currentQuestionIndex: 0,
            currentPlayerIndex: 0,
            currentPlayer: null,
            players: [],
            topic: null,
            joiningTimeLimit: 30,
            questionTime: 10,
        }),
    removePlayer: (playerId) =>
        set((state) => ({
            players: state.players.filter((player) => player.id !== playerId),
        })),

    nextQuestion: (topics) =>
        set((state) => ({
            currentQuestionIndex:
                (state.currentQuestionIndex + 1) % topics[state.topic].length,
        })),

    nextPlayer: () =>
        set((state) => ({
            currentPlayerIndex:
                (state.currentPlayerIndex + 1) % state.players.length,
        })),
    startJoining: () =>
        set({ isJoiningAllowed: true }),
    stopJoining: () => set({ isJoiningAllowed: false }),
    setTopic: (topic) => set({ topic }),
    setQuestionTime: (time) => set({ questionTime: time }),
    setJoiningTimeLimit: (time) => set({ joiningTimeLimit: time }),
    setQuestionTime: (time) => set({ questionTime: time }),
    setCurrentQuestionTimeout: (timeOut) => set({ currentQuestionTimeout: timeOut })

}));

module.exports = useGameStore;
