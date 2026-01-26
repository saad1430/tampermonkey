// ==UserScript==
// @name         Bing Random Search Automation
// @namespace    http://tampermonkey.net/
// @version      1.5.1
// @description  Automates Bing searches with human-like delays. Keybinds + notifications + clean Bing-styled status badge included.
// @icon         https://raw.githubusercontent.com/saad1430/tampermonkey/refs/heads/main/icons/bing-automation-100.png
// @author       Saad1430
// @match        https://www.bing.com/*
// @grant        none
// ==/UserScript==

(function () {
  'use strict';

  const words = [
    // --- Phrases (50) ---
    //"how to make homemade pizza", "best tourist places in europe", "upcoming movies 2025", "meditation techniques for stress", "why is the sky blue", "new technology trends 2025", "easiest coding languages to learn", "photography tips for beginners", "football world cup highlights", "healthy breakfast recipes", "top 10 netflix shows right now", "meaning of life quotes", "how volcanoes are formed", "interesting history facts", "best laptops for students 2025", "current weather in new york", "python vs javascript differences", "cheapest flights to london", "top universities in the world", "how to plant tomatoes", "best smartphones under 500", "how to play guitar chords", "best free coding resources", "latest news headlines today", "benefits of daily exercise", "popular anime series 2025", "best books to read this year", "how to improve memory power", "quick dinner ideas easy", "how to learn french fast", "top travel destinations 2025", "best budget gaming laptops", "most expensive ever sold", "how to meditate properly", "famous historical events", "best sci fi movies 2025", "tips for better sleep", "upcoming sports events", "how to bake chocolate cake", "simple workout routines at home", "reasons why cats are popular", "fastest cars in the world", "best coffee shops near me", "how to reduce screen time", "fun facts about space", "best productivity apps 2025", "how to tie a tie", "famous landmarks in paris", "difference between ai and ml", "what is quantum computing",
    // --- Phrases (50) ---
    //"best hiking trails in usa", "cheap recipes for students", "how to build a website", "benefits of drinking green tea", "fastest trains in the world", "how to create a podcast", "top 10 android apps 2025", "who won the last champions league", "famous quotes abou friendship", "easy yoga poses for beginners", "how to invest in stocks", "most popular tourist attractions", "how to lose weight naturally", "best movies released this year", "why do we dream at night", "new iphone release date", "what is the metaverse explained", "fun science experiments at home", "how to save money quickly", "best programming languages 2025", "places to visit in japan", "how to cook pasta perfectly", "top rated horror movies 2025", "how to stay motivated", "best free photo editing software", "who invented the internet", "easy breakfast smoothie recipes", "what is blockchain technology", "best action games for pc", "how to train your dog", "top rated restaurants near me", "how to write a good resume", "latest cricket match highlights", "best online learning platforms", "simple hacks for productivity", "how to clean a laptop keyboard", "famous inventions in history", "how to take better selfies", "best sci fi books ever", "top 10 richest people in the world", "easy ways to learn spanish", "benefits of drinking coffee", "who painted the mona lisa", "fastest growing cities in 2025", "best strategies for chess", "how to make money online", "upcoming concerts near me", "famous landmarks in italy", "how to start a youtube channel", "difference between cloud and edge computing",
    // TV / Movies (25)
    //"what happened in episode 5 of the latest season of a popular tv show", "how many seasons does that tv series have", "best plot twists in movies of the last decade", "who directed the most popular films in 2024", "what are the top rated tv dramas right now", "how to understand ambiguous movie endings", "which actors won awards this year for tv roles", "how to find movie release dates by country", "what are the must watch indie films this year", "which streaming service has exclusive tv series x", "how to binge watch a long tv series efficiently", "what is the recommended viewing order for this franchise", "how to find behind the scenes for my favorite movie", "best documentary films about history", "how are tv show ratings calculated", "which movie adaptations are faithful to the book", "how to follow a tv show's production updates", "what are the best limited series of all time", "how to find episode summaries for old tv shows", "where to watch classic movies legally online", "what are the highest grossing films by genre", "how to identify cameos in movies", "what questions to ask during a film festival Q&A", "how to research actor filmographies quickly", "what are the most rewatchable tv shows",
    // Video Games (25)
    //"best role playing games to play in 2025", "how to beat the final boss in a tough rpg", "what are the top indie games this year", "how to fix controller drift on xbox and playstation", "best strategies for winning battle royale matches", "how to get started with speedrunning a game", "what hardware is needed for pc gaming on a budget", "how to set up a streaming overlay for gameplay", "best co op games to play with friends", "how to improve aim in first person shooters", "where to find game walkthroughs and guides", "how to mod a single player game safely", "what are the most anticipated game releases", "how to optimize game settings for performance", "best retro games to play for nostalgia", "how to trade items safely in online games", "what esports tournaments are happening this year", "how to build a gaming pc step by step", "best controllers for pc and console gaming", "how to record high quality gameplay on a laptop", "top puzzle games to train your brain", "how to troubleshoot common connection issues in online games", "what are good beginner friendly strategy games", "how to manage game library storage on consoles", "which games have the best open world exploration",
    // Football & Cricket (25)
    //"how to improve shooting accuracy in football", "best training drills for midfielders", "what is the schedule for upcoming international football matches", "how to choose the right football boots for wet pitches", "who are the leading goal scorers in the current season", "how to read football analytics and heatmaps", "what are the rules for offside in simple terms", "how to practice free kicks effectively", "top tactics used by successful football managers", "what equipment is essential for starting a local football club", "how to play cricket as a beginner", "what are common batting techniques in cricket", "how to bowl yorkers consistently in limited overs", "what is the cricket world cup qualification process", "how to maintain a cricket pitch at home", "best drills to improve fielding agility", "how to understand dls calculations in rain-affected matches", "who are rising stars in international cricket", "what is the difference between t20 and test cricket strategies", "how to choose cricket gear for juniors", "top clubs to watch in european football right now", "how to follow live football stats and commentary", "what nutrition helps football players recover faster", "how to handle pressure situations in penalty shootouts", "what are the safest ways to train during off season",
    // Camping in the Wild (25)
    //"best lightweight tents for backpacking", "what to pack for a three day wild camping trip", "how to build a safe campfire in the wilderness", "tips for camping solo safely at night", "how to choose a campsite away from hazards", "what are essential first aid items for camping", "how to find potable water while camping", "best sleeping pads for cold weather camping", "how to navigate with a map and compass", "what food packs well for multi day hikes", "how to store food safely to avoid wildlife encounters", "best lightweight stoves for backpackers", "how to set up a campsite in rainy conditions", "what clothing layers are needed for alpine camping", "how to treat minor injuries when far from help", "best practices for Leave No Trace camping", "how to identify local poisonous plants while camping", "what are the pros and cons of hammock camping", "how to plan a safe solo overnight hike route", "what gadgets are worth carrying for wilderness camping", "how to keep warm without a tent in an emergency", "best ways to signal for help in the wild", "how to prevent blisters on long hikes", "what permits are typically needed for backcountry camping", "how to choose a reliable headlamp for overnight trips",
    // --- Extra phrases (100) ---
    //"how to plan a cross country road trip", "best apps to track personal finance", "how to grow herbs indoors year round", "easy one pot meals for weeknights", "how to start learning piano as an adult", "tips for reducing household energy use", "how to write a short story in a week", "best practices for remote team communication", "how to set SMART goals and stick to them", "simple portrait photography tips", "how to host a successful podcast episode", "ways to improve indoor air quality", "how to prepare for a technical interview", "beginner guide to containerization with docker", "how to read financial statements for beginners", "tips for creating a minimalist wardrobe", "how to do a basic home electrical repair safely", "ways to practice mindful eating", "how to make sourdough starter from scratch", "best browser extensions for productivity", "how to organize photos on your computer", "easy watercolor painting techniques", "how to backup your phone and cloud data", "tips for long distance relationships", "how to design a small urban garden", "best study techniques backed by science", "how to negotiate a salary increase", "ways to learn a new language fast", "how to build a simple mobile app", "top security tips for home wifi networks", "how to compost kitchen scraps at home", "tips for staying focused while working from home", "how to choose the right running shoes", "easy knitting patterns for beginners", "how to declutter your email inbox", "tips for preparing quick healthy lunches", "how to research family history online", "best tools for creating wireframes", "how to make cold brew coffee at home", "ways to reduce single use plastics", "how to perform basic bicycle maintenance", "strategies for better time blocking", "how to cultivate a reading habit", "tips for improving public speaking skills", "how to set up two factor authentication", "best compact cameras for travel", "how to build simple electronics projects", "ways to support local small businesses", "how to prepare for a marathon training plan", "tips for photographing the night sky", "how to build an emergency savings fund", "creative gift ideas for friends", "how to choose a good domain name", "tips for managing inbox zero", "how to create a basic API with nodejs", "ways to grow plants from cuttings", "how to turn a hobby into a side business", "tips for cutting monthly subscription costs",
    //"how to map out a personal development plan", "easy meal prep ideas for families", "how to improve handwriting quickly", "best online courses for data science beginners", "how to build confidence before interviews", "ways to make your resume stand out", "how to take care of indoor succulents", "tips for creating engaging social media content", "how to plan a zero waste picnic", "best practices for securing web applications", "how to use git like a pro", "easy vegetarian recipes for weeknights", "how to choose a mattress for back pain", "tips for learning calculus effectively", "how to audit your personal finances", "best habits for better mental health", "how to build a basic wordpress site", "ways to improve workplace ergonomics", "how to prepare a beginner woodworking project", "tips for saving for your first home", "how to plan a culturally rich vacation", "ways to create a capsule wardrobe", "how to clean and maintain your camera lens", "tips for building an online portfolio", "how to brew kombucha at home safely", "ways to practice coding every day", "how to create a monthly budget spreadsheet", "best stretches for desk workers", "how to choose the right insurance coverage", "tips for better sleep hygiene", "how to teach kids to cook safely", "ways to improve concentration during study", "how to build a simple chatbot with javascript", "tips for sustainable gift wrapping", "how to identify reliable news sources", "ways to reduce food waste at home", "how to maintain a bike chain and gears", "tips for staying hydrated throughout the day", "how to choose a reliable used car", "ways to create a calming bedtime routine", "how to start a vertical herb garden", "tips for photographing portraits with natural light", "how to memorize speeches effectively", "ways to set up a basic home lab for learning", "how to run effective one on one meetings", "tips for decorating small apartments", "how to pick the perfect houseplant for beginners"
  ];

  // --- Extra phrases (Grok Generated - 08-12-25) --- COMMENTED OUT
  // words.push(
  //   "how to organize a garage sale effectively", "best virtual reality headsets for beginners", "what causes seasonal allergies and remedies", "tips for starting a vegetable garden in spring", "how to repair a leaky faucet at home", "top rated noise cancelling headphones 2025", "how to create digital art with free tools", "benefits of practicing tai chi daily", "how to select fresh seafood at the market", "famous myths and legends from ancient greece", "how to troubleshoot common printer issues", "best electric cars for long distance travel", "what is sustainable fashion and why it matters", "easy crafts for kids using recycled materials", "how to improve your credit score quickly", "top destinations for winter skiing holidays", "how to make vegan desserts without eggs", "best wireless earbuds for workouts", "what are the health benefits of yoga", "how to set up a home recording studio", "famous explorers and their discoveries", "tips for packing light for international trips", "how to brew beer at home for beginners", "best smart home devices for security", "what is cryptocurrency mining explained", "how to draw realistic portraits step by step", "top beaches for family vacations in asia", "how to fix common smartphone battery problems", "benefits of intermittent fasting for weight loss", "how to start a blog and monetize it", "famous composers from the classical era", "tips for choosing the right pet for your family", "how to make natural cleaning products", "best fitness trackers for monitoring health", "what is the history of the olympic games", "how to learn sign language basics", "top national parks in north america", "how to upgrade your computer's ram", "benefits of reading fiction books regularly", "how to prepare for a job interview online", "famous artists and their painting styles", "tips for maintaining houseplants in low light", "how to cook authentic mexican tacos", "best drones for aerial photography", "what is virtual reality therapy used for", "how to build a treehouse for kids", "top cities for street food around the world", "how to reset forgotten passwords securely", "benefits of walking barefoot on grass", "how to create a family budget plan", "famous battles in world war ii", "tips for improving handwriting for adults", "how to make soap at home naturally", "best tablets for reading ebooks", "what is the science behind rainbows",
  //   "how to train for a 5k run as a beginner", "top islands for honeymoon getaways", "how to install solar panels on your roof", "benefits of using essential oils daily", "how to write poetry for beginners", "famous inventions by women in history", "tips for dealing with procrastination", "how to bake gluten free bread", "best smartwatches for android users", "what is dark matter in the universe", "how to start freelancing on graphic design", "top museums for modern art in europe", "how to fix a flat bicycle tire", "benefits of journaling for mental health", "how to plan a surprise birthday party", "famous quotes from shakespeare plays", "tips for safe online shopping practices", "how to grow mushrooms at home", "best cameras for vlogging beginners", "what are black holes and how they form", "how to learn chess openings effectively", "top adventure sports destinations worldwide", "how to troubleshoot wifi connection problems", "benefits of eating organic fruits and veggies", "how to create a vision board for goals", "famous philosophers and their ideas", "tips for organizing digital files efficiently", "how to make fermented foods like kimchi", "best monitors for graphic designers", "what is the role of bees in ecosystems", "how to prepare for natural disasters", "top cultural festivals around the globe", "how to replace a car battery safely", "benefits of practicing gratitude daily", "how to design logos using free software", "famous novels adapted into tv series", "tips for better time management at work", "how to cook indian curry from scratch", "best routers for home internet speed", "what is climate change impact on oceans", "how to start a book club with friends", "top wildlife safaris in africa", "how to clean jewelry at home", "benefits of strength training for women", "how to build a raised garden bed", "famous scientists who changed the world", "tips for reducing stress at work", "how to make candles at home easily", "best speakers for home theater setup", "what is the history of chocolate", "how to learn ballroom dancing steps", "top romantic getaways in europe", "how to secure your email account", "benefits of cold showers for health", "how to create a workout playlist", "famous landmarks in south america", "tips for eco friendly living habits", "how to grill perfect steaks outdoors",
  //   "best laptops for video editing 2025", "what is the origin of halloween", "how to meditate for focus and clarity", "top ski resorts in the alps", "how to change a car's oil filter", "benefits of herbal teas for sleep", "how to write a business plan template", "famous musicians from the jazz era", "tips for packing for a cruise vacation", "how to make yogurt at home", "best headphones for music production", "what are solar eclipses and safety tips", "how to improve public speaking confidence", "top vineyards for wine tasting tours", "how to backup computer files securely", "benefits of cycling for cardiovascular health", "how to plan a backyard wedding", "famous poems about nature and life", "tips for choosing sustainable clothing", "how to prepare sushi rolls at home", "best projectors for home movies", "what is the life cycle of stars", "how to start investing in real estate", "top hot springs destinations worldwide", "how to fix common plumbing issues", "benefits of aromatherapy for relaxation", "how to create custom greeting cards", "famous historical figures in asia", "tips for better email communication", "how to grow orchids indoors successfully", "best fitness apps for home workouts", "what is the theory of evolution simplified", "how to learn photography composition rules", "top desert safari experiences in dubai", "how to install antivirus software properly", "benefits of laughter yoga sessions", "how to organize a charity fundraiser", "famous bridges around the world", "tips for healthy snacking options", "how to make pasta sauce from tomatoes", "best smart thermostats for energy savings", "what are comets and meteor showers", "how to train a cat to use litter box", "top ancient ruins to visit in mexico", "how to troubleshoot laptop overheating", "benefits of deep breathing exercises", "how to build a birdhouse diy project", "famous inventions from the renaissance", "tips for virtual meeting etiquette", "how to cook thai stir fry dishes", "best external hard drives for storage", "what is the human genome project", "how to start a meditation journal", "top coral reefs for snorkeling", "how to replace screen on a phone", "benefits of probiotics for gut health", "how to plan a group hiking trip", "famous quotes on success and failure", "tips for reducing plastic in kitchens",
  //   "how to bake sourdough pizza dough", "best webcams for video calls", "what is string theory in physics", "how to learn basic sewing skills", "top flower festivals in the netherlands", "how to optimize smartphone storage", "benefits of forest bathing therapy", "how to create a home office setup", "famous volcanoes and their eruptions", "tips for mindful parenting techniques", "how to make herbal infusions", "best action cameras for adventures", "what are galaxies and their types", "how to improve running endurance", "top eco lodges for sustainable travel", "how to clean a microwave effectively", "benefits of omega 3 fatty acids", "how to write effective cover letters", "famous operas and their composers", "tips for budget travel in europe", "how to grow strawberries in pots", "best power banks for charging devices", "what is the big bang theory explained", "how to start a vegetable juicing routine", "top canyons for hiking in usa", "how to fix blurry photos in editing", "benefits of acupuncture for pain relief", "how to organize closet space efficiently", "famous rivers and their significance", "tips for learning guitar scales", "how to make fruit jams at home", "best vr games for fitness", "what is relativity theory by einstein", "how to prepare for college entrance exams", "top aurora viewing spots in scandinavia", "how to secure home network from hackers", "benefits of vitamin d supplements", "how to build a compost bin diy", "famous deserts around the world", "tips for effective note taking methods", "how to cook middle eastern falafel", "best bluetooth speakers for outdoors", "what are supernovas and their effects", "how to learn digital marketing basics", "top mountain biking trails in colorado", "how to troubleshoot tv remote issues", "benefits of mindfulness apps for beginners", "how to plan a themed dinner party", "famous islands in the pacific ocean", "tips for improving sleep quality naturally", "how to make cheese at home simply", "best fitness bikes for commuting", "what is the water cycle process", "how to start a podcast on spotify", "top whale watching tours in alaska", "how to clean grout in bathroom tiles", "benefits of turmeric for inflammation", "how to create a linkedin profile", "famous mountains for climbing expeditions", "tips for healthy hair care routines",
  //   "how to bake vegan cookies easily", "best gaming mice for precision", "what are asteroids and their orbits", "how to improve vocabulary daily", "top lavender fields in provence france", "how to install home security cameras", "benefits of green smoothies for detox", "how to organize a community cleanup", "famous lakes for boating activities", "tips for starting a fitness challenge", "how to make natural face masks", "best e readers for book lovers", "what is plate tectonics theory", "how to learn basic html coding", "top cherry blossom spots in japan", "how to fix squeaky door hinges", "benefits of pilates for core strength", "how to plan a solo travel adventure", "famous waterfalls in south america", "tips for better posture at desk", "how to cook greek souvlaki skewers", "best portable chargers for travel", "what is photosynthesis in plants", "how to start investing in etfs", "top tulip farms in the netherlands", "how to troubleshoot earbud sound issues", "benefits of chia seeds in diet", "how to build a sandcastle like pro", "famous canyons in the grand canyon area", "tips for creative writing prompts", "how to make iced tea variations", "best mechanical keyboards for typing", "what are pulsars in astronomy", "how to prepare for a hiking marathon", "top autumn foliage spots in new england", "how to clean silverware naturally", "benefits of meditation apps for anxiety", "how to create a personal website"
  // );

  // --- NEW 200 Unique Phrases (26 Jan 2026) ---
  words.push(
    // Technology & Innovation (20)
    "how quantum computers solve complex problems", "what is machine learning in simple terms", "best programming languages for beginners in 2026", "how blockchain technology works explained", "what are neural networks and how they learn", "how to protect your privacy online effectively", "best cybersecurity practices for small businesses", "what is cloud computing and its benefits", "how artificial intelligence impacts daily life", "best free coding bootcamps online", "how to build your first mobile app", "what is the internet of things iot", "how to start a career in data science", "best tools for remote team collaboration", "what is augmented reality and applications", "how to learn python programming fast", "best practices for software development", "what is devops and why it matters", "how to secure your home network", "best resources for learning web development",
    
    // Science & Nature (20)
    "how do plants convert sunlight into energy", "what causes earthquakes and how they form", "how do birds navigate during migration", "what is the greenhouse effect explained", "how do vaccines work in the human body", "what are black holes and their properties", "how do bees make honey step by step", "what causes the northern lights phenomenon", "how do animals adapt to their environments", "what is dna and how it stores information", "how do ocean currents affect climate", "what are the different types of clouds", "how do trees produce oxygen we breathe", "what is evolution and natural selection", "how do stars form in the universe", "what causes volcanic eruptions", "how do fish breathe underwater", "what is the water cycle process", "how do seasons change on earth", "what are the layers of the atmosphere",
    
    // Health & Wellness (20)
    "how to improve sleep quality naturally", "what are the benefits of regular exercise", "how to manage stress effectively daily", "what is meditation and how to start", "how to build healthy eating habits", "what are superfoods and their benefits", "how to boost your immune system", "what is mindfulness and techniques", "how to maintain good posture at work", "what are the signs of dehydration", "how to start a fitness routine safely", "what is intermittent fasting benefits", "how to reduce inflammation naturally", "what are probiotics and gut health", "how to improve mental health daily", "what is yoga and beginner poses", "how to stay hydrated throughout day", "what are antioxidants and sources", "how to prevent back pain at desk", "what is healthy weight management",
    
    // Travel & Culture (20)
    "best hidden gems to visit in europe", "how to travel on a budget effectively", "what to pack for a tropical vacation", "how to learn a new language quickly", "best cultural festivals around the world", "how to plan a solo travel adventure", "what are must see landmarks in asia", "how to experience local culture abroad", "best travel destinations for 2026", "how to stay safe while traveling", "what are the best travel apps", "how to find cheap flight deals", "best ways to document your travels", "what to know before visiting japan", "how to overcome travel anxiety", "best street food cities worldwide", "how to pack light for long trips", "what are travel insurance essentials", "how to make friends while traveling", "best photography tips for travelers",
    
    // Food & Cooking (20)
    "how to cook perfect pasta every time", "what are essential kitchen tools for beginners", "how to make homemade bread from scratch", "best healthy meal prep ideas", "how to grill the perfect steak", "what are cooking techniques every chef knows", "how to make authentic italian pizza", "best vegetarian recipes for beginners", "how to bake chocolate chip cookies", "what are spices and how to use them", "how to make fresh pasta at home", "best quick dinner recipes for weeknights", "how to cook rice perfectly every time", "what are fermentation basics for food", "how to make homemade ice cream", "best breakfast recipes to start day", "how to cook vegetables properly", "what are knife skills for cooking", "how to make soup from scratch", "best dessert recipes for parties",
    
    // Arts & Creativity (20)
    "how to start learning digital art", "what are basic drawing techniques", "how to write a compelling story", "best photography composition rules", "how to learn guitar for beginners", "what are color theory basics", "how to create a painting step by step", "best ways to find creative inspiration", "how to improve your handwriting", "what are different art styles explained", "how to start a creative journal", "best free design software tools", "how to learn calligraphy basics", "what are photography lighting techniques", "how to write poetry for beginners", "best music production software free", "how to create digital illustrations", "what are typography design principles", "how to make handmade greeting cards", "best art supplies for beginners",
    
    // History & Education (20)
    "what caused world war one", "how did ancient civilizations build pyramids", "what was the renaissance period", "how did the industrial revolution change society", "what are the major world religions", "how did the printing press change history", "what was life like in medieval times", "how did explorers discover new lands", "what are ancient greek contributions", "how did the roman empire fall", "what was the cold war about", "how did women gain voting rights", "what are the seven wonders of world", "how did the internet get invented", "what was the space race", "how did the great depression start", "what are famous historical speeches", "how did ancient egyptians build structures", "what was the age of exploration", "how did democracy develop over time",
    
    // Business & Finance (20)
    "how to start a small business", "what is investing in stocks basics", "how to create a business plan", "what are cryptocurrency basics explained", "how to save money effectively", "what is passive income and ideas", "how to build credit score fast", "what are retirement planning strategies", "how to negotiate salary successfully", "what is budgeting and how to start", "how to start investing with little money", "what are tax deductions for individuals", "how to build an emergency fund", "what is compound interest explained", "how to start freelancing online", "what are real estate investment basics", "how to manage personal finances", "what are side hustle ideas for 2026", "how to pay off debt efficiently", "what is financial independence retire early",
    
    // Home & Lifestyle (20)
    "how to organize a small apartment", "what are minimalist living principles", "how to decorate on a budget", "best home organization tips", "how to create a cozy living space", "what are essential home maintenance tasks", "how to start a vegetable garden", "best indoor plants for beginners", "how to declutter your home effectively", "what are smart home devices worth buying", "how to make your home more energy efficient", "best cleaning hacks for busy people", "how to create a home office space", "what are feng shui basics for home", "how to improve indoor air quality", "best storage solutions for small spaces", "how to choose paint colors for rooms", "what are essential tools for homeowners", "how to create a reading nook", "best ways to make home feel welcoming",
    
    // Sports & Fitness (20)
    "how to train for your first marathon", "what are the rules of basketball", "how to improve running endurance", "best exercises for building strength", "how to start weightlifting safely", "what are the benefits of swimming", "how to train for a triathlon", "best stretches for flexibility", "how to improve basketball shooting", "what are soccer tactics and strategies", "how to build muscle at home", "best cardio workouts for weight loss", "how to prevent sports injuries", "what are olympic sports explained", "how to train for rock climbing", "best nutrition for athletes", "how to improve tennis serve", "what are martial arts for beginners", "how to start cycling for fitness", "best recovery methods after workouts"
  );

  // --- Extra phrases (Qwen Generated - 08-12-25) --- COMMENTED OUT
  // words.push(
  //   // 🌍 Global & Cultural (25)
  //   "traditional tea ceremonies in japan and their meaning", "how indigenous communities manage land sustainably", "what is ubuntu philosophy and how is it applied", "best ways to respectfully visit sacred sites abroad", "origins of diwali and regional celebration differences", "how to learn sign language basics for travel", "what are geisha roles in modern kyoto", "cultural etiquette tips for visiting temples in southeast asia", "history behind day of the dead in mexico", "how to identify authentic vs mass produced handicrafts", "meaning of henna patterns in different cultures", "traditional music instruments unique to west africa", "what is fika and why it matters in swedish culture", "how to participate in a japanese onsen correctly", "significance of uluru to aboriginal australians", "common gestures to avoid in middle eastern countries", "how to respectfully photograph people in rural communities", "origins of capoeira and its cultural resistance roots", "meaning behind maori tattoos and protocols", "what is hygge and how danes practice it year round", "how to prepare for ramadan as a non muslim visitor", "traditional fermented foods from the caucasus region", "history of berber carpets and symbolism in designs", "how to support fair trade artisans ethically", "what is joik and its place in sami identity",
  //   // 🔬 Science & Nature Deep Dives (25)
  //   "how tardigrades survive extreme space conditions", "what causes bioluminescent waves at night", "how do trees communicate through underground networks", "why some animals can regenerate limbs but humans cant", "how deep sea creatures adapt to zero light environments", "what is the role of fungi in forest ecosystems", "how monarch butterflies navigate thousands of miles", "why do octopuses have three hearts and blue blood", "how coral reefs recover after bleaching events", "what are extremophiles and where do they live", "how do bees perceive color differently than humans", "why do leaves change color in autumn scientifically", "how do migratory birds sense earths magnetic field", "what causes ball lightning and is it real", "how scientists track microplastics in ocean currents", "why some frogs freeze solid in winter and revive", "how do deep ocean vents support life without sunlight", "what is the biological purpose of yawning", "how do chameleons change color at cellular level", "why do some plants bloom only once in decades", "how do bats use echolocation in noisy environments", "what is the science behind aurora borealis colors", "how do ants farm fungi in underground colonies", "why do sloths move so slowly from an energy perspective", "how do scientists date ancient ice cores",
  //   // 🧠 Mental Wellness & Neurodiversity (25)
  //   "how to create a sensory friendly workspace at home", "what is rejection sensitive dysphoria and how to cope", "ways to support autistic adults in social settings", "how grounding techniques differ for anxiety vs panic attacks", "what is interoceptive awareness and why it matters", "how to set boundaries without guilt in relationships", "best non verbal communication tools for non speaking individuals", "how to recognize emotional burnout before it peaks", "what is polyvagal theory and practical applications", "ways to build distress tolerance for chronic illness", "how to practice self compassion after failure", "what is neuroaffirming language and examples", "how to design a calming corner for emotional regulation", "ways to reduce decision fatigue in daily life", "what is somatic experiencing and who benefits", "how to identify toxic positivity in conversations", "best journaling prompts for identity exploration", "how to support someone with misophonia daily", "what is executive dysfunction and actionable strategies", "ways to co regulate emotions with children", "how to create a personal emotional first aid kit", "what is inner child work and how to start", "how to navigate grief anniversaries mindfully", "ways to reduce shame spirals using cognitive tools", "what is radical acceptance in dbt and real life use",
  //   // 🛠️ Niche DIY & Maker Projects (25)
  //   "how to build a passive solar dehydrator from scrap wood", "diy natural dye techniques using kitchen waste", "how to make reusable beeswax food wraps step by step", "build a rainwater catchment system for balcony gardening", "how to upcycle old sweaters into warm mittens", "diy clay soil moisture sensor with arduino nano", "how to create a vertical pallet herb wall indoors", "build a silent mechanical keyboard from kits", "how to make non toxic wood polish with citrus peels", "diy solar phone charger using recycled panels", "how to repurpose wine corks into bulletin boards", "build a compact compost tumbler from plastic drums", "how to craft leather journal covers without stitching", "diy acoustic panels using fabric and insulation", "how to make seed paper embedded with wildflowers", "build a foldable camping stool from bamboo", "how to turn old maps into waterproof book covers", "diy magnetic knife strip from reclaimed wood", "how to create a cork yoga block at home", "build a minimalist floating shelf with hidden brackets", "how to make herbal infused vinegar cleaners", "diy plant propagation station from glass jars", "how to craft a macrame plant hanger with recycled yarn", "build a small batch sourdough starter jar holder", "how to turn vintage tins into travel sewing kits",
  //   // 💻 Emerging Tech & Digital Ethics (25)
  //   "how decentralized identity works without big tech", "what is differential privacy and how apple uses it", "how to audit an ai models bias before deployment", "what are zk proofs and their role in web3 privacy", "how to detect deepfake audio in voice messages", "what is federated learning and real world use cases", "how digital twins simulate cities for climate planning", "what are algorithmic impact assessments and who does them", "how to verify provenance of digital art on blockchain", "what is homomorphic encryption and its limitations", "how satellite internet constellations affect astronomy", "what are ethical guidelines for generative ai in journalism", "how to check if your data is in a training dataset", "what is edge ai and why it matters for rural areas", "how open source models differ in transparency from closed ones", "what are data cooperatives and how they empower users", "how to opt out of ai training in major platforms", "what is neuromorphic computing and current prototypes", "how ai is used in detecting illegal fishing from space", "what are model cards and why developers should publish them", "how to interpret ai confidence scores responsibly", "what is synthetic data and when it replaces real data", "how digital detox apps respect privacy while helping", "what are right to repair laws and global status", "how to identify greenwashing in tech sustainability reports",
  //   // 🌱 Regenerative Living & Sustainability (25)
  //   "how to create a food forest in a suburban backyard", "what is mycoremediation and how mushrooms clean soil", "how to build a hugelkultur bed for water retention", "ways to reduce textile waste by mending creatively", "how to start a community seed library legally", "what is regenerative grazing and how it reverses desertification", "how to compost human waste safely with composting toilets", "ways to convert lawns into native pollinator habitats", "how to make natural pest repellent with companion planting", "what is circular fashion and how to participate", "how to calculate your personal water footprint accurately", "ways to retrofit old homes for passive cooling", "how to support indigenous led conservation efforts", "what is solarpunk and its practical design principles", "how to organize a repair cafe in your neighborhood", "ways to reduce pharmaceutical waste in households", "how to start a neighborhood tool lending library", "what is biomimicry in architecture and real examples", "how to make natural dyes last longer on fabrics", "ways to advocate for plastic free aisles in supermarkets", "how to assess greenwashing in eco product labels", "what is doughnut economics and city applications", "how to create a zero waste wedding without compromise", "ways to reduce emissions from digital activities", "how to support carbon insetting vs offsetting projects",
  //   // 📚 Learning & Unschooling Approaches (25)
  //   "how unschooling families document learning for legality", "what is strewing and how to do it effectively", "ways to nurture curiosity in teens without curriculum", "how to use video games as historical learning tools", "what is interest led learning and long term outcomes", "how to facilitate nature journaling for all ages", "ways to integrate math into daily life unconsciously", "how to create a learning rich environment at home", "what is deschooling and how long it typically takes", "how to support neurodivergent learners in self direction", "ways to use libraries as hubs for project based learning", "how to evaluate open educational resources critically", "what is connected learning and examples in practice", "how to mentor youth in passion projects without directing", "ways to foster critical media literacy from childhood", "how to use podcasts as springboards for deep inquiry", "what is place based education and community benefits", "how to design personal learning dashboards for teens", "ways to support multilingual development at home", "how to turn travel into immersive learning experiences", "what is slow education and its contrast to standardized testing", "how to use citizen science projects for real contribution", "ways to assess learning without grades or tests", "how to create intergenerational learning circles", "what is autodidactism and tools for lifelong self education",
  //   // 🎨 Creative Expression & Art Therapy (25)
  //   "how to use zentangle for anxiety reduction", "what is intuitive painting and how to begin without fear", "ways to create art with natural materials sustainably", "how to journal with collage for emotional processing", "what is bibliotherapy and how to apply it personally", "how to use clay work for somatic trauma release", "ways to explore identity through self portrait variations", "how to create a visual mood board for life transitions", "what is process art and why outcome doesnt matter", "how to use sound baths as creative inspiration", "ways to integrate movement and mark making", "how to make altered books for personal storytelling", "what is eco printing and how to do it at home", "how to use photography as mindfulness practice", "ways to create art with voice recordings and transcripts", "how to build a personal symbolism dictionary", "what is embodied drawing and guided exercises", "how to use poetry prompts for grief expression", "ways to make collaborative art with strangers online", "how to create a tactile memory box for nostalgia", "what is art journaling and starter prompts", "how to use color psychology in daily creative choices", "ways to turn field notes into mixed media pieces", "how to practice daily sketch noting for retention", "what is asemic writing and how to experiment",
  //   // 🥾 Adventure & Micro-Outdoors (25)
  //   "how to plan a safe urban foraging walk in your city", "what to pack for a spontaneous overnight bikepacking trip", "ways to practice forest bathing without forests nearby", "how to identify bird calls using free apps accurately", "what is geocaching and beginner tips for families", "how to build a tiny floating raft for calm waters", "ways to sleep under stars in light polluted areas", "how to navigate using stars in northern hemisphere", "what is plogging and how to start a local group", "how to create a backyard wildlife camera trap", "ways to hike silently to observe more wildlife", "how to make a natural insect repellent for ticks", "what is shinrin yoku and measurable health benefits", "how to identify edible weeds in sidewalk cracks", "ways to practice cold water immersion safely at home", "how to build a debris shelter in under 30 minutes", "what is peak bagging and ethical considerations", "how to photograph dew drops on spiderwebs at dawn", "ways to turn lunch breaks into micro adventures", "how to recognize animal tracks in mud and snow", "what is solastalgia and connection to place loss", "how to prepare for a solo day hike with minimal gear", "ways to explore your neighborhood like a tourist", "how to make a solar oven from a pizza box", "what is biophilia and designing spaces that nurture it",
  //   // 🍽️ Food Science & Culinary Heritage (25)
  //   "how fermentation changes nutritional profile of soy", "what is nixtamalization and why it matters for corn", "ways to extract maximum flavor from dried herbs", "how to identify fake olive oil using simple tests", "what is enzymatic browning and how chefs use it", "how koji mold transforms grains and proteins", "ways to balance umami in plant based cooking", "how to make vegan cheese that melts realistically", "what is the maillard reaction and control variables", "how to preserve herbs using oil infusion safely", "ways to reduce food miles in weekly meal planning", "how to test flour protein content at home", "what is autolyse and its role in sourdough", "how to recreate historical recipes with modern tools", "ways to use leftover coffee grounds in cooking", "how to make gluten free bread with better texture", "what is carryover cooking and when to account for it", "how to calibrate your oven thermometer accurately", "ways to use miso beyond soup for depth of flavor", "how to ferment hot sauce with wild cultures", "what is hydrocolloid science in modernist cuisine", "how to make clear broth using egg white raft", "ways to reduce salt without losing savory notes", "how to age cheese at home in small batches", "what is umami synergy and ingredient pairings",
  //   // 🧘 Holistic Health & Integrative Practices (25)
  //   "how to use breathwork for vagus nerve stimulation", "what is forest therapy and certified guide criteria", "ways to integrate tai chi principles into desk work", "how to create a personalized circadian lighting plan", "what is thermography and its diagnostic uses", "how to use acupressure points for travel fatigue", "ways to balance gut microbiome with prebiotic foods", "how to interpret heart rate variability for stress", "what is red light therapy and evidence based uses", "how to schedule meals for optimal digestion rhythm", "ways to reduce emf exposure in sleeping areas", "how to use castor oil packs for lymphatic support", "what is coherence training and hrv biofeedback", "how to choose adaptogens based on constitution", "ways to practice earthing safely in cities", "how to design a restorative yoga sequence at home", "what is functional medicine testing and options", "how to use aromatherapy for focus without distraction", "ways to support mitochondrial health daily", "how to create a digital sunset routine for sleep", "what is myofascial release and tools for self care", "how to use contrast therapy for recovery at home", "ways to reduce histamine load in chronic conditions", "how to interpret tongue diagnosis in traditional systems", "what is grounding meditation and beginner scripts"
  // );

  const maxSearches = 32;
  // minDelay and maxDelay are now in CONFIG (defaults set below)

  // Notification queue system
  const notificationQueue = [];
  let notificationActive = false;

  function showNotification(message, duration = 3000) {
    notificationQueue.push({ message, duration });
    if (!notificationActive) processQueue();
  }

  function processQueue() {
    if (notificationQueue.length === 0) {
      notificationActive = false;
      return;
    }

    notificationActive = true;
    const { message, duration } = notificationQueue.shift();

    const notification = document.createElement('div');
    notification.className = 'notification';
    notification.textContent = message;

    // Bing-style notification (bottom-right)
    notification.style.position = 'fixed';
    notification.style.bottom = '20px';
    notification.style.right = '20px';
    notification.style.padding = '12px 20px';
    notification.style.backgroundColor = '#f9f9f9';
    notification.style.color = '#ffb902';
    notification.style.border = '1px solid #ddd';
    notification.style.borderRadius = '8px';
    notification.style.zIndex = '9999';
    notification.style.textAlign = 'center';
    notification.style.fontFamily = 'Segoe UI, sans-serif';
    notification.style.fontSize = '14px';
    notification.style.boxShadow = '0 2px 8px rgba(0,0,0,0.15)';
    notification.style.userSelect = 'none';
    notification.style.opacity = '0';
    notification.style.transition = 'opacity 0.3s ease';

    document.body.appendChild(notification);

    // Fade in
    requestAnimationFrame(() => {
      notification.style.opacity = '1';
    });

    setTimeout(() => {
      // Fade out
      notification.style.opacity = '0';
      setTimeout(() => {
        notification.remove();
        processQueue();
      }, 500);
    }, duration);
  }

  // Persistent state
  let state = JSON.parse(localStorage.getItem("bingAutoState") || "{}");
  if (!state.running) state.running = false;
  if (!state.count) state.count = 0;

  let timerId = null;
  let countdownInterval = null;
  let nextDelay = 0;
  let isSearching = false; // Guard flag to prevent concurrent searches
  let isResuming = false; // Guard flag to prevent concurrent resume attempts
  let browsingActive = false; // Guard flag for browsing mode

  function saveState() {
    localStorage.setItem("bingAutoState", JSON.stringify(state));
  }

  // Persistent seen-phrases tracking (so each phrase is used only once until reset)
  function loadSeen() {
    try {
      const raw = localStorage.getItem('bingAutoSeen');
      if (!raw) return new Set();
      const arr = JSON.parse(raw);
      return new Set(Array.isArray(arr) ? arr : []);
    } catch (e) { return new Set(); }
  }
  function saveSeen() {
    try { localStorage.setItem('bingAutoSeen', JSON.stringify(Array.from(seenSet))); } catch (e) { }
  }
  function resetSeen() {
    seenSet = new Set();
    saveSeen();
    showNotification('🔁 Seen list reset. All phrases are available again.', 3000);
    updateBadge();
  }

  let seenSet = loadSeen();

  // Simple persistent config (daily cap, browsing mode)
  const DEFAULT_DAILY_CAP = 200;
  function loadConfig() {
    try { return JSON.parse(localStorage.getItem('bingAutoConfig') || '{}') || {}; } catch { return {}; }
  }
  function saveConfig(cfg) { try { localStorage.setItem('bingAutoConfig', JSON.stringify(cfg)); } catch (e) { } }
  let CONFIG = loadConfig();
  if (typeof CONFIG.dailyCap !== 'number') CONFIG.dailyCap = DEFAULT_DAILY_CAP;
  if (typeof CONFIG.browsingMode !== 'boolean') CONFIG.browsingMode = false;
  if (typeof CONFIG.browseDwellMin !== 'number') CONFIG.browseDwellMin = 6; // seconds
  if (typeof CONFIG.browseDwellMax !== 'number') CONFIG.browseDwellMax = 12; // seconds
  if (typeof CONFIG.maxPerHour !== 'number') CONFIG.maxPerHour = 20;
  if (typeof CONFIG.requireManualStart !== 'boolean') CONFIG.requireManualStart = false;
  if (typeof CONFIG.spreadMode !== 'boolean') CONFIG.spreadMode = false;
  if (typeof CONFIG.uaRotate !== 'boolean') CONFIG.uaRotate = false;
  if (typeof CONFIG.uaChangeEvery !== 'number') CONFIG.uaChangeEvery = 2;
  if (typeof CONFIG.minDelay !== 'number') CONFIG.minDelay = 15000; // 15 seconds in milliseconds
  if (typeof CONFIG.maxDelay !== 'number') CONFIG.maxDelay = 60000; // 60 seconds in milliseconds
  
  // Ensure minDelay is less than maxDelay
  if (CONFIG.minDelay >= CONFIG.maxDelay) {
    CONFIG.minDelay = Math.max(5000, CONFIG.maxDelay - 10000); // Ensure at least 5s gap
  }
  
  // Helper functions to get delays (for backward compatibility and easier access)
  function getMinDelay() { return CONFIG.minDelay; }
  function getMaxDelay() { return CONFIG.maxDelay; }

  // Daily counter to avoid too many searches per calendar day
  function loadDaily() {
    try {
      const raw = JSON.parse(localStorage.getItem('bingAutoDaily') || '{}');
      const today = new Date().toISOString().slice(0, 10);
      if (raw.date !== today) return { date: today, count: 0 };
      return raw;
    } catch { return { date: new Date().toISOString().slice(0, 10), count: 0 }; }
  }
  function saveDaily(d) { try { localStorage.setItem('bingAutoDaily', JSON.stringify(d)); } catch (e) { } }
  let DAILY = loadDaily();
  function incrementDaily() { DAILY.count++; saveDaily(DAILY); }

  // Hourly tracking
  function loadHourly() {
    try {
      const raw = JSON.parse(localStorage.getItem('bingAutoHourly') || '{}');
      const currentHour = Math.floor(Date.now() / 3600000);
      if (raw.hour !== currentHour) return { hour: currentHour, count: 0 };
      return raw;
    } catch { return { hour: Math.floor(Date.now() / 3600000), count: 0 }; }
  }
  function saveHourly(h) { try { localStorage.setItem('bingAutoHourly', JSON.stringify(h)); } catch (e) { } }
  let HOURLY = loadHourly();
  function incrementHourly() { const currentHour = Math.floor(Date.now() / 3600000); if (HOURLY.hour !== currentHour) { HOURLY = { hour: currentHour, count: 1 }; } else { HOURLY.count++; } saveHourly(HOURLY); }

  // Simple event log (capped)
  const LOG_MAX = 300;
  function loadLog() { try { return JSON.parse(localStorage.getItem('bingAutoLog') || '[]'); } catch { return []; } }
  function saveLog(arr) { try { localStorage.setItem('bingAutoLog', JSON.stringify(arr.slice(-LOG_MAX))); } catch { } }
  let eventLog = loadLog();
  function logEvent(type, message) {
    const entry = { t: new Date().toISOString(), type: type, message: message };
    eventLog.push(entry);
    saveLog(eventLog);
    console.log('[BingAuto]', type, message);
  }
  function downloadLog() {
    const blob = new Blob([JSON.stringify(eventLog, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `bing-auto-log-${new Date().toISOString().slice(0, 10)}.json`; document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  function clearLog() { eventLog = []; saveLog(eventLog); showNotification('🧹 Log cleared.', 2000); }

  // Detect interstitials / bot checks (defensive: stop and notify)
  function detectInterstitial() {
    try {
      const txt = (document.body && document.body.innerText || '').toLowerCase();
      const checks = ['captcha', 'are you a robot', 'verify', 'please verify', 'enter the characters', 'unusual traffic', 'access to this page has been denied', 'press and hold', 'we have detected', 'prove you are human'];
      for (const c of checks) if (txt.includes(c)) return c;
      return null;
    } catch (e) { return null; }
  }

  // Detect if we're in an overlay/modal (like Bing Rewards overlay)
  function isInOverlay() {
    try {
      // Check for Bing Rewards specific overlay first (most common issue)
      const rewardsSelectors = [
        '#rewards-overlay',
        '[id*="rewards"][id*="overlay"]',
        '[id*="rewards"][id*="modal"]',
        '[class*="rewards"][class*="overlay"]',
        '[class*="rewards"][class*="modal"]',
        '[class*="rewards"][class*="dialog"]',
        '[data-module="rewards"]',
        '.rewards-overlay',
        '.rewards-modal'
      ];
      for (const selector of rewardsSelectors) {
        const el = document.querySelector(selector);
        if (el) {
          const style = window.getComputedStyle(el);
          if (style.display !== 'none' && style.visibility !== 'hidden' && parseFloat(style.opacity) > 0) {
            const rect = el.getBoundingClientRect();
            if (rect.width > 0 && rect.height > 0) {
              return true;
            }
          }
        }
      }

      // Check for common overlay/modal indicators
      const overlaySelectors = [
        '[class*="overlay"]',
        '[class*="modal"]',
        '[class*="dialog"]',
        '[id*="overlay"]',
        '[id*="modal"]',
        '[id*="dialog"]',
        '[role="dialog"]',
        '[role="alertdialog"]'
      ];
      
      for (const selector of overlaySelectors) {
        const overlays = document.querySelectorAll(selector);
        for (const overlay of overlays) {
          const style = window.getComputedStyle(overlay);
          if (style.display !== 'none' && style.visibility !== 'hidden' && parseFloat(style.opacity) > 0) {
            const rect = overlay.getBoundingClientRect();
            // If overlay covers more than 25% of viewport, consider it active
            if (rect.width > 0 && rect.height > 0 && 
                rect.width * rect.height > window.innerWidth * window.innerHeight * 0.25) {
              return true;
            }
          }
        }
      }

      // Check if body has overlay class or style (body locked = overlay likely open)
      if (document.body) {
        const bodyStyle = window.getComputedStyle(document.body);
        if (bodyStyle.overflow === 'hidden' || bodyStyle.position === 'fixed') {
          // Check if there's a visible overlay element
          const hasVisibleOverlay = document.querySelector('[class*="overlay"]:not([style*="display: none"]), [class*="modal"]:not([style*="display: none"])');
          if (hasVisibleOverlay) {
            return true;
          }
        }
      }
      return false;
    } catch (e) { 
      logEvent('overlay', 'detection-error:' + e.message);
      return false; 
    }
  }

  // Close any open overlays/modals
  function closeOverlays() {
    try {
      // Try to find and click close buttons (prioritize common ones)
      const closeSelectors = [
        'button[aria-label*="close" i]',
        'button[aria-label*="Close" i]',
        '[aria-label*="close" i]',
        '[aria-label*="Close" i]',
        'button[class*="close"]',
        'button[class*="dismiss"]',
        '[class*="close-button"]',
        '[class*="dismiss-button"]',
        '.cib-close-button',
        '[id*="close-button"]',
        '[id*="dismiss-button"]',
        '[class*="close"]',
        '[class*="dismiss"]',
        '[id*="close"]'
      ];
      
      for (const selector of closeSelectors) {
        const closeBtns = document.querySelectorAll(selector);
        for (const closeBtn of closeBtns) {
          if (closeBtn && closeBtn.offsetParent !== null) { // Check if visible
            const style = window.getComputedStyle(closeBtn);
            if (style.display !== 'none' && style.visibility !== 'hidden') {
              closeBtn.click();
              logEvent('overlay', 'closed via button');
              return true;
            }
          }
        }
      }
      
      // Try ESC key simulation (works for many modals)
      const escEvent = new KeyboardEvent('keydown', { 
        key: 'Escape', 
        keyCode: 27, 
        code: 'Escape',
        bubbles: true,
        cancelable: true
      });
      document.dispatchEvent(escEvent);
      document.dispatchEvent(new KeyboardEvent('keyup', { 
        key: 'Escape', 
        keyCode: 27, 
        bubbles: true 
      }));
      
      // Check if overlay closed after ESC
      setTimeout(() => {
        if (!isInOverlay()) {
          logEvent('overlay', 'closed via ESC');
        }
      }, 200);
      
      return false; // ESC might work but we can't confirm immediately
    } catch (e) { 
      logEvent('overlay', 'close-error:' + e.message);
      return false; 
    }
  }

  // --- Typing simulation (human-like) ---
  async function simulateTypingInto(input, text) {
    const mistakeProb = 0.24; // ~24% chance to make 1-2 typos per phrase
    const makeMistake = Math.random() < mistakeProb;
    const chars = text.split('');
    input.focus();
    input.value = '';
    input.dispatchEvent(new Event('input', { bubbles: true }));

    // choose mistake positions
    let mistakes = [];
    if (makeMistake) {
      const count = Math.random() < 0.6 ? 1 : 2;
      for (let i = 0; i < count; i++) mistakes.push(Math.max(0, Math.floor(Math.random() * Math.max(1, chars.length - 2))));
      mistakes = Array.from(new Set(mistakes));
    }

    for (let i = 0; i < chars.length; i++) {
      // random per-char delay
      const base = randInt(80, 220);
      await new Promise(r => setTimeout(r, base));

      // if this position is a mistake, type a wrong character first
      if (mistakes.includes(i)) {
        const wrong = String.fromCharCode(97 + Math.floor(Math.random() * 26));
        input.value += wrong;
        input.dispatchEvent(new Event('input', { bubbles: true }));
        await new Promise(r => setTimeout(r, randInt(120, 320)));
        // backspace
        input.value = input.value.slice(0, -1);
        input.dispatchEvent(new Event('input', { bubbles: true }));
        await new Promise(r => setTimeout(r, randInt(80, 170)));
      }

      input.value += chars[i];
      input.dispatchEvent(new Event('input', { bubbles: true }));
    }

    // small pause after typing
    await new Promise(r => setTimeout(r, randInt(250, 700)));
  }

  // --- JS-level User-Agent override (page-visible only) ---
  const UA_EDGE_WIN = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/116.0.0.0 Safari/537.36 Edg/116.0.1938.69';
  const UA_EDGE_ANDROID = 'Mozilla/5.0 (Linux; Android 12; Pixel 5) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/116.0.0.0 Mobile Safari/537.36 EdgA/116.0.1938.69';
  let uaToggleCounter = 0;
  function injectUAForPage(uaString) {
    try {
      const code = `Object.defineProperty(navigator, 'userAgent', {get: ()=>"${uaString}", configurable:true});Object.defineProperty(navigator, 'appVersion', {get: ()=>"${uaString}", configurable:true});`;
      const s = document.createElement('script'); s.textContent = code; (document.documentElement || document.head || document.body).appendChild(s); s.remove();
      logEvent('ua', 'set:' + uaString.slice(0, 40) + '...');
    } catch (e) { logEvent('ua', 'inject-fail:' + e.message); }
  }
  function maybeRotateUA() {
    if (!CONFIG.uaRotate) return;
    uaToggleCounter++;
    if (uaToggleCounter % CONFIG.uaChangeEvery !== 0) return; // only change on interval
    // pick UA based on counter parity
    const ua = (Math.random() < 0.5) ? UA_EDGE_WIN : UA_EDGE_ANDROID;
    injectUAForPage(ua);
  }

  // Visibility pause/resume
  let pausedByVisibility = false;
  let visibilityResumeTimer = null;
  let visibilityPauseTime = null; // Track when we paused
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      if (state.running) {
        pausedByVisibility = true;
        visibilityPauseTime = Date.now();
        // Clear any existing resume timer
        if (visibilityResumeTimer) {
          clearTimeout(visibilityResumeTimer);
          visibilityResumeTimer = null;
        }
        if (timerId) {
          clearTimeout(timerId);
          timerId = null;
        }
        clearInterval(countdownInterval);
        countdownInterval = null;
        nextDelay = 0; // Reset countdown
        updateBadge();
        showNotification('⏸️ Paused (tab hidden). Will resume when visible.', 3000);
        logEvent('pause', 'Paused due to tab hidden');
      }
    } else {
      if (pausedByVisibility && state.running) {
        const pauseDuration = visibilityPauseTime ? Date.now() - visibilityPauseTime : 0;
        pausedByVisibility = false;
        visibilityPauseTime = null;
        // Clear any existing resume timer
        if (visibilityResumeTimer) {
          clearTimeout(visibilityResumeTimer);
          visibilityResumeTimer = null;
        }
        // Clear any existing timer first
        if (timerId) {
          clearTimeout(timerId);
          timerId = null;
        }
        // Reset flags to allow resume
        isResuming = false;
        isSearching = false;
        // Use checkAndResume to properly handle the resume logic
        // This ensures we're on the right page and sets up the timer correctly
        showNotification('▶️ Resuming automation...', 2500);
        logEvent('resume', 'Resumed after tab visible (paused for ' + Math.round(pauseDuration / 1000) + 's)');
        // Small delay to ensure page is ready, then use checkAndResume
        visibilityResumeTimer = setTimeout(() => {
          visibilityResumeTimer = null;
          if (state.running) {
            checkAndResume();
          }
        }, 500);
      }
    }
  });

  function randInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  // Controls container: badge + start/stop buttons
  // === UI: Fixed Layout ===
  // Always-visible: Start | Stop | ⚙️ Settings | (badge last)
  const controls = document.createElement("div");
  controls.style.position = "fixed";
  controls.style.bottom = "20px";
  controls.style.left = "20px";
  controls.style.display = "flex";
  controls.style.alignItems = "center";
  controls.style.gap = "8px";
  controls.style.zIndex = "9999";
  document.body.appendChild(controls);

  // --- Always-visible action buttons (fixed order, never move) ---
  const startButton = document.createElement("button");
  startButton.textContent = "Start";
  startButton.title = "Ctrl+Shift+C";
  startButton.style.padding = "8px 12px";
  startButton.style.borderRadius = "8px";
  startButton.style.border = "1px solid #ddd";
  startButton.style.background = "#0f9d58";
  startButton.style.color = "#fff";
  startButton.style.cursor = "pointer";
  startButton.style.fontFamily = "Segoe UI, sans-serif";
  startButton.style.fontSize = "13px";
  startButton.style.boxShadow = "0 1px 4px rgba(0,0,0,0.12)";
  startButton.addEventListener("click", startAutomation);
  controls.appendChild(startButton);

  const stopButton = document.createElement("button");
  stopButton.textContent = "Stop";
  stopButton.title = "Ctrl+Shift+X";
  stopButton.style.padding = "8px 12px";
  stopButton.style.borderRadius = "8px";
  stopButton.style.border = "1px solid #ddd";
  stopButton.style.background = "#d9534f";
  stopButton.style.color = "#fff";
  stopButton.style.cursor = "pointer";
  stopButton.style.fontFamily = "Segoe UI, sans-serif";
  stopButton.style.fontSize = "13px";
  stopButton.style.boxShadow = "0 1px 4px rgba(0,0,0,0.12)";
  stopButton.addEventListener("click", stopAutomation);
  controls.appendChild(stopButton);

  // --- Settings toggle ---
  let settingsExpanded = false;
  const settingsButton = document.createElement("button");
  settingsButton.textContent = "⚙️ Settings";
  settingsButton.title = "Show/hide advanced controls";
  settingsButton.style.padding = "8px 10px";
  settingsButton.style.borderRadius = "8px";
  settingsButton.style.border = "1px solid #ddd";
  settingsButton.style.background = "#6c757d";
  settingsButton.style.color = "#fff";
  settingsButton.style.cursor = "pointer";
  settingsButton.style.fontFamily = "Segoe UI, sans-serif";
  settingsButton.style.fontSize = "12px";
  settingsButton.style.boxShadow = "0 1px 4px rgba(0,0,0,0.12)";
  settingsButton.addEventListener("click", () => {
    settingsExpanded = !settingsExpanded;
    settingsContainer.style.display = settingsExpanded ? "flex" : "none";
    settingsButton.textContent = settingsExpanded ? "⚙️ Hide Settings" : "⚙️ Show Settings";
  });
  controls.appendChild(settingsButton);

  // --- Badge (moved to end) ---
  const badge = document.createElement("div");
  badge.style.background = "#f9f9f9";
  badge.style.color = "#f25022";
  badge.style.padding = "8px 14px";
  badge.style.border = "1px solid #ddd";
  badge.style.borderRadius = "8px";
  badge.style.fontSize = "14px";
  badge.style.fontFamily = "Segoe UI, sans-serif";
  badge.style.boxShadow = "0 2px 8px rgba(0,0,0,0.15)";
  badge.style.userSelect = "none";
  badge.style.display = "block"; // always visible (shows status only)
  controls.appendChild(badge);

  // --- Settings container (hidden by default) ---
  const settingsContainer = document.createElement("div");
  settingsContainer.style.position = "fixed";
  settingsContainer.style.bottom = "60px"; // just above main controls
  settingsContainer.style.left = "20px";
  settingsContainer.style.display = "none"; // hidden by default
  settingsContainer.style.alignItems = "center";
  settingsContainer.style.gap = "6px";
  settingsContainer.style.zIndex = "9998";
  settingsContainer.style.background = "#fff";
  settingsContainer.style.padding = "6px";
  settingsContainer.style.borderRadius = "8px";
  settingsContainer.style.border = "1px solid #eee";
  settingsContainer.style.boxShadow = "0 2px 6px rgba(0,0,0,0.1)";
  document.body.appendChild(settingsContainer);

  // Now create all secondary buttons and append to settingsContainer
  const resetSeenButton = document.createElement("button");
  resetSeenButton.textContent = "Reset Seen";
  resetSeenButton.title = "Reset seen searches";
  resetSeenButton.style.padding = "6px 10px";
  resetSeenButton.style.borderRadius = "6px";
  resetSeenButton.style.border = "1px solid #ddd";
  resetSeenButton.style.background = "#f0ad4e";
  resetSeenButton.style.color = "#062538";
  resetSeenButton.style.cursor = "pointer";
  resetSeenButton.style.fontFamily = "Segoe UI, sans-serif";
  resetSeenButton.style.fontSize = "11px";
  resetSeenButton.style.boxShadow = "0 1px 3px rgba(0,0,0,0.1)";
  resetSeenButton.addEventListener("click", resetSeen);
  settingsContainer.appendChild(resetSeenButton);

  const dailyCapBtn = document.createElement('button');
  dailyCapBtn.textContent = `Daily: ${DAILY.count}/${CONFIG.dailyCap}`;
  dailyCapBtn.title = 'Click to change daily cap';
  dailyCapBtn.style.padding = '6px 8px';
  dailyCapBtn.style.borderRadius = '6px';
  dailyCapBtn.style.border = '1px solid #ddd';
  dailyCapBtn.style.background = '#ffffff';
  dailyCapBtn.style.color = '#333';
  dailyCapBtn.style.cursor = 'pointer';
  dailyCapBtn.style.fontFamily = 'Segoe UI, sans-serif';
  dailyCapBtn.style.fontSize = '11px';
  dailyCapBtn.addEventListener('click', () => {
    const next = parseInt(prompt('Set daily cap (number of searches per day):', CONFIG.dailyCap), 10);
    if (!isNaN(next) && next > 0) {
      CONFIG.dailyCap = next;
      saveConfig(CONFIG);
      showNotification(`✅ Daily cap set to ${next}`, 2000);
      dailyCapBtn.textContent = `Daily: ${DAILY.count}/${CONFIG.dailyCap}`;
    }
  });
  settingsContainer.appendChild(dailyCapBtn);

  const browseToggle = document.createElement('button');
  browseToggle.textContent = CONFIG.browsingMode ? 'Browse: ON' : 'Browse: OFF';
  browseToggle.title = 'Toggle browsing mode (opt-in)';
  browseToggle.style.padding = '6px 8px';
  browseToggle.style.borderRadius = '6px';
  browseToggle.style.border = '1px solid #ddd';
  browseToggle.style.background = CONFIG.browsingMode ? '#2b6cb0' : '#fff';
  browseToggle.style.color = CONFIG.browsingMode ? '#fff' : '#333';
  browseToggle.style.cursor = 'pointer';
  browseToggle.style.fontFamily = 'Segoe UI, sans-serif';
  browseToggle.style.fontSize = '11px';
  browseToggle.addEventListener('click', () => {
    CONFIG.browsingMode = !CONFIG.browsingMode; saveConfig(CONFIG);
    browseToggle.textContent = CONFIG.browsingMode ? 'Browse: ON' : 'Browse: OFF';
    browseToggle.style.background = CONFIG.browsingMode ? '#2b6cb0' : '#fff';
    browseToggle.style.color = CONFIG.browsingMode ? '#fff' : '#333';
    showNotification(CONFIG.browsingMode ? '🔄 Browsing mode enabled (opt-in)' : '🔒 Browsing mode disabled', 2500);
  });
  settingsContainer.appendChild(browseToggle);

  const downloadLogBtn = document.createElement('button');
  downloadLogBtn.textContent = 'Download Log';
  downloadLogBtn.style.padding = '6px 8px';
  downloadLogBtn.style.borderRadius = '6px';
  downloadLogBtn.style.border = '1px solid #ddd';
  downloadLogBtn.style.background = '#6c757d';
  downloadLogBtn.style.color = '#fff';
  downloadLogBtn.style.cursor = 'pointer';
  downloadLogBtn.style.fontFamily = 'Segoe UI, sans-serif';
  downloadLogBtn.style.fontSize = '11px';
  downloadLogBtn.addEventListener('click', downloadLog);
  settingsContainer.appendChild(downloadLogBtn);

  const clearLogBtn = document.createElement('button');
  clearLogBtn.textContent = 'Clear Log';
  clearLogBtn.style.padding = '6px 8px';
  clearLogBtn.style.borderRadius = '6px';
  clearLogBtn.style.border = '1px solid #ddd';
  clearLogBtn.style.background = '#adb5bd';
  clearLogBtn.style.color = '#062538';
  clearLogBtn.style.cursor = 'pointer';
  clearLogBtn.style.fontFamily = 'Segoe UI, sans-serif';
  clearLogBtn.style.fontSize = '11px';
  clearLogBtn.addEventListener('click', () => { if (confirm('Clear event log?')) clearLog(); });
  settingsContainer.appendChild(clearLogBtn);

  const requireStartBtn = document.createElement('button');
  requireStartBtn.textContent = CONFIG.requireManualStart ? 'Manual: ON' : 'Manual: OFF';
  requireStartBtn.style.padding = '6px 8px';
  requireStartBtn.style.borderRadius = '6px';
  requireStartBtn.style.border = '1px solid #ddd';
  requireStartBtn.style.background = CONFIG.requireManualStart ? '#2b6cb0' : '#fff';
  requireStartBtn.style.color = CONFIG.requireManualStart ? '#fff' : '#333';
  requireStartBtn.style.cursor = 'pointer';
  requireStartBtn.style.fontSize = '11px';
  requireStartBtn.addEventListener('click', () => {
    CONFIG.requireManualStart = !CONFIG.requireManualStart;
    saveConfig(CONFIG);
    requireStartBtn.textContent = CONFIG.requireManualStart ? 'Manual: ON' : 'Manual: OFF';
    requireStartBtn.style.background = CONFIG.requireManualStart ? '#2b6cb0' : '#fff';
    showNotification('Manual start: ' + (CONFIG.requireManualStart ? 'enabled' : 'disabled'), 2000);
  });
  settingsContainer.appendChild(requireStartBtn);

  const spreadBtn = document.createElement('button');
  spreadBtn.textContent = CONFIG.spreadMode ? 'Spread: ON' : 'Spread: OFF';
  spreadBtn.style.padding = '6px 8px';
  spreadBtn.style.borderRadius = '6px';
  spreadBtn.style.border = '1px solid #ddd';
  spreadBtn.style.background = CONFIG.spreadMode ? '#2b6cb0' : '#fff';
  spreadBtn.style.color = CONFIG.spreadMode ? '#fff' : '#333';
  spreadBtn.style.cursor = 'pointer';
  spreadBtn.style.fontSize = '11px';
  spreadBtn.addEventListener('click', () => {
    CONFIG.spreadMode = !CONFIG.spreadMode;
    saveConfig(CONFIG);
    spreadBtn.textContent = CONFIG.spreadMode ? 'Spread: ON' : 'Spread: OFF';
    spreadBtn.style.background = CONFIG.spreadMode ? '#2b6cb0' : '#fff';
    showNotification('Spread mode: ' + (CONFIG.spreadMode ? 'enabled' : 'disabled'), 2000);
  });
  settingsContainer.appendChild(spreadBtn);

  const hourlyBtn = document.createElement('button');
  hourlyBtn.textContent = `Hour: ${HOURLY.count}/${CONFIG.maxPerHour}`;
  hourlyBtn.style.padding = '6px 8px';
  hourlyBtn.style.borderRadius = '6px';
  hourlyBtn.style.border = '1px solid #ddd';
  hourlyBtn.style.background = '#fff';
  hourlyBtn.style.color = '#333';
  hourlyBtn.style.cursor = 'pointer';
  hourlyBtn.style.fontSize = '11px';
  hourlyBtn.addEventListener('click', () => {
    const next = parseInt(prompt('Set max searches per hour:', CONFIG.maxPerHour), 10);
    if (!isNaN(next) && next > 0) {
      CONFIG.maxPerHour = next;
      saveConfig(CONFIG);
      showNotification(`✅ Hourly cap set to ${next}`, 2000);
      hourlyBtn.textContent = `Hour: ${HOURLY.count}/${CONFIG.maxPerHour}`;
    }
  });
  settingsContainer.appendChild(hourlyBtn);

  // Min Delay button
  const minDelayBtn = document.createElement('button');
  minDelayBtn.textContent = `Min: ${Math.round(CONFIG.minDelay / 1000)}s`;
  minDelayBtn.title = 'Click to change minimum delay between searches (in seconds)';
  minDelayBtn.style.padding = '6px 8px';
  minDelayBtn.style.borderRadius = '6px';
  minDelayBtn.style.border = '1px solid #ddd';
  minDelayBtn.style.background = '#fff';
  minDelayBtn.style.color = '#333';
  minDelayBtn.style.cursor = 'pointer';
  minDelayBtn.style.fontSize = '11px';
  minDelayBtn.addEventListener('click', () => {
    const currentSeconds = Math.round(CONFIG.minDelay / 1000);
    const next = parseInt(prompt(`Set minimum delay between searches (in seconds, current: ${currentSeconds}s, minimum: 5s):`, currentSeconds), 10);
    if (!isNaN(next) && next >= 5) {
      const newDelay = next * 1000; // Convert to milliseconds
      if (newDelay < CONFIG.maxDelay) {
        CONFIG.minDelay = newDelay;
        saveConfig(CONFIG);
        showNotification(`✅ Min delay set to ${next}s`, 2000);
        minDelayBtn.textContent = `Min: ${next}s`;
      } else {
        showNotification(`❌ Min delay must be less than max delay (${Math.round(CONFIG.maxDelay / 1000)}s)`, 3000);
      }
    } else if (!isNaN(next) && next < 5) {
      showNotification('❌ Minimum delay must be at least 5 seconds', 3000);
    }
  });
  settingsContainer.appendChild(minDelayBtn);

  // Max Delay button
  const maxDelayBtn = document.createElement('button');
  maxDelayBtn.textContent = `Max: ${Math.round(CONFIG.maxDelay / 1000)}s`;
  maxDelayBtn.title = 'Click to change maximum delay between searches (in seconds)';
  maxDelayBtn.style.padding = '6px 8px';
  maxDelayBtn.style.borderRadius = '6px';
  maxDelayBtn.style.border = '1px solid #ddd';
  maxDelayBtn.style.background = '#fff';
  maxDelayBtn.style.color = '#333';
  maxDelayBtn.style.cursor = 'pointer';
  maxDelayBtn.style.fontSize = '11px';
  maxDelayBtn.addEventListener('click', () => {
    const currentSeconds = Math.round(CONFIG.maxDelay / 1000);
    const next = parseInt(prompt(`Set maximum delay between searches (in seconds, current: ${currentSeconds}s, minimum: 10s):`, currentSeconds), 10);
    if (!isNaN(next) && next >= 10) {
      const newDelay = next * 1000; // Convert to milliseconds
      if (newDelay > CONFIG.minDelay) {
        CONFIG.maxDelay = newDelay;
        saveConfig(CONFIG);
        showNotification(`✅ Max delay set to ${next}s`, 2000);
        maxDelayBtn.textContent = `Max: ${next}s`;
      } else {
        showNotification(`❌ Max delay must be greater than min delay (${Math.round(CONFIG.minDelay / 1000)}s)`, 3000);
      }
    } else if (!isNaN(next) && next < 10) {
      showNotification('❌ Maximum delay must be at least 10 seconds', 3000);
    }
  });
  settingsContainer.appendChild(maxDelayBtn);

  const resetAllBtn = document.createElement('button');
  resetAllBtn.textContent = 'Reset All';
  resetAllBtn.style.padding = '6px 8px';
  resetAllBtn.style.borderRadius = '6px';
  resetAllBtn.style.border = '1px solid #ddd';
  resetAllBtn.style.background = '#dc3545';
  resetAllBtn.style.color = '#fff';
  resetAllBtn.style.cursor = 'pointer';
  resetAllBtn.style.fontSize = '11px';
  resetAllBtn.addEventListener('click', () => {
    if (!confirm('Clear seen list, logs, counters, and config?')) return;
    localStorage.removeItem('bingAutoSeen');
    localStorage.removeItem('bingAutoLog');
    localStorage.removeItem('bingAutoDaily');
    localStorage.removeItem('bingAutoHourly');
    localStorage.removeItem('bingAutoConfig');
    localStorage.removeItem('bingAutoState');
    seenSet = new Set();
    eventLog = [];
    DAILY = loadDaily();
    HOURLY = loadHourly();
    CONFIG = loadConfig();
    // Reset defaults if needed
    if (typeof CONFIG.minDelay !== 'number') CONFIG.minDelay = 15000;
    if (typeof CONFIG.maxDelay !== 'number') CONFIG.maxDelay = 60000;
    showNotification('🧹 All data cleared. Reload to apply.', 3000);
    logEvent('reset', 'user-reset-all');
    // Update buttons
    dailyCapBtn.textContent = `Daily: ${DAILY.count}/${CONFIG.dailyCap}`;
    hourlyBtn.textContent = `Hour: ${HOURLY.count}/${CONFIG.maxPerHour}`;
    minDelayBtn.textContent = `Min: ${Math.round(CONFIG.minDelay / 1000)}s`;
    maxDelayBtn.textContent = `Max: ${Math.round(CONFIG.maxDelay / 1000)}s`;
    browseToggle.textContent = CONFIG.browsingMode ? 'Browse: ON' : 'Browse: OFF';
    requireStartBtn.textContent = CONFIG.requireManualStart ? 'Manual: ON' : 'Manual: OFF';
    spreadBtn.textContent = CONFIG.spreadMode ? 'Spread: ON' : 'Spread: OFF';
  });
  settingsContainer.appendChild(resetAllBtn);

  function updateBadge() {
    // Always keep Start/Stop visible — just enable/disable
    startButton.disabled = state.running;
    stopButton.disabled = !state.running;
    startButton.style.opacity = startButton.disabled ? "0.5" : "1";
    stopButton.style.opacity = stopButton.disabled ? "0.5" : "1";
    badge.textContent = `✅ Ready | Waiting to start`;

    if (!state.running) {
      const remaining = words.length - seenSet.size;
      badge.textContent = `⏸️ Stopped | Remaining: ${remaining}`;
      return;
    }

    let progress = `${state.count}/${maxSearches}`;
    let timerText = nextDelay > 0 ? ` | ⏳ ${nextDelay}s` : "";
    badge.textContent = `▶️ Running | ${progress}${timerText}`;
  }

  function startCountdown(seconds) {
    nextDelay = seconds;
    if (countdownInterval) {
      clearInterval(countdownInterval);
      countdownInterval = null;
    }
    updateBadge();
    countdownInterval = setInterval(() => {
      if (!state.running) {
        clearInterval(countdownInterval);
        countdownInterval = null;
        return;
      }
      if (nextDelay > 0) {
        nextDelay--;
        updateBadge();
      } else {
        clearInterval(countdownInterval);
        countdownInterval = null;
      }
    }, 1000);
  }

  function doSearch() {
    // Guard against concurrent execution
    if (isSearching) {
      logEvent('search', 'Skipped - search already in progress');
      return;
    }

    // Check if we're in an overlay - close it first
    if (isInOverlay()) {
      logEvent('search', 'Overlay detected, attempting to close');
      if (closeOverlays()) {
        // Wait a bit for overlay to close, then retry
        setTimeout(() => {
          if (state.running && !isSearching) doSearch();
        }, 500);
        return;
      }
    }

    if (!state.running || state.count >= maxSearches) {
      state.running = false;
      isSearching = false;
      saveState();
      clearInterval(countdownInterval);
      updateBadge();
      showNotification("⏹️ Automation finished.", 3000);
      return;
    }

    // daily cap check
    if (DAILY.count >= CONFIG.dailyCap) {
      state.running = false; 
      isSearching = false;
      saveState(); 
      updateBadge(); 
      showNotification('⚠️ Daily cap reached. Automation stopped.', 4000); 
      logEvent('stop', 'Daily cap reached'); 
      return;
    }
    
    // hourly cap check
    const currentHour = Math.floor(Date.now() / 3600000);
    if (HOURLY.hour !== currentHour) { 
      HOURLY = { hour: currentHour, count: 0 }; 
      saveHourly(HOURLY);
    }
    if (HOURLY.count >= CONFIG.maxPerHour) { 
      state.running = false; 
      isSearching = false;
      saveState(); 
      updateBadge(); 
      showNotification('⚠️ Hourly cap reached. Automation stopped.', 4000); 
      logEvent('stop', 'Hourly cap reached'); 
      return; 
    }
    
    // build list of unseen phrases
    const unseen = words.filter(w => !seenSet.has(w));
    if (unseen.length === 0) {
      // nothing left to search
      state.running = false;
      isSearching = false;
      saveState();
      clearInterval(countdownInterval);
      updateBadge();
      showNotification('✅ All phrases have been searched once. Reset seen list to run again.', 5000);
      return;
    }

    // Set searching flag
    isSearching = true;

    const randomWord = unseen[randInt(0, unseen.length - 1)];
    // mark seen
    seenSet.add(randomWord);
    saveSeen();
    state.count++;
    saveState();
    incrementDaily();
    incrementHourly();
    hourlyBtn.textContent = `Hour: ${HOURLY.count}/${CONFIG.maxPerHour}`;
    dailyCapBtn.textContent = `Daily: ${DAILY.count}/${CONFIG.dailyCap}`;
    logEvent('search', `Searching: ${randomWord}`);

    showNotification(`🔍 [${state.count}/${maxSearches}] Searching: "${randomWord}"`, 2500);

    // First, check if there are any rewards iframes on the page and log them
    const allIframes = document.querySelectorAll('iframe');
    let rewardsIframesFound = 0;
    for (const iframe of allIframes) {
      try {
        const src = iframe.getAttribute('src') || iframe.getAttribute('data-src') || '';
        if (src.includes('rewards.bing.com') || src.includes('rewards.microsoft.com') || src.includes('/rewards/')) {
          rewardsIframesFound++;
          logEvent('search', `Rewards iframe detected: ${src.substring(0, 100)}`);
        }
      } catch (e) {
        // Ignore
      }
    }
    if (rewardsIframesFound > 0) {
      logEvent('search', `Found ${rewardsIframesFound} rewards iframe(s) on page - will avoid them`);
    }

    // Find search input - prioritize main page input, avoid iframes
    // This is critical to prevent affecting Bing Rewards iframes
    let input = null;
    
    // Helper function to check if element is in main document (not in iframe, especially not rewards iframe)
    function isInMainDocument(element) {
      if (!element) return false;
      let current = element;
      while (current && current !== document.body && current !== document.documentElement) {
        if (current.tagName === 'IFRAME') {
          // Check if this iframe is a rewards iframe
          const iframe = current;
          const src = iframe.getAttribute('src') || iframe.getAttribute('data-src') || '';
          // Check if iframe src contains rewards subdomain
          if (src.includes('rewards.bing.com') || src.includes('rewards.microsoft.com') || 
              src.includes('/rewards/') || iframe.id?.toLowerCase().includes('rewards') ||
              iframe.className?.toLowerCase().includes('rewards')) {
            logEvent('search', 'Element is inside rewards iframe, skipping');
            return false; // Element is inside a rewards iframe
          }
          // Element is inside some iframe (not rewards, but still not main document)
          return false;
        }
        current = current.parentElement;
      }
      return true; // Element is in main document
    }
    
    // Additional check: verify element is not inside any iframe with rewards in URL
    function isNotInRewardsIframe(element) {
      if (!element) return false;
      // Check all iframes on the page
      const allIframes = document.querySelectorAll('iframe');
      for (const iframe of allIframes) {
        try {
          const src = iframe.getAttribute('src') || iframe.getAttribute('data-src') || '';
          const id = iframe.id || '';
          const className = iframe.className || '';
          
          // Check if this is a rewards iframe
          const isRewardsIframe = src.includes('rewards.bing.com') || 
                                  src.includes('rewards.microsoft.com') ||
                                  src.includes('/rewards/') ||
                                  id.toLowerCase().includes('rewards') ||
                                  className.toLowerCase().includes('rewards');
          
          if (isRewardsIframe) {
            // Check if element is inside this iframe's content
            try {
              // Try to access iframe content (may fail due to cross-origin)
              const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
              if (iframeDoc && iframeDoc.contains && iframeDoc.contains(element)) {
                logEvent('search', 'Element found inside rewards iframe content, skipping');
                return false;
              }
            } catch (e) {
              // Cross-origin, can't access - but we can check if element is a descendant
              // by checking if iframe is an ancestor
              let parent = element.parentElement;
              while (parent) {
                if (parent === iframe) {
                  logEvent('search', 'Element is descendant of rewards iframe, skipping');
                  return false;
                }
                parent = parent.parentElement;
              }
            }
          }
        } catch (e) {
          // Ignore errors checking iframe
        }
      }
      return true;
    }
    
    // First try to find input in main document (not in iframes, especially not rewards iframes)
    const mainInputs = document.querySelectorAll("input[name='q']");
    for (const inp of mainInputs) {
      // Check if input is in main document (not in iframe) and not in rewards iframe
      if (isInMainDocument(inp) && isNotInRewardsIframe(inp) && inp.offsetParent !== null) {
        const rect = inp.getBoundingClientRect();
        // Verify it's actually visible and has reasonable size
        if (rect.width > 0 && rect.height > 0 && rect.width < window.innerWidth) {
          // Additional check: make sure it's not inside a hidden container
          const style = window.getComputedStyle(inp);
          if (style.display !== 'none' && style.visibility !== 'hidden') {
            // Final check: verify the input's form action doesn't point to rewards
            const form = inp.closest('form');
            if (form) {
              const formAction = form.getAttribute('action') || '';
              if (formAction.includes('rewards.bing.com') || formAction.includes('rewards.microsoft.com')) {
                logEvent('search', 'Input form points to rewards, skipping');
                continue;
              }
            }
            input = inp;
            logEvent('search', 'Found main document search input');
            break;
          }
        }
      }
    }
    
    // Fallback: if no main input found, try standard selector but verify it's not in iframe
    if (!input) {
      const fallbackInput = document.querySelector("input[name='q']");
      if (fallbackInput && isInMainDocument(fallbackInput) && isNotInRewardsIframe(fallbackInput) && fallbackInput.offsetParent !== null) {
        // Double-check form action
        const form = fallbackInput.closest('form');
        if (!form || (!form.getAttribute('action')?.includes('rewards.bing.com') && !form.getAttribute('action')?.includes('rewards.microsoft.com'))) {
          input = fallbackInput;
          logEvent('search', 'Using fallback search input');
        } else {
          logEvent('search', 'Fallback input form points to rewards, skipping');
        }
      } else if (fallbackInput) {
        logEvent('search', 'Search input found but appears to be in iframe or rewards iframe, skipping');
      }
    }
    
    // defensive interstitial detection right before navigating
    const inter = detectInterstitial();
    if (inter) {
      state.running = false; 
      isSearching = false;
      saveState(); 
      updateBadge(); 
      showNotification('🛑 Stopped: interstitial detected (' + inter + ').', 5000); 
      logEvent('stop', 'interstitial:' + inter); 
      return;
    }
    
    if (input) {
      maybeRotateUA();
      // simulate typing
      simulateTypingInto(input, randomWord).then(() => {
        const form = input.closest("form");
        if (form) {
          // Double-check form doesn't point to rewards
          const formAction = form.getAttribute('action') || '';
          if (formAction.includes('rewards.bing.com') || formAction.includes('rewards.microsoft.com')) {
            logEvent('search', 'Form action points to rewards, using direct navigation instead');
            isSearching = false;
            window.location.href = `https://www.bing.com/search?q=${encodeURIComponent(randomWord)}`;
            return;
          }
          isSearching = false; // Reset flag before navigation
          form.submit();
        } else {
          isSearching = false;
          // If no form found, try to find submit button or trigger search
          const submitBtn = document.querySelector('input[type="submit"][name="search"], button[type="submit"], #search_icon, .b_searchboxSubmit');
          if (submitBtn) {
            // Check if submit button is in a form that points to rewards
            const btnForm = submitBtn.closest('form');
            if (btnForm) {
              const formAction = btnForm.getAttribute('action') || '';
              if (formAction.includes('rewards.bing.com') || formAction.includes('rewards.microsoft.com')) {
                logEvent('search', 'Submit button form points to rewards, using direct navigation instead');
                window.location.href = `https://www.bing.com/search?q=${encodeURIComponent(randomWord)}`;
                return;
              }
            }
            submitBtn.click();
          } else {
            // Last resort: navigate directly but log it
            logEvent('search', 'No form found, using direct navigation');
            window.location.href = `https://www.bing.com/search?q=${encodeURIComponent(randomWord)}`;
          }
        }
      }).catch(() => { 
        const form = input.closest("form"); 
        if (form) {
          // Check form action before submitting
          const formAction = form.getAttribute('action') || '';
          if (formAction.includes('rewards.bing.com') || formAction.includes('rewards.microsoft.com')) {
            logEvent('search', 'Form action points to rewards, using direct navigation instead');
            isSearching = false;
            window.location.href = `https://www.bing.com/search?q=${encodeURIComponent(randomWord)}`;
          } else {
            isSearching = false;
            form.submit();
          }
        } else {
          isSearching = false;
          logEvent('search', 'Error in typing simulation, using direct navigation');
          window.location.href = `https://www.bing.com/search?q=${encodeURIComponent(randomWord)}`;
        }
      });
    } else {
      // No input found - this shouldn't happen on Bing, but handle gracefully
      // Try one more time to find the input after a short delay (page might still be loading)
      if (rewardsIframesFound > 0) {
        logEvent('search', `No main input found (${rewardsIframesFound} rewards iframe(s) detected), retrying after delay`);
      } else {
        logEvent('search', 'No search input found, retrying after delay');
      }
      const retryWord = randomWord; // Capture for retry
      const retryRewardsCount = rewardsIframesFound; // Capture for retry
      // Reset isSearching flag before scheduling retry to allow retry to proceed
      // The retry will set it again when it actually starts searching
      isSearching = false;
      setTimeout(() => {
        if (state.running && !isSearching) {
          // Retry finding input with same helper function logic (excluding rewards iframes)
          let retryInput = null;
          const retryInputs = document.querySelectorAll("input[name='q']");
          for (const inp of retryInputs) {
            // Use the same helper functions to check
            if (isInMainDocument(inp) && isNotInRewardsIframe(inp) && inp.offsetParent !== null) {
              const rect = inp.getBoundingClientRect();
              if (rect.width > 0 && rect.height > 0 && rect.width < window.innerWidth) {
                const style = window.getComputedStyle(inp);
                if (style.display !== 'none' && style.visibility !== 'hidden') {
                  // Check form action
                  const form = inp.closest('form');
                  if (!form || (!form.getAttribute('action')?.includes('rewards.bing.com') && !form.getAttribute('action')?.includes('rewards.microsoft.com'))) {
                    retryInput = inp;
                    break;
                  }
                }
              }
            }
          }
          
          if (retryInput) {
            logEvent('search', 'Found input on retry, proceeding');
            isSearching = true; // Set flag when actually starting the retry search
            maybeRotateUA();
            simulateTypingInto(retryInput, retryWord).then(() => {
              const form = retryInput.closest("form");
              if (form) {
                // Check form action before submitting
                const formAction = form.getAttribute('action') || '';
                if (formAction.includes('rewards.bing.com') || formAction.includes('rewards.microsoft.com')) {
                  logEvent('search', 'Retry form action points to rewards, using direct navigation instead');
                  isSearching = false;
                  window.location.href = `https://www.bing.com/search?q=${encodeURIComponent(retryWord)}`;
                  return;
                }
                isSearching = false;
                form.submit();
              } else {
                isSearching = false;
                const submitBtn = document.querySelector('input[type="submit"][name="search"], button[type="submit"], #search_icon, .b_searchboxSubmit');
                if (submitBtn) {
                  // Check if submit button is in a form that points to rewards
                  const btnForm = submitBtn.closest('form');
                  if (btnForm) {
                    const formAction = btnForm.getAttribute('action') || '';
                    if (formAction.includes('rewards.bing.com') || formAction.includes('rewards.microsoft.com')) {
                      logEvent('search', 'Retry submit button form points to rewards, using direct navigation instead');
                      window.location.href = `https://www.bing.com/search?q=${encodeURIComponent(retryWord)}`;
                      return;
                    }
                  }
                  submitBtn.click();
                } else {
                  logEvent('search', 'No form or submit button, using direct navigation');
                  window.location.href = `https://www.bing.com/search?q=${encodeURIComponent(retryWord)}`;
                }
              }
            }).catch(() => {
              isSearching = false;
              logEvent('search', 'Error in retry typing, using direct navigation');
              window.location.href = `https://www.bing.com/search?q=${encodeURIComponent(retryWord)}`;
            });
          } else {
            // Last resort: direct navigation (but log it and warn about iframes)
            if (retryRewardsCount > 0) {
              logEvent('search', `WARNING: No input found after retry, using direct navigation while ${retryRewardsCount} rewards iframe(s) present`);
            } else {
              logEvent('search', 'No search input found after retry, using direct navigation');
            }
            maybeRotateUA();
            isSearching = false;
            window.location.href = `https://www.bing.com/search?q=${encodeURIComponent(retryWord)}`;
          }
        } else {
          // State changed or already searching, don't proceed
          if (!state.running) {
            logEvent('search', 'Retry cancelled - automation stopped');
          } else if (isSearching) {
            logEvent('search', 'Retry cancelled - search already in progress');
          }
        }
      }, 1000);
      return; // Exit early, retry will handle the search
    }

    // Note: Timer will be set by checkAndResume() after page navigation completes
    // Don't set timer here as navigation interrupts it
  }

  function startAutomation() {
    if (state.running) {
      showNotification("⚠️ Already running!", 2000);
      return;
    }
    if (CONFIG.requireManualStart) {
      const ok = confirm('Manual start is enabled. Confirm to start automation.');
      if (!ok) return;
    }
    
    // Reset all flags
    isSearching = false;
    isResuming = false;
    browsingActive = false;
    
    // Clear any existing timers
    if (timerId) {
      clearTimeout(timerId);
      timerId = null;
    }
    if (countdownInterval) {
      clearInterval(countdownInterval);
      countdownInterval = null;
    }
    
    state.running = true;
    state.count = 0;
    saveState();
    updateBadge();
    showNotification("▶️ Starting Bing automation...", 2500);
    doSearch();
  }

  function stopAutomation() {
    state.running = false;
    isSearching = false;
    isResuming = false;
    browsingActive = false;
    pausedByVisibility = false;
    if (visibilityResumeTimer) {
      clearTimeout(visibilityResumeTimer);
      visibilityResumeTimer = null;
    }
    clearTimeout(timerId);
    timerId = null;
    clearInterval(countdownInterval);
    countdownInterval = null;
    nextDelay = 0;
    saveState();
    updateBadge();
    showNotification("⏹️ Automation stopped by user.", 2500);
  }

  // Resume if already running - check if we're on a search results page
  function checkAndResume() {
    // Guard against concurrent execution (but allow retry after a short delay)
    if (isResuming) {
      logEvent('resume', 'Already resuming, skipping');
      return;
    }

    // Only run on Bing pages
    if (!location.hostname.includes('bing.com')) {
      logEvent('resume', 'Not on Bing page');
      return;
    }

    // Don't resume if already searching (but this should be false after navigation)
    if (isSearching) {
      logEvent('resume', 'Search in progress, will retry');
      // Retry after a short delay
      setTimeout(() => {
        if (state.running && !isSearching) checkAndResume();
      }, 500);
      return;
    }

    // Don't resume if browsing mode is active (but allow retry)
    if (browsingActive) {
      logEvent('resume', 'Browsing active, will retry');
      setTimeout(() => {
        if (state.running && !browsingActive) checkAndResume();
      }, 1000);
      return;
    }

    // Check if we're in an overlay - try to close it first
    if (isInOverlay()) {
      logEvent('resume', 'Overlay detected, attempting to close');
      if (closeOverlays()) {
        // Retry after overlay closes
        setTimeout(() => {
          if (state.running && !isInOverlay()) checkAndResume();
        }, 500);
        return;
      }
      // If we can't close it, still try to resume (overlay might not block)
    }

    // Check if automation should be running
    if (!state.running) {
      logEvent('resume', 'Automation not running');
      return;
    }

    isResuming = true;

    // Safety: Reset isResuming after 5 seconds if something goes wrong
    const safetyTimeout = setTimeout(() => {
      if (isResuming && !timerId) {
        logEvent('resume', 'Safety timeout - resetting isResuming flag');
        isResuming = false;
      }
    }, 5000);

    // Check if we're on a search results page (has ?q= parameter)
    const isSearchResultsPage = /[?&]q=/.test(location.search);
    
    if (isSearchResultsPage) {
      // We're on a search results page and automation is running
      // Clear any existing timer first
      if (timerId) {
        clearTimeout(timerId);
        timerId = null;
      }
      
      // Calculate delay and continue
      let delay = randInt(CONFIG.minDelay, CONFIG.maxDelay);
      if (CONFIG.spreadMode) {
        delay += randInt(Math.max(CONFIG.minDelay, 60000), Math.max(CONFIG.maxDelay, 120000));
      }
      showNotification("🔄 Continuing automation...", 2500);
      logEvent('resume', 'Setting timer for next search: ' + delay + 'ms');
      startCountdown(Math.floor(delay / 1000));
      timerId = setTimeout(() => {
        clearTimeout(safetyTimeout);
        isResuming = false;
        if (state.running) {
          doSearch();
        } else {
          logEvent('resume', 'Timer fired but automation stopped');
        }
      }, delay);
    } else {
      // We're on the home page and automation is running, start immediately
      clearTimeout(safetyTimeout);
      showNotification("🔄 Resuming automation...", 2500);
      logEvent('resume', 'On home page, starting search immediately');
      isResuming = false;
      doSearch();
    }
  }

  // Resume if already running - multiple strategies to ensure it works
  function attemptResume() {
    // Only attempt if automation is running
    if (!state.running) {
      return;
    }

    // Try immediately if DOM is ready
    if (document.readyState === 'complete' || document.readyState === 'interactive') {
      setTimeout(checkAndResume, 200);
    } else {
      // Wait for DOM to be ready
      if (document.readyState === 'loading') {
        window.addEventListener('DOMContentLoaded', () => {
          setTimeout(checkAndResume, 200);
        }, { once: true });
      }
    }
    
    // Also try after full page load
    if (document.readyState !== 'complete') {
      window.addEventListener('load', () => {
        setTimeout(checkAndResume, 500);
      }, { once: true });
    }
    
    // Use MutationObserver to detect when search results are loaded
    if (location.hostname.includes('bing.com') && /[?&]q=/.test(location.search)) {
      const observer = new MutationObserver((mutations) => {
        // Check if search results container exists
        const resultsContainer = document.querySelector('#b_results, .b_results, #b_content');
        if (resultsContainer && state.running && !timerId && !isResuming) {
          logEvent('resume', 'Search results detected via MutationObserver');
          observer.disconnect();
          setTimeout(checkAndResume, 300);
        }
      });
      
      // Start observing
      observer.observe(document.body || document.documentElement, {
        childList: true,
        subtree: true
      });
      
      // Disconnect after 10 seconds to avoid memory leaks
      setTimeout(() => {
        observer.disconnect();
      }, 10000);
    }
    
    // Fallback: check periodically if automation should be running
    // This ensures we catch cases where event listeners might miss
    let retryCount = 0;
    const maxRetries = 15;
    const retryInterval = setInterval(() => {
      retryCount++;
      if (retryCount > maxRetries) {
        clearInterval(retryInterval);
        return;
      }
      
      // Only retry if automation is running but no timer is set
      if (state.running && !timerId && !isResuming && !isSearching && !browsingActive) {
        const isSearchResultsPage = location.hostname.includes('bing.com') && /[?&]q=/.test(location.search);
        if (isSearchResultsPage) {
          logEvent('resume', 'Fallback retry attempt ' + retryCount);
          checkAndResume();
          clearInterval(retryInterval);
        } else if (!isSearchResultsPage && state.running) {
          // On home page, start immediately
          logEvent('resume', 'On home page, starting search');
          checkAndResume();
          clearInterval(retryInterval);
        }
      } else if (!state.running) {
        clearInterval(retryInterval);
      }
    }, 1000);
  }

  // Start resume attempts
  attemptResume();

  // Browsing mode behavior: if enabled and this is a bing search results page
  (function setupBrowsingHook() {
    if (!CONFIG.browsingMode) return;
    // Only act on search results pages
    function isSearchPage() {
      return location.hostname.includes('bing.com') && /[?&]q=/.test(location.search);
    }
    if (!isSearchPage()) return;

    // Avoid running on pages that were opened directly by clicking a result
    // and ensure automation is running
    if (!state.running) return;

    // Don't browse if already browsing or searching
    if (browsingActive || isSearching) return;

    // Don't browse if in overlay
    if (isInOverlay()) return;

    // Run after short delay to allow results to render
    setTimeout(() => {
      // Double-check conditions before proceeding
      if (!state.running || browsingActive || isSearching || isInOverlay()) {
        return;
      }

      try {
        browsingActive = true;
        
        // pick first organic result anchor
        const selectors = ['#b_results .b_algo a', '.b_algo a'];
        let anchor = null;
        for (const s of selectors) { 
          const el = document.querySelector(s); 
          if (el && el.offsetParent !== null) { // Check if visible
            anchor = el; 
            break; 
          } 
        }
        if (!anchor) { 
          browsingActive = false;
          logEvent('browse', 'no-anchor-found'); 
          return; 
        }

        // open link in same tab (simulate click)
        logEvent('browse', 'opening first result');
        anchor.click();

        // dwell for randomized seconds then go back
        const dwell = randInt(CONFIG.browseDwellMin, CONFIG.browseDwellMax) * 1000;
        setTimeout(() => {
          try { 
            if (state.running) {
              history.back(); 
              logEvent('browse', 'returned after dwell');
              // Reset browsing flag after a delay to allow navigation
              setTimeout(() => {
                browsingActive = false;
              }, 1000);
            } else {
              browsingActive = false;
            }
          } catch (e) { 
            browsingActive = false;
            logEvent('browse', 'return-failed:' + e.message); 
          }
        }, dwell);
      } catch (e) { 
        browsingActive = false;
        logEvent('browse', 'error:' + e.message); 
      }
    }, randInt(1200, 2600));
  })();

  // Keybinds
  document.addEventListener("keydown", (e) => {
    if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === "c") {
      startAutomation();
    }
    if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === "x") {
      stopAutomation();
    }
  });

  showNotification("🎛️ Bing Automation ready. Ctrl+Shift+C to start, Ctrl+Shift+X to stop.");

  // Final fallback: If automation is running, ensure we attempt to resume
  // This catches any edge cases where the normal resume mechanisms might fail
  if (state.running && location.hostname.includes('bing.com')) {
    // Give the page a moment to fully load, then check
    setTimeout(() => {
      if (state.running && !timerId && !isResuming) {
        logEvent('resume', 'Final fallback - attempting resume');
        checkAndResume();
      }
    }, 2000);
  }

})();