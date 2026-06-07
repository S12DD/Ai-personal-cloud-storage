import React, { useState, useEffect } from 'react'
import axios from 'axios'
import './styles.css'
import Login from './components/Login'
import Register from './components/Register'
import FileExplorer from './components/FileExplorer'
import FileUpload from './components/FileUpload'

const API = import.meta.env.VITE_API_URL || 'http://localhost:8000'

export default function App() {
  const [token, setToken] = useState(localStorage.getItem('token') || '')
  const [user, setUser] = useState(null)
  const [page, setPage] = useState('login')
  const [files, setFiles] = useState([])
  const [folders, setFolders] = useState([])
  const [selectedFolder, setSelectedFolder] = useState(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (token) {
      setPage('files')
      fetchFiles()
      loadFolders()
    }
  }, [token])

  const fetchFiles = async () => {
    setLoading(true)
    try {
      const res = await axios.get(`${API}/files/list`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      setFiles(res.data.files || [])
    } catch (e) {
      console.error('Error fetching files:', e)
      if (e.response?.status === 401) logout()
    } finally {
      setLoading(false)
    }
  }

  const loadFolders = async () => {
    try {
      const res = await axios.get(`${API}/folders/list`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      setFolders(res.data.folders || [])
    } catch (e) {
      console.error('Error loading folders:', e)
    }
  }

  const createFolder = async () => {
    const name = prompt('Folder name')
    if (!name) return

    try {
      await axios.post(
        `${API}/folders/create`,
        { name },
        { headers: { Authorization: `Bearer ${token}` } }
      )
      loadFolders()
    } catch (e) {
      alert('Folder create failed: ' + (e.response?.data?.detail || e.message))
    }
  }

  const moveFileToFolder = async (fileId, folderId) => {
    try {
      await axios.put(
        `${API}/files/${fileId}/move`,
        { folderId },
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      )

      fetchFiles()
      alert('File moved successfully')
    } catch (e) {
      alert('Move failed: ' + (e.response?.data?.detail || e.message))
    }
  }

  const handleLogin = (newToken) => {
    setToken(newToken)
    localStorage.setItem('token', newToken)
  }

  const handleRegister = (newToken) => {
    setToken(newToken)
    localStorage.setItem('token', newToken)
  }

  const logout = () => {
    setToken('')
    localStorage.removeItem('token')
    setUser(null)
    setPage('login')
    setFiles([])
    setFolders([])
    setSelectedFolder(null)
  }

  if (!token) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-100">
        {page === 'login' ? (
          <Login onLogin={handleLogin} onSwitchPage={() => setPage('register')} />
        ) : (
          <Register onRegister={handleRegister} onSwitchPage={() => setPage('login')} />
        )}
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-100">
      <div className="flex">

        <aside className="hidden md:flex w-72 min-h-screen bg-slate-950 text-white flex-col p-6">
          <div className="mb-8">
            <div className="text-3xl font-bold">☁️ AI Cloud</div>
            <p className="text-slate-400 text-sm mt-2">Personal storage dashboard</p>
          </div>

          <nav className="space-y-3">
            <button
              onClick={() => setSelectedFolder(null)}
              className={`w-full text-left px-4 py-3 rounded-xl font-medium ${
                selectedFolder === null ? 'bg-blue-600 text-white' : 'text-slate-300 hover:bg-slate-900'
              }`}
            >
              📁 All Files
            </button>

            <div className="px-4 py-3 rounded-xl text-slate-300">
              📤 Uploads
            </div>

            <div className="px-4 py-3 rounded-xl text-slate-300">
              🔗 Shared Files
            </div>

            <div className="px-4 py-3 rounded-xl text-slate-300">
              🤖 AI Summary
            </div>
          </nav>

          <div className="mt-8">
            <div className="flex items-center justify-between mb-3">
              <p className="text-slate-400 text-sm font-semibold">Folders</p>
              <button
                onClick={createFolder}
                className="text-xs bg-blue-600 hover:bg-blue-700 px-3 py-1 rounded-lg"
              >
                + New
              </button>
            </div>

            <div className="space-y-2">
              {folders.length === 0 ? (
                <p className="text-slate-500 text-sm px-2">No folders yet</p>
              ) : (
                folders.map(folder => (
                  <button
                    key={folder.folderId}
                    onClick={() => setSelectedFolder(folder.folderId)}
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={(e) => {
                        e.preventDefault()

                      const fileId =
                        e.dataTransfer.getData('fileId')

                        console.log(
                         'Dropped:',
                          fileId,
                          'Folder:',
                          folder.folderId
                        )

                        if (fileId) {
                            moveFileToFolder(
                            fileId,
                            folder.folderId
                          )
                        }
                      }}
                    className={`w-full text-left px-4 py-3 rounded-xl ${
                      selectedFolder === folder.folderId
                      ? 'bg-blue-600 text-white'
                      : 'text-slate-300 hover:bg-slate-900'
                    }`}
                  >
                    📂 {folder.name}
                  </button>
                ))
              )}
            </div>
          </div>

          <div className="mt-auto bg-slate-900 rounded-2xl p-4">
            <p className="text-sm text-slate-400">Resume Project</p>
            <p className="font-semibold mt-1">React + FastAPI</p>
          </div>
        </aside>

        <main className="flex-1 min-h-screen">
          <header className="bg-white border-b sticky top-0 z-10">
            <div className="px-6 py-5 flex justify-between items-center">
              <div>
                <h1 className="text-3xl font-bold text-slate-900">
                  Personal Cloud Storage
                </h1>
                <p className="text-slate-500 text-sm mt-1">
                  Upload, manage, share and organize your files securely.
                </p>
              </div>

              <div className="flex items-center gap-4">
                <button
                  onClick={fetchFiles}
                  disabled={loading}
                  className="px-5 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:bg-gray-400 transition font-medium"
                >
                  {loading ? 'Refreshing...' : 'Refresh'}
                </button>

                <button
                  onClick={logout}
                  className="px-5 py-3 bg-red-600 text-white rounded-xl hover:bg-red-700 transition font-medium"
                >
                  Logout
                </button>
              </div>
            </div>
          </header>

          <div className="p-6 space-y-6">
            <section className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-3xl p-8 text-white shadow-lg">
              <h2 className="text-3xl font-bold">
                {selectedFolder
                  ? `Folder View 📂`
                  : 'Welcome back 👋'}
              </h2>
              <p className="mt-2 text-blue-100 max-w-2xl">
                Manage files, preview documents, create folders and organize your cloud like Google Drive.
              </p>
            </section>

            <section className="bg-white rounded-3xl shadow-sm border border-slate-200 p-6">
              <div className="mb-5">
                <h2 className="text-2xl font-bold text-slate-900">Upload Files</h2>
                <p className="text-slate-500 text-sm">
                  Add documents, images, PDFs and other files to your cloud storage.
                </p>
              </div>

              <FileUpload token={token} onUploadSuccess={fetchFiles} API={API} />
            </section>

            <FileExplorer
              files={files}
              token={token}
              onFileDelete={fetchFiles}
              API={API}
              selectedFolder={selectedFolder}
              onFileMove={moveFileToFolder}
            />
          </div>
        </main>
      </div>
    </div>
  )
}