import User from '@tix320/noir-core/src/entity/User';
import { createSlice, configureStore } from '@reduxjs/toolkit'

export interface State {
    user?:User
}

const initialState : State =  {
};

const slice = createSlice({
    name: 'store',
    initialState,
    reducers: {
        userChanged: (state, action) => {
            state.user = action.payload
        }
    }
})

const store = configureStore({
    reducer: slice.reducer
})

export default store;
export const { userChanged } = slice.actions;