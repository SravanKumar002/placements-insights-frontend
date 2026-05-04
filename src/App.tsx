import { BrowserRouter } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import { AppWithAuthTokenRedirect } from './routes'

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppWithAuthTokenRedirect />
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App
