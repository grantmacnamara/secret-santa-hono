export function renderGiftPreferences(preferences = {}, config = {}) {
  const prefs = {
    likes: [],
    dislikes: [],
    ...preferences
  }

  prefs.likes = prefs.likes || []
  prefs.dislikes = prefs.dislikes || []

  return `
    <div class="gift-preferences">
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
    </div>
  `
} 