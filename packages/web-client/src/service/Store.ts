import { configureStore, createSlice } from '@reduxjs/toolkit';
import User from '../entity/User';

export interface StoreState {
    user?: User
}

const initialState: StoreState = {
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