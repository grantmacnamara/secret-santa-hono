export function renderGiftPreferences(preferences = {}, config = {}, user = {}) {
  const prefs = {
    likes: [],
    dislikes: [],
    ...preferences
  }

  prefs.likes = prefs.likes || []
  prefs.dislikes = prefs.dislikes || []

  // Check if preferences have been saved (they exist in the user data)
  const prefsAreSaved = Boolean(
    user.giftPreferences?.likes?.[0] && 
    user.giftPreferences?.likes?.[1] && 
    user.giftPreferences?.dislikes?.[0] && 
    user.giftPreferences?.dislikes?.[1]
  )

  // Determine button state and text
  const readyButtonState = () => {
    if (!prefsAreSaved) {
      return {
        text: 'Ready?',
        class: 'btn-secondary',
        disabled: true
      }
    }
    if (user.ready) {
      return {
        text: 'You\'re all ready! ✓',
        class: 'btn-success',
        disabled: false
      }
    }
    return {
      text: 'Ready?',
      class: 'btn-primary',
      disabled: false
    }
  }

  const readyButton = readyButtonState()

  return `
    <form method="POST" class="gift-preferences">
      <div class="price-range-info">
        <h3>Gift Price Limit</h3>
        <p class="price-range-display">£${config.priceRange || '0'}</p>
      </div>

      <div class="preference-group">
        <label>Two Things You Like</label>
        <div class="preference-inputs">
          <input type="text" 
                 name="likes[0]" 
                 value="${prefs.likes[0] || ''}" 
                 placeholder="First thing you like"
                 maxlength="50"
                 required>
          <input type="text" 
                 name="likes[1]" 
                 value="${prefs.likes[1] || ''}" 
                 placeholder="Second thing you like"
                 maxlength="50"
                 required>
        </div>
      </div>

      <div class="preference-group">
        <label>Two Things You Dislike</label>
        <div class="preference-inputs">
          <input type="text" 
                 name="dislikes[0]" 
                 value="${prefs.dislikes[0] || ''}" 
                 placeholder="First thing you dislike"
                 maxlength="50"
                 required>
          <input type="text" 
                 name="dislikes[1]" 
                 value="${prefs.dislikes[1] || ''}" 
                 placeholder="Second thing you dislike"
                 maxlength="50"
                 required>
        </div>
      </div>

      <div class="preference-actions">
        <button type="submit" 
                formaction="/preferences"
                class="btn btn-primary">
          Save Preferences
        </button>

        <button type="submit" 
                formaction="/ready"
                class="btn ${readyButton.class}"
                ${readyButton.disabled ? 'disabled' : ''}>
          ${readyButton.text}
        </button>
      </div>
    </form>
  `
} 