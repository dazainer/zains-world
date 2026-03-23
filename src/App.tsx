import { BrowserRouter, Routes, Route } from 'react-router-dom'
import GameCanvas from './components/GameCanvas'
import StaticPortfolio from './components/StaticPortfolio'
import SkipToPortfolio from './components/SkipToPortfolio'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/"
          element={
            <>
              <GameCanvas />
              <SkipToPortfolio />
            </>
          }
        />
        <Route path="/portfolio" element={<StaticPortfolio />} />
      </Routes>
    </BrowserRouter>
  )
}
