import { createSlice, createEntityAdapter, createSelector, createAction, isAnyOf } from "@reduxjs/toolkit";

//import { client } from "../../api/client";
import { apiSlice } from "../api/apiSlice";
import { forceGenerateNotifications } from '../../api/server'

const notificationsReceived = createAction(
    "notifications/notificationsReceived"
)

export const extendedApi = apiSlice.injectEndpoints({
    endpoints: builder => ({
        getNotifications: builder.query({
            query: () => "/notifications",
            async onCacheEntryAdded(
                arg,
                { updateCachedData, cacheDataLoaded, cacheEntryRemoved, dispatch }
            ) {
                const ws = new WebSocket("ws://localhost")
                try {
                    await cacheDataLoaded
                    const listener = event => {
                        const message = JSON.parse(event.data)
                        switch (message.type) {
                            case "notifications": {
                                updateCachedData(draft => {
                                    draft.push(...message.payload)
                                    draft.sort((a, b) => b.date.localeCompare(a.date))
                                })
                                dispatch(notificationsReceived(message.payload))
                                break
                            }
                            default:
                                break
                        }
                    }

                    ws.addEventListener("message", listener)
                } catch {
                    // no-op in case `cacheEntryRemoved` resolves before `cacheDataLoaded`,
                    // in which case `cacheDataLoaded` will throw
                }
                await cacheEntryRemoved
                ws.close()
            }
        })
    })
})

export const { useGetNotificationsQuery } = extendedApi

const emptyNotifications = []

export const selectNotificationsResult = extendedApi.endpoints.getNotifications.select()

const selectNotificationsData = createSelector(
    selectNotificationsResult,
    notificationsResult => notificationsResult.data ?? emptyNotifications
)

export const fetchNotificationsWebsocket = () => (dispatch, getState) => {
    const allNotifications = selectNotificationsData(getState())
    const [latestNotification] = allNotifications
    const latestTimestamp = latestNotification?.date ?? ""
    forceGenerateNotifications(latestTimestamp)
}

// const notificationsAdapter = createEntityAdapter({
//     sortComparer: (a, b) => b.date.localeCompare(a.date)
// })

const notificationsAdapter = createEntityAdapter()

const matchNotificationsReceived = isAnyOf(
    notificationsReceived,
    extendedApi.endpoints.getNotifications.matchFulfilled
)

// export const fetchNotifications = createAsyncThunk(
//     "notifications/fetchNotifications",
//     async (_, { getState }) => {
//         const allNotifications = selectAllNotifications(getState())
//         const [latestNotification] = allNotifications
//         const latestTimestamp = latestNotification ? latestNotification.date : ""
//         const response = await client.get(`/fakeApi/notifications?since=${latestTimestamp}`)

//         return response.data
//     }
// )

const notificationsSlice = createSlice({
    name: "notifications",
    initialState: notificationsAdapter.getInitialState(),
    reducers: {
        allNotificationsRead(state, action) {
            // state.forEach(notification => {
            //     notification.read = true
            // })
            Object.values(state.entities).forEach(notification => {
                notification.read = true
            })
        }
    },
    extraReducers(builder) {
        // builder.addCase(fetchNotifications.fulfilled, (state, action) => {
        //     // state.push(...action.payload)
        //     // state.forEach(notification => {
        //     //     notification.isNew = !notification.read
        //     // })
        //     // state.sort((a, b) => b.date.localeCompare(a.date))
        //     notificationsAdapter.upsertMany(state, action.payload)
        //     Object.values(state.entities).forEach(notification => {
        //         notification.isNew = !notification.read
        //     })
        // })
        builder.addMatcher(matchNotificationsReceived, (state, action) => {
            const notificationsMetadata = action.payload.map(notification => ({
                id: notification.id,
                read: false,
                isNew: true
            }))

            Object.values(state.entities).forEach(notification => {
                notification.isNew = !notification.read
            })

            notificationsAdapter.upsertMany(state, notificationsMetadata)
        })
    }
})

export default notificationsSlice.reducer

export const { 
    //selectAll: selectAllNotifications 
    selectAll: selectNotificationsMetadata,
    selectEntities: selectMetadataEntities
} =
  notificationsAdapter.getSelectors(state => state.notifications)

// export const selectAllNotifications = state => state.notifications

export const { allNotificationsRead } = notificationsSlice.actions