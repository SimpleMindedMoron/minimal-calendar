/// <reference lib="webworker" />
declare const self: ServiceWorkerGlobalScope;

// Handle incoming push notifications from the server
self.addEventListener("push", (event) => {
  if (!event.data) return;

  let data: { title: string; body: string; icon?: string; url?: string };
  try {
    data = event.data.json();
  } catch {
    data = { title: "Align", body: event.data.text() };
  }

  const options = {
    body: data.body,
    icon: data.icon || "/icons/icon-192x192.png",
    badge: "/icons/icon-192x192.png",
    tag: "align-event-notification",
    renotify: true,
    data: { url: data.url || "/" },
  } as NotificationOptions;

  event.waitUntil(self.registration.showNotification(data.title, options));
});

// Open the app when a notification is clicked
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const targetUrl: string = event.notification.data?.url || "/";
  event.waitUntil(
    (self.clients as Clients).matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url === targetUrl && "focus" in client) {
          return (client as WindowClient).focus();
        }
      }
      return (self.clients as Clients).openWindow(targetUrl);
    })
  );
});

export {};
