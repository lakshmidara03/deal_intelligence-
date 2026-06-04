import React from 'react'
import ReactDOM from 'react-dom/client'
import DealDriversManagerView from './components/manager/DealDriversManagerView'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <div className="min-h-screen bg-gray-50">
      <DealDriversManagerView />
    </div>
  </React.StrictMode>,
)
