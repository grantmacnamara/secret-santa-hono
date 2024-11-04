export function createNotification(type, message) {
  return `
    <div class="notification notification-${type}">
      ${message}
      <button onclick="this.parentElement.remove()" class="notification-close">&times;</button>
    </div>
  `
} 