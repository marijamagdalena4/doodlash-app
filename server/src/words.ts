export const WORDS: string[] = [
  'rainbow', 'volcano', 'skateboard', 'homework', 'thunderstorm', 'elephant',
  'karate', 'basketball', 'sunflower', 'submarine', 'trampoline', 'penguin',
  'guitar', 'pizza', 'dragon', 'castle', 'robot', 'pirate', 'wizard', 'unicorn',
  'dinosaur', 'rocket', 'panda', 'tiger', 'dolphin', 'octopus', 'butterfly',
  'cactus', 'lighthouse', 'snowman', 'campfire', 'backpack', 'sandwich',
  'pancake', 'cupcake', 'donut', 'cookie', 'popcorn', 'nachos', 'taco',
  'sushi', 'noodle', 'waffle', 'muffin', 'pretzel', 'avocado', 'banana',
  'cherry', 'grapes', 'lemon', 'mango', 'orange', 'peach', 'strawberry',
  'watermelon', 'coconut', 'pineapple', 'broccoli', 'carrot', 'pumpkin',
  'tomato', 'potato', 'onion', 'garlic', 'pepper', 'mushroom', 'lettuce',
  'cucumber', 'celery', 'spinach', 'corn', 'peas', 'beans', 'rice', 'bread',
  'cheese', 'butter', 'honey', 'syrup', 'salt', 'sugar', 'flour', 'egg',
  'milk', 'juice', 'coffee', 'tea', 'soda', 'water', 'ice', 'fire', 'wind',
  'cloud', 'storm', 'lightning', 'snow', 'rain', 'fog', 'mist', 'hail',
  'tornado', 'hurricane', 'earthquake', 'avalanche', 'flood', 'drought',
  'forest', 'jungle', 'desert', 'ocean', 'river', 'lake', 'pond', 'stream',
  'waterfall', 'mountain', 'hill', 'valley', 'canyon', 'cave', 'island',
  'beach', 'coast', 'cliff', 'reef', 'wave', 'tide', 'shell', 'coral',
  'starfish', 'jellyfish', 'shark', 'whale', 'seal', 'otter', 'beaver',
  'squirrel', 'rabbit', 'mouse', 'rat', 'hamster', 'guinea pig', 'ferret',
  'hedgehog', 'porcupine', 'raccoon', 'skunk', 'fox', 'wolf', 'coyote',
  'bear', 'moose', 'deer', 'elk', 'bison', 'buffalo', 'horse', 'donkey',
  'zebra', 'giraffe', 'hippo', 'rhino', 'camel', 'llama', 'alpaca', 'goat',
  'sheep', 'pig', 'cow', 'chicken', 'duck', 'goose', 'turkey', 'eagle',
  'hawk', 'owl', 'parrot', 'crow', 'raven', 'sparrow', 'robin', 'pigeon',
  'flamingo', 'peacock', 'ostrich', 'emu', 'kiwi', 'bat', 'snake', 'lizard',
  'gecko', 'chameleon', 'turtle', 'tortoise', 'crocodile', 'alligator',
  'frog', 'toad', 'salamander', 'newt', 'fish', 'goldfish', 'clownfish',
  'ice cream', 'birthday cake', 'solar system', 'pizza delivery', 'space rocket',
  'haunted house', 'magic wand', 'hot dog', 'french fries', 'chocolate chip',
  'peanut butter', 'apple pie', 'banana split', 'fruit salad', 'chicken soup',
  'grilled cheese', 'fried egg', 'scrambled eggs', 'bacon strips', 'maple syrup',
  'pancake stack', 'waffle iron', 'coffee mug', 'tea kettle', 'water bottle',
  'sports car', 'school bus', 'fire truck', 'police car', 'ambulance', 'taxi cab',
  'train station', 'airplane hangar', 'helicopter pad', 'sailboat race',
  'mountain climb', 'rock climbing', 'ice skating', 'roller skating', 'snow boarding',
  'surf board', 'swim suit', 'beach ball', 'volley ball', 'foot ball', 'base ball',
  'tennis racket', 'golf club', 'bowling alley', 'boxing ring', 'wrestling match',
  'video game', 'board game', 'card game', 'chess match', 'checkers board',
  'jigsaw puzzle', 'coloring book', 'story book', 'comic book', 'picture frame',
  'wall clock', 'alarm clock', 'desk lamp', 'floor lamp', 'ceiling fan',
  'air conditioner', 'washing machine', 'dish washer', 'vacuum cleaner',
  'tooth brush', 'hair brush', 'shower cap', 'bath tub', 'kitchen sink',
  'living room', 'dining room', 'bed room', 'bath room', 'garage door',
  'front porch', 'back yard', 'tree house', 'dog house', 'bird house',
  'flower pot', 'garden hose', 'lawn mower', 'leaf blower', 'snow shovel',
  'rain coat', 'winter coat', 'summer hat', 'winter hat', 'running shoes',
  'high heels', 'flip flops', 'swim goggles', 'sunglasses', 'reading glasses',
  'pencil case', 'back pack', 'lunch box', 'report card', 'science fair',
  'music class', 'art studio', 'dance party', 'movie night', 'game night',
  'sleep over', 'road trip', 'camping trip', 'fishing trip', 'ski resort',
  'amusement park', 'water park', 'zoo visit', 'museum tour', 'library card',
  'treasure map', 'pirate ship', 'knight armor', 'princess crown', 'fairy tale',
  'super hero', 'secret agent', 'time machine', 'flying carpet', 'crystal ball',
  'magic spell', 'dragon fire', 'ghost story', 'monster truck', 'alien invasion',
];

export function pickWord(usedWords: string[]): string {
  const available = WORDS.filter((w) => !usedWords.includes(w));
  const pool = available.length > 0 ? available : WORDS;
  return pool[Math.floor(Math.random() * pool.length)];
}

export function buildHintStructure(word: string, revealedIndices: number[] = []): {
  display: string;
  wordLengths: number[];
  totalLetters: number;
  revealedIndices: number[];
  letterIndices: { index: number; letter: string }[];
} {
  const parts = word.split(' ');
  const wordLengths = parts.map((p) => p.length);
  const letters: { index: number; letter: string }[] = [];
  let globalIndex = 0;

  const displayParts = parts.map((part) => {
    const chars = part.split('').map((ch) => {
      const entry = { index: globalIndex, letter: ch };
      letters.push(entry);
      const show = revealedIndices.includes(globalIndex);
      globalIndex++;
      return show ? ch.toUpperCase() : '_';
    });
    return chars.join(' ');
  });

  return {
    display: displayParts.join('   '),
    wordLengths,
    totalLetters: letters.length,
    revealedIndices: [...revealedIndices],
    letterIndices: letters,
  };
}
