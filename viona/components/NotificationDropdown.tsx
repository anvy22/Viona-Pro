"use client"

import { useState, useRef, useEffect } from "react"
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Bell, BellRing, Check, Trash2, Settings, X, Mail, Package, Calendar, Shield } from "lucide-react"

// Notification type with additional properties
interface Notification {
  id: string
  title: string
  message: string
  time: string
  unread: boolean
  type: 'message' | 'order' | 'reminder' | 'system' | 'default'
  priority: 'low' | 'medium' | 'high'
}

// Enhanced dummy data with more variety
const dummyNotifications: Notification[] = [
  {
    id: "1",
    title: "New Message from Sarah",
    message: "Hey! Just wanted to check if you're still coming to the meeting tomorrow at 2 PM?",
    time: "2 min ago",
    unread: true,
    type: 'message',
    priority: 'medium'
  },
  {
    id: "2",
    title: "Order Shipped Successfully",
    message: "Your order #ORD-2024-1234 has been dispatched and is on its way. Expected delivery: Tomorrow",
    time: "1 hour ago",
    unread: true,
    type: 'order',
    priority: 'low'
  },
  {
    id: "3",
    title: "Urgent: Team Meeting",
    message: "Quarterly review meeting moved to 3:00 PM today in Conference Room A",
    time: "2 hours ago",
    unread: true,
    type: 'reminder',
    priority: 'high'
  },
  {
    id: "4",
    title: "Security Alert",
    message: "Your password will expire in 5 days. Please update it to maintain account security.",
    time: "Yesterday",
    unread: false,
    type: 'system',
    priority: 'medium'
  },
  {
    id: "5",
    title: "Welcome Back!",
    message: "We noticed you haven't logged in for a while. Check out what's new since your last visit.",
    time: "2 days ago",
    unread: false,
    type: 'default',
    priority: 'low'
  }
]

// Icon mapping for notification types
const getNotificationIcon = (type: Notification['type']) => {
  const iconProps = { className: "h-4 w-4" }
  switch (type) {
    case 'message': return <Mail {...iconProps} />
    case 'order': return <Package {...iconProps} />
    case 'reminder': return <Calendar {...iconProps} />
    case 'system': return <Shield {...iconProps} />
    default: return <Bell {...iconProps} />
  }
}

// Priority color mapping
const getPriorityColor = (priority: Notification['priority']) => {
  switch (priority) {
    case 'high': return 'bg-red-500'
    case 'medium': return 'bg-blue-500'
    case 'low': return 'bg-gray-400'
    default: return 'bg-gray-400'
  }
}

export function NotificationDropdown() {
  const [isOpen, setIsOpen] = useState(false)
  const [notifications, setNotifications] = useState<Notification[]>(dummyNotifications)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Count unread notifications
  const unreadCount = notifications.filter(n => n.unread).length

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  // Mark notification as read
  const markAsRead = (id: string) => {
    setNotifications(prev => 
      prev.map(n => n.id === id ? { ...n, unread: false } : n)
    )
  }

  // Mark all as read
  const markAllAsRead = () => {
    setNotifications(prev => 
      prev.map(n => ({ ...n, unread: false }))
    )
  }

  // Delete notification
  const deleteNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id))
  }

  // Clear all notifications
  const clearAll = () => {
    setNotifications([])
  }

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Trigger Button with Bell Icon and Badge */}
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setIsOpen(!isOpen)}
        className="relative hover:bg-accent transition-colors"
        aria-label={`Notifications ${unreadCount > 0 ? `(${unreadCount} unread)` : ''}`}
      >
        {unreadCount > 0 ? (
          <BellRing className="h-5 w-5 text-primary" />
        ) : (
          <Bell className="h-5 w-5" />
        )}
        
        {/* Unread Badge */}
        {unreadCount > 0 && (
          <Badge 
            variant="destructive" 
            className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs animate-pulse"
          >
            {unreadCount > 99 ? '99+' : unreadCount}
          </Badge>
        )}
      </Button>

      {/* Dropdown Panel with Animation */}
      {isOpen && (
        <Card className="absolute top-full right-0 mt-2 w-96 z-50 shadow-lg border rounded-lg animate-in slide-in-from-top-2 duration-200">
          <CardHeader className="border-b pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-semibold">Notifications</CardTitle>
              <div className="flex items-center gap-2">
                {unreadCount > 0 && (
                  <Badge variant="secondary" className="text-xs">
                    {unreadCount} new
                  </Badge>
                )}
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsOpen(false)}
                  className="h-6 w-6"
                  aria-label="Close notifications"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
            
            {/* Action Buttons */}
            {notifications.length > 0 && (
              <div className="flex items-center gap-2 mt-3">
                {unreadCount > 0 && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={markAllAsRead}
                    className="text-xs"
                  >
                    <Check className="h-3 w-3 mr-1" />
                    Mark all read
                  </Button>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={clearAll}
                  className="text-xs text-destructive hover:text-destructive"
                >
                  <Trash2 className="h-3 w-3 mr-1" />
                  Clear all
                </Button>
              </div>
            )}
          </CardHeader>

          <CardContent className="p-0">
            <ScrollArea className="max-h-96">
              {notifications.length > 0 ? (
                <div className="divide-y">
                  {notifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={`p-4 hover:bg-accent/50 transition-colors group ${
                        notification.unread ? 'bg-accent/20' : ''
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        {/* Type Icon */}
                        <div className="flex-shrink-0 p-2 rounded-full bg-accent/50">
                          {getNotificationIcon(notification.type)}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex items-center gap-2">
                              <h4 className="text-sm font-semibold truncate">
                                {notification.title}
                              </h4>
                              {/* Priority Indicator */}
                              <div
                                className={`w-2 h-2 rounded-full flex-shrink-0 ${getPriorityColor(notification.priority)}`}
                                title={`${notification.priority} priority`}
                              />
                            </div>
                            
                            {/* Unread Indicator */}
                            {notification.unread && (
                              <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 mt-1" />
                            )}
                          </div>
                          
                          <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                            {notification.message}
                          </p>
                          
                          <div className="flex items-center justify-between mt-3">
                            <span className="text-xs text-muted-foreground">
                              {notification.time}
                            </span>
                            
                            {/* Action Buttons */}
                            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              {notification.unread && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => markAsRead(notification.id)}
                                  className="h-6 w-6"
                                  title="Mark as read"
                                >
                                  <Check className="h-3 w-3" />
                                </Button>
                              )}
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => deleteNotification(notification.id)}
                                className="h-6 w-6 text-destructive hover:text-destructive"
                                title="Delete notification"
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center">
                  <Bell className="h-12 w-12 text-muted-foreground/50 mx-auto mb-3" />
                  <p className="text-sm text-muted-foreground font-medium">No notifications</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    You're all caught up! Check back later for updates.
                  </p>
                </div>
              )}
            </ScrollArea>
          </CardContent>

          {/* Footer Actions */}
          {notifications.length > 0 && (
            <>
              <Separator />
              <div className="p-4 space-y-2">
                <Button variant="ghost" size="sm" className="w-full justify-start">
                  <Bell className="h-4 w-4 mr-2" />
                  View all notifications
                </Button>
                <Button variant="ghost" size="sm" className="w-full justify-start">
                  <Settings className="h-4 w-4 mr-2" />
                  Notification settings
                </Button>
              </div>
            </>
          )}
        </Card>
      )}
    </div>
  )
}