import React from 'react'
import { Link } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { fetchNotificationsWebsocket, selectNotificationsMetadata, useGetNotificationsQuery } from '../features/notifications/notificationsSlice'

export const Navbar = () => {

  const dispatch = useDispatch()
  useGetNotificationsQuery()
  // const notification = useSelector(selectAllNotifications)
  const notificationsMetadata = useSelector(selectNotificationsMetadata)
  // const numUnreadNotifications = notification.filter(n => !n.read).length
  const numUnreadNotifications = notificationsMetadata.filter(n => !n.read).length
  const fetchNewNotifications = () => {
    //dispatch(fetchNotifications())
    dispatch(fetchNotificationsWebsocket())
  }

  let unreadNotificationsBadge

  if (numUnreadNotifications > 0) {
    unreadNotificationsBadge = (
      <span className='badge'>{numUnreadNotifications}</span>
    )
  }

  return (
    <nav>
      <section>
        <h1>Redux Essentials Example</h1>

        <div className="navContent">
          <div className="navLinks">
            <Link to="/">Posts</Link>
            <Link to="/users">Users</Link>
            <Link to="/notifications">Notifications {unreadNotificationsBadge}</Link>
          </div>
          <button className="button" onClick={fetchNewNotifications}>
            Refresh Notifications
          </button>
        </div>
      </section>
    </nav>
  )
}
