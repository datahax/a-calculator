import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.scss'
import 'modern-normalize'
import '@fontsource/space-mono/400.css'
import '@fontsource/space-mono/700.css'

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
