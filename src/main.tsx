import React from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { Provider } from 'react-redux'
import store from './store/store'
import App from './App'
import 'bootstrap/dist/css/bootstrap.min.css'
// Uncomment the line below after installing react-toastify: npm install react-toastify
// import 'react-toastify/dist/ReactToastify.css'
// import './styles.css'

createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Provider store={store}>
      <BrowserRouter
        future={{
          v7_startTransition: true,
          v7_relativeSplatPath: true,
        }}
      >
        <App />
      </BrowserRouter>
    </Provider>
  </React.StrictMode>,
)
