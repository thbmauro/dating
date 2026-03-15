import { Hono } from "hono";

const icebreakersRouter = new Hono();

interface Category {
  name: string;
  emoji: string;
  questions: string[];
}

interface CompatibilityQuestion {
  question: string;
  answers: string[]; // 2-4 answers
}

interface CompatibilityCategory {
  name: string;
  emoji: string;
  questions: CompatibilityQuestion[];
}

const categories: Category[] = [
  {
    name: "flirty",
    emoji: "💋",
    questions: [
      "What's the most attractive quality someone can have that isn't physical?",
      "If you could plan the perfect date night, what would it look like?",
      "What's your love language and how do you like to receive affection?",
      "What's the cheesiest pickup line that would actually work on you?",
      "What song would you want playing during a romantic slow dance?",
      "What's your idea of a perfect kiss?",
      "If we were the last two people on Earth, what would you suggest we do first?",
      "What's the most romantic thing someone has ever done for you?",
      "Do you believe in love at first sight, or should I walk by again?",
      "What's your favorite thing to do with someone you're dating?",
      "What makes you feel most desired?",
      "If you could wake up anywhere in the world tomorrow with me, where would it be?",
      "What's a compliment that would make you blush?",
      "What's your guilty pleasure when it comes to romance?",
      "What would you wear on a fancy dinner date?",
      "What's the most spontaneous romantic thing you've ever done?",
      "What physical feature do you notice first in someone?",
      "If we had 24 hours together, how would you want to spend it?",
      "What's your favorite way to flirt?",
      "What's the sexiest accent in your opinion?",
    ],
  },
  {
    name: "deep",
    emoji: "🌙",
    questions: [
      "What's a belief you held strongly but changed your mind about?",
      "What does your ideal life look like in 10 years?",
      "What's the most important lesson life has taught you so far?",
      "What fear has held you back from something you wanted to do?",
      "If you could have dinner with anyone, living or dead, who would it be and why?",
      "What's a part of your personality you're still working on?",
      "What does home mean to you?",
      "What moment in your life shaped who you are today?",
      "What do you think happens after we die?",
      "What would you want to be remembered for?",
      "What's the hardest goodbye you've ever had to say?",
      "What makes you feel truly alive?",
      "What's something you've never told anyone?",
      "What do you value most in a relationship?",
      "If you could change one thing about how you were raised, what would it be?",
      "What's your biggest regret and what did you learn from it?",
      "When do you feel most like yourself?",
      "What's the kindest thing a stranger has ever done for you?",
      "What's a dream you've given up on, and do you still think about it?",
      "What does vulnerability mean to you?",
    ],
  },
  {
    name: "funny",
    emoji: "😂",
    questions: [
      "What's the most embarrassing song on your playlist that you secretly love?",
      "If animals could talk, which one would be the rudest?",
      "What's the weirdest thing you've ever eaten?",
      "If you were a vegetable, which one would you be and why?",
      "What's the worst fashion trend you participated in?",
      "If your life was a sitcom, what would it be called?",
      "What's the most useless talent you have?",
      "If you could have any mythical creature as a pet, what would you choose?",
      "What's the dumbest way you've ever injured yourself?",
      "If you had to eat one food for the rest of your life, what would it be?",
      "What's the worst date you've ever been on?",
      "If you were a wrestler, what would your entrance song be?",
      "What's the most ridiculous thing you've done to impress someone?",
      "If you could swap lives with any cartoon character, who would it be?",
      "What's the strangest dream you've ever had?",
      "If your pet could talk, what's the first thing they'd say about you?",
      "What's the worst haircut you've ever had?",
      "If you were a superhero, what would your totally useless power be?",
      "What's the most chaotic thing in your apartment right now?",
      "What would your memoir be titled?",
    ],
  },
  {
    name: "travel",
    emoji: "✈️",
    questions: [
      "What's the most beautiful place you've ever visited?",
      "If you could live in any city for a year, where would it be?",
      "Beach vacation or mountain adventure?",
      "What's on your travel bucket list?",
      "What's the best meal you've had while traveling?",
      "Do you prefer planning every detail or spontaneous travel?",
      "What's the most adventurous thing you've done while traveling?",
      "If you could road trip anywhere, where would you go?",
      "What's a place that completely exceeded your expectations?",
      "What country's culture are you most curious about?",
      "What's your airport personality like?",
      "Window seat or aisle seat?",
      "What's the longest flight you've been on?",
      "Have you ever traveled solo? Would you?",
      "What's a hidden gem destination you'd recommend?",
      "What souvenir do you always bring back from trips?",
      "What's a travel disaster that turned into a great story?",
      "If you could teleport anywhere right now, where would you go?",
      "What's on your travel packing essentials list?",
      "Airbnb or hotel person?",
    ],
  },
  {
    name: "food",
    emoji: "🍕",
    questions: [
      "What's your comfort food that always hits the spot?",
      "Are you a cook or a takeout person?",
      "What's the most exotic food you've tried?",
      "Sweet or savory breakfast?",
      "What's your go-to late night snack?",
      "If you could only eat one cuisine for the rest of your life, what would it be?",
      "What's a food combination that sounds weird but you love?",
      "What's your signature dish to cook?",
      "Coffee or tea person?",
      "What's a food you hated as a kid but love now?",
      "What's the best pizza topping combo?",
      "Are you a try-the-whole-menu person or a same-order-every-time person?",
      "What's your drink order at a bar?",
      "If you owned a restaurant, what type would it be?",
      "What food do you refuse to eat?",
      "What's the best thing you've ever cooked?",
      "Spicy food lover or mild food fan?",
      "What's your favorite dessert of all time?",
      "What's a food you've always wanted to try but haven't?",
      "Brunch person or dinner person?",
    ],
  },
  {
    name: "dreams",
    emoji: "✨",
    questions: [
      "If money wasn't an issue, what would you do with your life?",
      "What's a skill you've always wanted to learn?",
      "Where do you see yourself in five years?",
      "What's your biggest career goal?",
      "If you could master any instrument overnight, which would it be?",
      "What would your dream home look like?",
      "If you could start any business, what would it be?",
      "What's something you want to accomplish before you turn 50?",
      "If you could have any job regardless of salary, what would you do?",
      "What's a project you've been dreaming about starting?",
      "If you won the lottery tomorrow, what's the first thing you'd do?",
      "What's your dream vacation destination?",
      "What legacy do you want to leave behind?",
      "If you could live in any era, when would it be?",
      "What would you do with an extra hour every day?",
      "What's a wild dream you have that you haven't told many people?",
      "If you could instantly become an expert in something, what would it be?",
      "What would your perfect day look like from morning to night?",
      "What's a goal you're actively working towards right now?",
      "If you could collaborate with anyone on a project, who would it be?",
    ],
  },
  {
    name: "music",
    emoji: "🎵",
    questions: [
      "What song always puts you in a good mood?",
      "What's the last concert you went to?",
      "If your life had a theme song, what would it be?",
      "What artist could you listen to on repeat forever?",
      "What's a song that brings back strong memories?",
      "Are you a lyrics person or a melody person?",
      "What's your guilty pleasure song?",
      "What genre of music do you secretly love?",
      "What's the best live performance you've ever seen?",
      "If you could see any artist perform, living or dead, who would it be?",
      "What song do you always sing in the shower?",
      "What's your karaoke go-to song?",
      "What album changed your life?",
      "What's the first album or song you ever bought?",
      "Do you play any instruments?",
      "What's a band or artist you think is underrated?",
      "What song makes you want to dance no matter where you are?",
      "What's your favorite music decade?",
      "What's a song you've had stuck in your head recently?",
      "If you were in a band, what would your band name be?",
    ],
  },
  {
    name: "random",
    emoji: "🎲",
    questions: [
      "What's the most random fact you know?",
      "If you could have any superpower, what would you choose?",
      "What's something you're irrationally afraid of?",
      "If you could time travel, would you go to the past or future?",
      "What's your zodiac sign and do you think it fits you?",
      "If you were a pizza topping, which would you be?",
      "What's the last thing you Googled?",
      "What would you do if you were invisible for a day?",
      "What's your unpopular opinion?",
      "If you could switch lives with anyone for a week, who would it be?",
      "What's a random skill that you're surprisingly good at?",
      "If you could only watch one movie for the rest of your life, what would it be?",
      "What's the strangest gift you've ever received?",
      "If you had to delete all but three apps on your phone, which would you keep?",
      "What's something you think about way too much?",
      "If you could be famous for something, what would it be?",
      "What's a hill you're willing to die on?",
      "What's the most spontaneous thing you've ever done?",
      "If you were a brand, what would your slogan be?",
      "What's something on your bucket list that might surprise people?",
    ],
  },
  {
    name: "adventure",
    emoji: "🏕️",
    questions: [
      "What's the most adventurous thing you've ever done?",
      "Would you rather explore the deep ocean or outer space?",
      "What's a place you'd move to on a whim?",
      "Have you ever done something that genuinely scared you?",
      "What's your ideal outdoor adventure?",
      "Would you try solo travel to a country where you don't speak the language?",
      "What's the most remote place you've been?",
      "If you could go on any expedition, what would it be?",
      "What's your survival skill in the wilderness?",
      "Would you rather road trip or backpack?",
      "What's a spontaneous adventure you'd want to take this weekend?",
      "Have you ever gotten completely lost somewhere? What happened?",
      "What's a physical challenge you'd love to conquer?",
      "Mountains or beach — and which specific one?",
      "What's the most underrated travel destination you've been to?",
      "If you could live off-grid for a month, could you do it?",
      "What's your go-to adventure snack?",
      "Would you rather climb a volcano or dive with sharks?",
      "What's the wildest weather you've experienced?",
      "What's a childhood adventure you'd want to relive?",
    ],
  },
];

// Compatibility questions organized by category
const compatibilityCategories: CompatibilityCategory[] = [
  {
    name: "flirty",
    emoji: "💋",
    questions: [
      { question: "How do you show affection?", answers: ["Physical touch", "Words of affirmation", "Acts of service", "Quality time"] },
      { question: "How important is physical touch?", answers: ["Essential", "Nice but optional"] },
      { question: "What's your flirting style?", answers: ["Direct & bold", "Subtle & playful", "Humor-based", "Shy & reserved"] },
      { question: "Public displays of affection?", answers: ["Love them", "Keep it private"] },
      { question: "How do you express attraction?", answers: ["Words & compliments", "Actions & gestures", "Physical closeness", "Eye contact"] },
      { question: "First move on a date?", answers: ["I make it", "I wait for them", "Depends on the vibe"] },
      { question: "Romantic surprises?", answers: ["Love planning them", "Prefer to receive", "Both equally"] },
      { question: "What sparks chemistry for you?", answers: ["Witty banter", "Deep eye contact", "Shared laughter", "Intellectual connection"] },
      { question: "Morning person or night owl for romance?", answers: ["Morning cuddles", "Late night talks"] },
      { question: "How fast do you fall?", answers: ["Quick & intense", "Slow & steady", "Depends on the person"] },
      { question: "Texting frequency when dating?", answers: ["All day every day", "Quality over quantity", "Just essentials"] },
      { question: "Pet names in relationships?", answers: ["Love them", "Use real names", "Only in private"] },
      { question: "What's more romantic?", answers: ["Fancy dinner out", "Cozy night in", "Spontaneous adventure"] },
      { question: "Love letters or voice notes?", answers: ["Written words", "Hearing their voice", "Both are sweet"] },
      { question: "Dancing together?", answers: ["On the dance floor", "In the kitchen", "Anywhere music plays"] },
      { question: "Matching outfits as a couple?", answers: ["Cute & fun", "Too much"] },
      { question: "Anniversary celebrations?", answers: ["Go all out", "Keep it simple", "Something meaningful"] },
      { question: "Jealousy in relationships?", answers: ["A little is healthy", "Trust completely"] },
      { question: "Couple photos on social media?", answers: ["Share the love", "Keep it private", "Occasional posts"] },
      { question: "What wins you over?", answers: ["Grand gestures", "Small daily acts", "Consistency & reliability"] },
    ],
  },
  {
    name: "deep",
    emoji: "🌙",
    questions: [
      { question: "What's your love language?", answers: ["Words of Affirmation", "Quality Time", "Physical Touch", "Acts of Service", "Receiving Gifts"] },
      { question: "How important is alone time to you?", answers: ["Very important", "I prefer company", "Balance of both"] },
      { question: "How do you handle conflict?", answers: ["Talk it out now", "Take space first", "Write out my thoughts"] },
      { question: "What's your attachment style?", answers: ["Secure & steady", "Need reassurance", "Value independence", "Still figuring it out"] },
      { question: "What does commitment mean to you?", answers: ["All in, exclusive", "Gradual growth"] },
      { question: "What's your communication style?", answers: ["Direct & open", "Subtle hints", "Actions speak louder"] },
      { question: "How do you handle stress?", answers: ["Talk it out", "Process alone", "Physical activity", "Creative outlet"] },
      { question: "What does trust look like to you?", answers: ["Full transparency", "Respect privacy", "Earned over time"] },
      { question: "How important is family to you?", answers: ["Very central", "Independent first", "Balanced approach"] },
      { question: "How do you feel about long distance?", answers: ["Can make it work", "Not for me", "Temporary only"] },
      { question: "What's a dealbreaker for you?", answers: ["Dishonesty", "Lack of ambition", "Poor communication", "Incompatible values"] },
      { question: "Do you want kids someday?", answers: ["Yes", "No", "Open to it", "Unsure"] },
      { question: "How do you process emotions?", answers: ["Share with partner", "Journal or reflect", "Talk to friends", "Need time alone"] },
      { question: "Past relationships discussion?", answers: ["Open book", "Past is past", "Share when relevant"] },
      { question: "How do you apologize?", answers: ["Words & explanation", "Actions & change", "Both together"] },
      { question: "What matters more?", answers: ["Being understood", "Being supported", "Both equally"] },
      { question: "How do you show you care?", answers: ["Checking in often", "Giving space", "Acts of service", "Physical presence"] },
      { question: "Vulnerability in relationships?", answers: ["Essential & early", "Earned over time"] },
      { question: "How do you handle disagreements?", answers: ["Resolve immediately", "Sleep on it", "Discuss when calm"] },
      { question: "What builds intimacy for you?", answers: ["Deep conversations", "Shared experiences", "Physical closeness", "Emotional support"] },
    ],
  },
  {
    name: "funny",
    emoji: "😂",
    questions: [
      { question: "Your humor style?", answers: ["Witty & sarcastic", "Silly & goofy", "Dark humor", "Puns & wordplay"] },
      { question: "Pranks in relationships?", answers: ["Game on!", "Keep it chill"] },
      { question: "Embarrassing stories?", answers: ["Share everything", "Some secrets stay"] },
      { question: "Who's funnier?", answers: ["I am, obviously", "We'll see about that", "We're both hilarious"] },
      { question: "Watching comedy together?", answers: ["Same taste", "Take turns choosing", "Discover new stuff together"] },
      { question: "Inside jokes?", answers: ["The more the better", "A few special ones"] },
      { question: "Laughing at yourself?", answers: ["All the time", "Sometimes sensitive", "Depends on the situation"] },
      { question: "Dad jokes?", answers: ["Bring them on", "Please no", "Guilty pleasure"] },
      { question: "Tickle fights?", answers: ["Yes please", "Absolutely not"] },
      { question: "Funny voices & impressions?", answers: ["Daily occurrence", "Special occasions", "Save for private"] },
      { question: "Roasting each other?", answers: ["With love", "Too risky", "Only about certain things"] },
      { question: "Meme sharing?", answers: ["Constant stream", "Only the best ones"] },
      { question: "Karaoke nights?", answers: ["Main character energy", "Backup singer vibes", "Enthusiastic but terrible"] },
      { question: "Board game competitiveness?", answers: ["Play to win", "Just for fun", "Depends on the game"] },
      { question: "Silly nicknames?", answers: ["The weirder the better", "Keep it cute"] },
      { question: "Dancing badly on purpose?", answers: ["Signature move", "Trying to look cool", "Both depending on mood"] },
      { question: "Pun appreciation?", answers: ["10/10 love puns", "Eye roll worthy"] },
      { question: "Laugh until you cry moments?", answers: ["Need them daily", "Occasional is fine"] },
      { question: "Comedy shows or movies?", answers: ["Stand-up comedy", "Funny movies", "Both equally"] },
      { question: "Who tells better stories?", answers: ["I do", "We're both great", "Still competing"] },
    ],
  },
  {
    name: "travel",
    emoji: "✈️",
    questions: [
      { question: "Beach or mountains?", answers: ["Beach vibes", "Mountain adventures", "City exploration", "All of the above"] },
      { question: "Travel planning style?", answers: ["Detailed itinerary", "Go with the flow", "Rough outline only"] },
      { question: "Accommodation preference?", answers: ["Nice hotels", "Unique Airbnbs", "Hostels & budget", "Camping"] },
      { question: "Adventure vs relaxation?", answers: ["Action-packed trips", "Rest & recharge", "Mix of both"] },
      { question: "Solo travel or together?", answers: ["Always together", "Solo trips are healthy", "Both are valuable"] },
      { question: "Road trip or fly?", answers: ["Road trip adventure", "Fly and save time", "Depends on distance"] },
      { question: "How do you pack?", answers: ["Light & minimal", "Prepared for anything", "Last minute chaos"] },
      { question: "Food adventures while traveling?", answers: ["Try everything local", "Stick to favorites", "Mix of both"] },
      { question: "Tourist spots or hidden gems?", answers: ["Must-see landmarks", "Off the beaten path", "Both equally"] },
      { question: "Travel frequency ideal?", answers: ["As often as possible", "A few times a year", "Once a year is fine"] },
      { question: "Camping or glamping?", answers: ["Rough it outdoors", "Comfort is key", "Glamping compromise"] },
      { question: "International or domestic?", answers: ["Explore the world", "Discover home first", "Balance of both"] },
      { question: "Window or aisle seat?", answers: ["Window views", "Aisle freedom", "Middle seat warrior"] },
      { question: "Travel souvenirs?", answers: ["Collect memories", "Photos are enough", "Practical items only"] },
      { question: "Trip documentation?", answers: ["Post everything", "Live in the moment", "Private journal"] },
      { question: "Early flights or late?", answers: ["Early bird catches", "Never before noon", "Whatever is cheapest"] },
      { question: "Travel with friends or just us?", answers: ["The more the merrier", "Couple trips only", "Both types"] },
      { question: "Bucket list destinations?", answers: ["Similar lists", "Different dreams", "Create one together"] },
      { question: "Getting lost while traveling?", answers: ["Part of the adventure", "Stresses me out"] },
      { question: "Vacation budget approach?", answers: ["Splurge on experiences", "Budget-friendly finds", "Save for one big trip"] },
    ],
  },
  {
    name: "food",
    emoji: "🍕",
    questions: [
      { question: "Cooking at home or dining out?", answers: ["Home cooking", "Restaurant dates", "Perfect mix of both"] },
      { question: "Who cooks?", answers: ["I love cooking", "You cook, I clean", "Cook together", "Order in"] },
      { question: "Spicy food?", answers: ["The spicier the better", "Keep it mild", "Medium is perfect"] },
      { question: "Trying new foods?", answers: ["Always adventurous", "Comfort food fan", "Occasionally brave"] },
      { question: "Breakfast in bed?", answers: ["Romantic dream", "Too many crumbs"] },
      { question: "Coffee or tea?", answers: ["Coffee essential", "Tea please", "Both depending on mood", "Neither"] },
      { question: "Sweet or savory?", answers: ["Sweet tooth", "Savory lover", "Equal love for both"] },
      { question: "Meal planning?", answers: ["Plan the week", "Decide each day", "Wing it completely"] },
      { question: "Leftovers?", answers: ["Second-day meals", "Fresh every time"] },
      { question: "Grocery shopping together?", answers: ["Fun date activity", "Divide and conquer", "Online shopping"] },
      { question: "Kitchen collaboration?", answers: ["Cook together", "Stay out of my way", "One cooks, one assists"] },
      { question: "Diet preferences?", answers: ["Similar eating habits", "Respect differences"] },
      { question: "Midnight snacks?", answers: ["Raid the fridge", "No eating late", "Occasional treat"] },
      { question: "Food photos?", answers: ["Instagram first", "Eat while it's hot"] },
      { question: "Picky eater?", answers: ["I'll try anything", "Know what I like", "Selectively adventurous"] },
      { question: "Brunch or dinner dates?", answers: ["Brunch vibes", "Dinner & drinks", "All meals are good"] },
      { question: "Cooking shows?", answers: ["Watch & learn", "Just eat instead", "Background entertainment"] },
      { question: "Food delivery frequency?", answers: ["Treat ourselves often", "Save for special occasions", "Weekly ritual"] },
      { question: "Kitchen cleanliness?", answers: ["Clean as you go", "One big cleanup"] },
      { question: "Sharing food?", answers: ["What's mine is yours", "Order your own", "Depends on the dish"] },
    ],
  },
  {
    name: "dreams",
    emoji: "✨",
    questions: [
      { question: "How do you define success?", answers: ["Career & goals", "Happiness & peace", "Financial freedom", "Meaningful relationships"] },
      { question: "What are your financial values?", answers: ["Save for future", "Live for now", "Balance of both"] },
      { question: "Career ambition level?", answers: ["Climb the ladder", "Work-life balance", "Passion over profit"] },
      { question: "Dream home location?", answers: ["City life", "Suburbs", "Countryside", "Near the ocean"] },
      { question: "Retirement dreams?", answers: ["Travel the world", "Peaceful at home", "Stay active & working", "Community involvement"] },
      { question: "Side hustles?", answers: ["Always have projects", "One job is enough", "Creative hobbies only"] },
      { question: "Risk taking?", answers: ["Big risks, big rewards", "Safe and steady", "Calculated risks only"] },
      { question: "Dream lifestyle?", answers: ["Luxurious & abundant", "Simple & meaningful", "Adventurous & nomadic"] },
      { question: "Life timeline pressure?", answers: ["Have a plan", "Let it unfold"] },
      { question: "Learning & growth?", answers: ["Always learning", "Content where I am", "Specific interests only"] },
      { question: "Impact on the world?", answers: ["Make a difference", "Focus on close ones", "Both equally"] },
      { question: "Creative pursuits?", answers: ["Need creative outlet", "Other priorities", "Hobby level only"] },
      { question: "Work location preference?", answers: ["Work from anywhere", "Stable office job", "Hybrid flexibility"] },
      { question: "Starting a business?", answers: ["Dream of it", "Not for me", "Already planning"] },
      { question: "Five year plan?", answers: ["Clearly mapped out", "Open to possibilities", "General direction only"] },
      { question: "Wealth goals?", answers: ["Financial freedom", "Enough is enough", "Comfortable security"] },
      { question: "Legacy to leave?", answers: ["Impact & achievements", "Loved ones' memories", "Creative works"] },
      { question: "Dream collaboration?", answers: ["Build something together", "Support each other's dreams"] },
      { question: "Taking a leap of faith?", answers: ["When it feels right", "Need a solid plan", "Already jumped"] },
      { question: "Pursuing passion vs stability?", answers: ["Follow your heart", "Secure the bag", "Find a middle ground"] },
    ],
  },
  {
    name: "music",
    emoji: "🎵",
    questions: [
      { question: "Music taste?", answers: ["Very specific", "Listen to everything", "Mood dependent"] },
      { question: "Concerts or streaming?", answers: ["Live shows always", "Headphones at home", "Both equally"] },
      { question: "Singing in the car?", answers: ["Full performance", "Silent driver", "Hum along quietly"] },
      { question: "Shared playlists?", answers: ["Must collaborate", "Keep our own", "Blend favorites"] },
      { question: "Background music at home?", answers: ["Always playing", "Silence is golden", "Sometimes peaceful"] },
      { question: "Dancing at home?", answers: ["Kitchen dance parties", "Only at clubs", "Whenever the mood strikes"] },
      { question: "Music discovery?", answers: ["Always finding new", "Stick to classics", "Algorithm suggestions"] },
      { question: "Karaoke confidence?", answers: ["Born to perform", "Shy singer", "Needs liquid courage"] },
      { question: "Festival goer?", answers: ["Every summer", "Not my scene", "Occasional special ones"] },
      { question: "Playing instruments?", answers: ["Would love to learn", "Just listening", "Already play", "Tried and quit"] },
      { question: "Music while working?", answers: ["Essential focus", "Need silence", "Lo-fi beats only"] },
      { question: "Lyrics vs melody?", answers: ["Lyrics matter most", "All about the beat", "Both equally important"] },
      { question: "Morning music?", answers: ["Upbeat & energizing", "Slow & peaceful", "No music until coffee"] },
      { question: "Concert behavior?", answers: ["Front row energy", "Chill in the back", "Dancing wherever"] },
      { question: "Musical compatibility?", answers: ["Must like same artists", "Differences are fine", "Open to new music"] },
      { question: "Throwback songs?", answers: ["Nostalgic jams", "New releases only", "Mix of both eras"] },
      { question: "Workout music?", answers: ["Heavy beats", "Podcasts instead", "Whatever's on"] },
      { question: "Romantic songs?", answers: ["Love a love song", "Too cheesy", "Right mood matters"] },
      { question: "Music volume?", answers: ["Loud & proud", "Reasonable levels", "Depends on the song"] },
      { question: "Learning song lyrics?", answers: ["Know every word", "Make them up", "Key parts only"] },
    ],
  },
  {
    name: "random",
    emoji: "🎲",
    questions: [
      { question: "Morning or night person?", answers: ["Early bird", "Night owl", "Depends on the day"] },
      { question: "Pets?", answers: ["Dogs all the way", "Team cat", "Both equally", "No pets", "Exotic animals"] },
      { question: "Social media presence?", answers: ["Very active", "Minimal or none", "Lurker mode"] },
      { question: "Weather preference?", answers: ["Warm & sunny", "Cozy & rainy", "Crisp & cold", "Seasonal variety"] },
      { question: "Horoscopes?", answers: ["Check them daily", "Don't believe", "Fun but not serious"] },
      { question: "Superhero power?", answers: ["Fly anywhere", "Read minds", "Invisibility", "Time control", "Super strength"] },
      { question: "Time travel?", answers: ["Visit the past", "See the future", "Stay in present"] },
      { question: "Zombie apocalypse role?", answers: ["Leader", "Survivor", "Strategist", "First to go"] },
      { question: "Phone battery anxiety?", answers: ["Charge at 50%", "Live on the edge", "Always have backup"] },
      { question: "Bed making?", answers: ["Every morning", "Why bother", "When expecting guests"] },
      { question: "Closet organization?", answers: ["Color coded", "Organized chaos", "Category sorted", "Marie Kondo style"] },
      { question: "Reality TV?", answers: ["Guilty pleasure", "Can't stand it", "Specific shows only"] },
      { question: "Video games?", answers: ["Gamer at heart", "Not my thing", "Casual player", "Mobile games only"] },
      { question: "Reading preferences?", answers: ["Physical books", "E-reader", "Audiobooks", "All formats"] },
      { question: "Conspiracy theories?", answers: ["Fun to discuss", "Not interested", "Some are plausible"] },
      { question: "Aliens exist?", answers: ["Definitely yes", "Probably not", "Want to believe"] },
      { question: "Haunted house visit?", answers: ["Sign me up", "Hard pass"] },
      { question: "Clutter tolerance?", answers: ["Minimalist life", "Cozy clutter", "Hidden mess, clean surface"] },
      { question: "Surprises?", answers: ["Love them", "Prefer to know", "Good surprises only"] },
      { question: "How often do you need quality time?", answers: ["Daily connection", "Weekly is fine", "Natural flow"] },
    ],
  },
  {
    name: "adventure",
    emoji: "🏕️",
    questions: [
      { question: "Risk tolerance?", answers: ["Thrill seeker", "Play it safe", "Calculated risks"] },
      { question: "Outdoor activities?", answers: ["Love them", "Indoor person", "Seasonal outdoors"] },
      { question: "What's your ideal Sunday morning?", answers: ["Active & social", "Slow & cozy", "Productive solo", "Sleeping in"] },
      { question: "Spontaneous weekend trip?", answers: ["Let's go now", "Need to plan", "Quick planning OK"] },
      { question: "Trying extreme sports?", answers: ["Bucket list item", "Watch from afar", "Already tried several"] },
      { question: "Camping experience?", answers: ["Love roughing it", "Hotel please", "Glamping compromise"] },
      { question: "Swimming in the ocean?", answers: ["Dive right in", "Stay on shore", "Depends on conditions"] },
      { question: "Heights?", answers: ["Love the view", "Feet on ground", "Working on it"] },
      { question: "Hiking difficulty?", answers: ["Challenge me", "Easy trails", "Moderate with views"] },
      { question: "Winter sports?", answers: ["Hit the slopes", "Hot cocoa inside", "Tried but prefer warm"] },
      { question: "Water adventures?", answers: ["Surfing & diving", "Pool is fine", "Kayaking & paddleboarding"] },
      { question: "Exploring new cities?", answers: ["Get lost wandering", "Follow a guide", "Research then explore"] },
      { question: "Wildlife encounters?", answers: ["Exciting!", "Keep distance", "Safe observation preferred"] },
      { question: "Nighttime adventures?", answers: ["Stargazing & bonfires", "Early to bed", "City nightlife"] },
      { question: "Physical challenges?", answers: ["Push my limits", "Know my comfort zone", "Gradual progression"] },
      { question: "Adrenaline activities?", answers: ["Live for the rush", "Prefer calm", "Occasional thrill"] },
      { question: "Exploration style?", answers: ["Cover lots of ground", "Slow & thorough", "Hit the highlights"] },
      { question: "Weather conditions?", answers: ["Adventure in any weather", "Fair weather only", "Rain is fine, no extremes"] },
      { question: "Getting dirty outdoors?", answers: ["Part of the fun", "Stay clean", "Depends on the activity"] },
      { question: "Are you a planner or spontaneous?", answers: ["Spontaneous", "Planner", "Flexible mix"] },
    ],
  },
  {
    name: "lifestyle",
    emoji: "🏠",
    questions: [
      { question: "Do you prefer staying in or going out?", answers: ["Staying in", "Going out", "Balance of both"] },
      { question: "Weekend plans?", answers: ["Packed schedule", "Go with the flow", "One main activity"] },
      { question: "Fitness routine?", answers: ["Regular workouts", "Casual activity", "Gym enthusiast", "Sports & games"] },
      { question: "Sleep schedule?", answers: ["Early to bed, early to rise", "Night owl lifestyle", "Chaotic but functional"] },
      { question: "Home environment?", answers: ["Minimalist & clean", "Cozy & collected", "Functional chaos"] },
      { question: "Social battery?", answers: ["Extrovert energy", "Introvert recharge", "Ambivert balance"] },
      { question: "TV watching habits?", answers: ["Binge watcher", "Episode at a time", "Background noise only"] },
      { question: "Phone usage?", answers: ["Always connected", "Digital detox often", "Balanced approach"] },
      { question: "Friend group size?", answers: ["Many friends", "Small close circle", "Mix of both"] },
      { question: "Hosting gatherings?", answers: ["Love to host", "Prefer being guest", "Co-host with partner"] },
      { question: "Daily routine?", answers: ["Structured & planned", "Flexible & free", "Loose framework"] },
      { question: "Self-care practices?", answers: ["Regular rituals", "When needed", "Still learning"] },
      { question: "Shopping style?", answers: ["Love retail therapy", "Only necessities", "Online researcher"] },
      { question: "Cleanliness level?", answers: ["Spotless always", "Lived-in look", "Clean for guests"] },
      { question: "Noise preference at home?", answers: ["Music or TV on", "Peaceful quiet", "Natural sounds only"] },
      { question: "Weeknight activities?", answers: ["Out doing things", "Home relaxing", "Alternate evenings"] },
      { question: "Personal space needs?", answers: ["Together time", "Need alone time", "Varies by mood"] },
      { question: "Health consciousness?", answers: ["Very mindful", "Balance is key", "Working on it"] },
      { question: "News consumption?", answers: ["Stay informed", "Avoid the noise", "Curated sources only"] },
      { question: "Life pace?", answers: ["Fast & productive", "Slow & intentional", "Seasons of both"] },
    ],
  },
];

const compatibilityCategoryMap = new Map(compatibilityCategories.map((cat) => [cat.name, cat]));

// Get all category names with emojis
const categoryMap = new Map(categories.map((cat) => [cat.name, cat]));

icebreakersRouter.get("/random", (c) => {
  const categoryParam = c.req.query("category")?.toLowerCase();

  let selectedCategory: Category;

  if (categoryParam && categoryMap.has(categoryParam)) {
    // Use the specified category
    selectedCategory = categoryMap.get(categoryParam)!;
  } else {
    // Pick a random category
    selectedCategory = categories[Math.floor(Math.random() * categories.length)]!;
  }

  // Pick a random question from the selected category
  const question =
    selectedCategory.questions[
      Math.floor(Math.random() * selectedCategory.questions.length)
    ]!;

  return c.json({
    data: {
      question,
      category: selectedCategory.name,
      emoji: selectedCategory.emoji,
    },
  });
});

// Endpoint to get all categories
icebreakersRouter.get("/categories", (c) => {
  return c.json({
    data: categories.map((cat) => ({
      name: cat.name,
      emoji: cat.emoji,
      count: cat.questions.length,
    })),
  });
});

// Endpoint to get compatibility questions for a category
icebreakersRouter.get("/compatibility", (c) => {
  const categoryParam = c.req.query("category")?.toLowerCase();

  let selectedCategory: CompatibilityCategory;

  if (categoryParam && compatibilityCategoryMap.has(categoryParam)) {
    // Use the specified category
    selectedCategory = compatibilityCategoryMap.get(categoryParam)!;
  } else {
    // Pick a random category
    selectedCategory = compatibilityCategories[Math.floor(Math.random() * compatibilityCategories.length)]!;
  }

  // Shuffle the questions
  const shuffledQuestions = [...selectedCategory.questions].sort(() => Math.random() - 0.5);

  return c.json({
    data: {
      category: selectedCategory.name,
      emoji: selectedCategory.emoji,
      questions: shuffledQuestions.map((q) => ({
        question: q.question,
        answers: q.answers,
        category: selectedCategory.name,
        emoji: selectedCategory.emoji,
      })),
    },
  });
});

export { icebreakersRouter };
