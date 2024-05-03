import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import reportAccessibility from './lib/reportAccessibility'

import './index.css'
import './typography.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)

reportAccessibility(React)