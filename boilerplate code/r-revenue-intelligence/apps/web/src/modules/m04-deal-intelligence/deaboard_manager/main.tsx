import React from 'react'
import ReactDOM from 'react-dom/client'
import DealBoardsManagerView from './DealBoardsManagerView'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <div className="min-h-screen bg-gray-50">
      <DealBoardsManagerView />
    </div>
  </React.StrictMode>,
)
