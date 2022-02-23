import { configureStore, createSlice } from '@reduxjs/toolkit';
import User from '../entity/User';

export interface State {
    user?: User
}

const initialState: State = {
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