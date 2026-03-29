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
    note: 'Read this at 11. Taught me that the best stories come from real life.',
    color: '#8B4513',
  },
  {
    id: 'fahrenheit-451',
    title: 'Fahrenheit 451',
    author: 'Ray Bradbury',
    note: 'Made me realize that curiosity is an act of rebellion, and changed my outlook on knowledge as a whole.',
    color: '#CC3300',
  },
  {
    id: 'purple-hibiscus',
    title: 'Purple Hibiscus',
    author: 'Chimamanda Ngozi Adichie',
    note: 'Changed how I think about quiet strength and how easy it is to miss.',
    color: '#6B3FA0',
  },
  {
    id: 'da-vinci-code',
    title: 'The Da Vinci Code',
    author: 'Dan Brown',
    note: 'One of the reasons I got hooked on puzzles and hidden patterns.',
    color: '#1a3c5e',
  },
]
