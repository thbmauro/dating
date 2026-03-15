# Dating Icebreakers

Fun and engaging icebreaker questions for dating conversations. Get random conversation starters filtered by vibe/topic.

## How It Works

- Shows one icebreaker question at a time
- Swipe left/right to get a new random icebreaker
- Two tabs: **Ice Breakers** (random questions) and **Compatibility** (2-person quiz mode)
- Filter by category using the emoji-based filter modal (Ice Breakers tab only)
- Share icebreakers with the system share sheet
- Save favorite questions
- 8 categories with 20 questions each (160 total icebreakers)
- 20 compatibility questions with 2 answer choices each

## Compatibility Mode

- 20 relationship-focused questions with 2 answer options
- Two-person answering system: Person 1 answers first, then Person 2
- Progress indicator shows "X of 20" in top right
- Person indicators at bottom right show who's answering (highlighted circle)
- Green checkmark appears when a person has answered
- Card auto-swipes to next question after both people answer
- No manual swiping allowed - controlled by answer selection

## Categories

- 💋 **Flirty** - Playful, flirty questions
- 🌙 **Deep** - Emotional, meaningful questions
- 😂 **Funny** - Humorous icebreakers
- ✈️ **Travel** - Adventure and travel questions
- 🍕 **Food** - Food and drink conversations
- ✨ **Dreams** - Aspirations and dreams
- 🎵 **Music** - Music and entertainment
- 🎲 **Random** - Wild card surprises

## Architecture

### Mobile (`/mobile`)
- Single-screen Expo React Native app
- Light warm aesthetic with Inter font
- Zustand + AsyncStorage for state management
- React Query for API fetching
- Animated loading state and fade-in transitions
- Draggable category filter with emoji circles and bounce animation on hover

### Backend (`/backend`)
- Hono API on Bun runtime
- `GET /api/icebreakers/random` - returns a random icebreaker
- `GET /api/icebreakers/random?category=flirty` - filters by category
- `GET /api/icebreakers/categories` - lists all available categories
- Returns: `{ question, category, emoji }`

## Features

- **Emoji Circle Filter**: Drag the center dot toward an emoji circle to filter by that vibe. Circles bounce when hovered.
- **Settings Button**: Located below the "Drop the heart on a topic" text in the filter modal. Tap to access color theme and haptic feedback settings.
- **Color Themes**: Choose between Warm, Cool, and Neutral color palettes. The selected theme is applied throughout the entire app - backgrounds, cards, and buttons all adapt to your chosen color palette.
- **Haptic Feedback**: Toggle tactile feedback on interactions (affects the entire app)
- **Share**: Share icebreakers via system share sheet
- **Smooth Animations**: Spring animations and fade transitions
