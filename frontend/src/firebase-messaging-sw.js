importScripts('https://www.gstatic.com/firebasejs/10.0.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.0.0/firebase-messaging-compat.js');

// Replace with your actual Firebase config (same values as environment.ts)
firebase.initializeApp({
  apiKey: 'YOUR_API_KEY',
  authDomain: 'YOUR_PROJECT.firebaseapp.com',
  projectId: 'YOUR_PROJECT_ID',
  storageBucket: 'YOUR_PROJECT.appspot.com',
  messagingSenderId: 'YOUR_SENDER_ID',
  appId: 'YOUR_APP_ID'
});

const messaging = firebase.messaging();

// Handle background messages
messaging.onBackgroundMessage(payload => {
  const { title, body } = payload.notification ?? {};
  if (title) {
    self.registration.showNotification(title, {
      body: body ?? '',
      icon: '/assets/icons/icon-192x192.png'
    });
  }
});
