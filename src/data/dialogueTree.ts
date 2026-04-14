export interface DialogueChoice {
  label: string
  nextId: string
}

export interface DialogueNode {
  id: string
  speaker: 'mummy' | 'player'
  text: string
  choices?: DialogueChoice[]
  nextId?: string
}

export const mummyDialogueTree: Record<string, DialogueNode> = {
  root: {
    id: 'root',
    speaker: 'mummy',
    text: "Ah, a visitor! Welcome to Zain's World. I've been guarding this place for... an embarrassingly long time. Ask, and I shall guide you.",
    choices: [
      { label: 'Who are you?', nextId: 'player-who' },
      { label: 'What is this place?', nextId: 'player-place' },
      { label: "I'm a recruiter looking at his work", nextId: 'player-recruiter' },
      { label: "Let's play a game!", nextId: 'player-game' },
    ],
  },
  'player-who': {
    id: 'player-who',
    speaker: 'player',
    text: 'Who are you?',
    nextId: 'mummy-who',
  },
  'mummy-who': {
    id: 'mummy-who',
    speaker: 'mummy',
    text: "I am the Keeper of these grounds. Zain built this world and left me here to guide travelers. I know every corner, every secret, and every suspiciously loose stone.",
    choices: [
      { label: 'Tell me about Zain', nextId: 'player-zain' },
      { label: 'What should I explore first?', nextId: 'player-explore' },
      { label: 'Back', nextId: 'root' },
    ],
  },
  'player-zain': {
    id: 'player-zain',
    speaker: 'player',
    text: 'Tell me about Zain.',
    nextId: 'mummy-zain',
  },
  'mummy-zain': {
    id: 'mummy-zain',
    speaker: 'mummy',
    text: "Zain is a CS/BBA student at the University of Waterloo who likes building backend systems and applied AI tools. He grew up in Cairo, which is why this whole world looks like it was approved by a very dramatic desert architect. He wants each building to show a different side of his work, and if you ever get turned around, press M for the map instead of pretending you meant to walk in circles.",
    choices: [
      { label: 'What should I explore first?', nextId: 'player-explore' },
      { label: 'Back', nextId: 'mummy-who' },
    ],
  },
  'player-explore': {
    id: 'player-explore',
    speaker: 'player',
    text: 'What should I explore first?',
    nextId: 'mummy-explore',
  },
  'mummy-explore': {
    id: 'mummy-explore',
    speaker: 'mummy',
    text: "If you want projects, head north to the temple. If you want experience, the tower to the west will do nicely. If you're feeling nosy... the world rewards nosy people. Press M if you want the map instead of relying on my ancient hand gestures.",
    choices: [
      { label: 'Back to the start', nextId: 'root' },
    ],
  },
  'player-place': {
    id: 'player-place',
    speaker: 'player',
    text: 'What is this place?',
    nextId: 'mummy-place',
  },
  'mummy-place': {
    id: 'mummy-place',
    speaker: 'mummy',
    text: "This is Zain's portfolio, but mercifully not the boring kind. The temple to the north holds projects. The tower to the west holds experience. The hut to the south handles contact. Press M anytime if you want the map to confirm where everything lives.",
    choices: [
      { label: 'Where are the projects?', nextId: 'player-projects' },
      { label: 'Is there anything hidden here?', nextId: 'player-hidden' },
      { label: 'Back', nextId: 'root' },
    ],
  },
  'player-projects': {
    id: 'player-projects',
    speaker: 'player',
    text: 'Where are the projects?',
    nextId: 'mummy-projects',
  },
  'mummy-projects': {
    id: 'mummy-projects',
    speaker: 'mummy',
    text: "Head north to the Projects Lab. He's built some genuinely impressive things in there. SpecGuard is the one I brag about when the torches are listening. If you lose your bearings, press M and the map will point you straight there.",
    choices: [
      { label: 'Back', nextId: 'mummy-place' },
    ],
  },
  'player-hidden': {
    id: 'player-hidden',
    speaker: 'player',
    text: 'Is there anything hidden here?',
    nextId: 'mummy-hidden',
  },
  'mummy-hidden': {
    id: 'mummy-hidden',
    speaker: 'mummy',
    text: "Hidden? Me? Know about hidden things? Impossible. Preposterous. I certainly haven't noticed anything odd around the sphinx. Especially not anything worth investigating closely.",
    choices: [
      { label: 'Back', nextId: 'mummy-place' },
    ],
  },
  'player-recruiter': {
    id: 'player-recruiter',
    speaker: 'player',
    text: "I'm a recruiter looking at his work.",
    nextId: 'mummy-recruiter',
  },
  'mummy-recruiter': {
    id: 'mummy-recruiter',
    speaker: 'mummy',
    text: 'Excellent taste. Let me give you the efficient tour before another traveler asks me where the bathroom is.',
    choices: [
      { label: 'Show me his best project', nextId: 'player-best-project' },
      { label: "What's his tech stack?", nextId: 'player-stack' },
      { label: 'How do I contact him?', nextId: 'player-contact' },
      { label: 'Back', nextId: 'root' },
    ],
  },
  'player-best-project': {
    id: 'player-best-project',
    speaker: 'player',
    text: 'Show me his best project.',
    nextId: 'mummy-best-project',
  },
  'mummy-best-project': {
    id: 'mummy-best-project',
    speaker: 'mummy',
    text: "Head north to the temple. SpecGuard is his flagship: AI-assisted test generation with a real product instinct behind it. I'm not saying I framed it in my tomb, but I'm considering it.",
    choices: [
      { label: 'Back', nextId: 'mummy-recruiter' },
    ],
  },
  'player-stack': {
    id: 'player-stack',
    speaker: 'player',
    text: "What's his tech stack?",
    nextId: 'mummy-stack',
  },
  'mummy-stack': {
    id: 'mummy-stack',
    speaker: 'mummy',
    text: 'Python and TypeScript are his strongest tools. The pyramid to the northwest breaks down the rest of the stack if you want the shelf-by-shelf version.',
    choices: [
      { label: 'Back', nextId: 'mummy-recruiter' },
    ],
  },
  'player-contact': {
    id: 'player-contact',
    speaker: 'player',
    text: 'How do I contact him?',
    nextId: 'mummy-contact',
  },
  'mummy-contact': {
    id: 'mummy-contact',
    speaker: 'mummy',
    text: 'The hut to the south has his contact portal. Or, if you prefer the direct method, email z7khalil@uwaterloo.ca. He replies faster than I emerge from a sarcophagus. Press M if you want the map to guide you there first.',
    choices: [
      { label: 'Back', nextId: 'mummy-recruiter' },
    ],
  },
  'player-game': {
    id: 'player-game',
    speaker: 'player',
    text: "Let's play a game!",
    nextId: 'mummy-game',
  },
  'mummy-game': {
    id: 'mummy-game',
    speaker: 'mummy',
    text: "Oh, you're one of THOSE visitors. I like you already. Head to the sphinx in the southwest. If you can find the entrance, there's a whole little arcade hidden inside. Press M if you need help getting there. Try not to lose too loudly.",
    choices: [
      { label: 'Back to the start', nextId: 'root' },
    ],
  },
}
