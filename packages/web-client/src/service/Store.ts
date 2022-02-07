import { createSlice, configureStore } from '@reduxjs/toolkit'

const slice = createSlice({
    name: 'store',
    initialState: {
        user: null,
        currentGame: null
    },
    reducers: {
        userChanged: (state, action) => {
            state.user = action.payload
        },
        currentGameChanged: (state, action) => {
            state.currentGame = action.payload
        }
    }
})

const store = configureStore({
    reducer: slice.reducer
})

export default store;
export const { userChanged, currentGameChanged } = slice.actions;