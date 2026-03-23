export interface Book {
  id: string
  title: string
  author: string
  note: string
  color: string
}

export const books: Book[] = [
  {
    id: 'going-solo',
    title: 'Going Solo',
    author: 'Roald Dahl',
    note: 'Read this at 11. Taught me that the best stories come from real life, told sideways.',
    color: '#8B4513',
  },
  {
    id: 'fahrenheit-451',
    title: 'Fahrenheit 451',
    author: 'Ray Bradbury',
    note: 'Made me realize that curiosity is an act of rebellion.',
    color: '#CC3300',
  },
  {
    id: 'purple-hibiscus',
    title: 'Purple Hibiscus',
    author: 'Chimamanda Ngozi Adichie',
    note: 'Changed how I think about quiet strength.',
    color: '#6B3FA0',
  },
  {
    id: 'da-vinci-code',
    title: 'The Da Vinci Code',
    author: 'Dan Brown',
    note: 'The reason I got hooked on puzzles and hidden patterns.',
    color: '#1a3c5e',
  },
]
