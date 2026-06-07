import React, { useState } from 'react'
import FileRow from './FileRow'

export default function FileExplorer({ files, token, onFileDelete, API, selectedFolder, onFileMove }) {
  const [searchTerm, setSearchTerm] = useState('')
  const [viewMode, setViewMode] = useState('grid')
  const [selectedFiles, setSelectedFiles] = useState(new Set())

  const filteredFiles = files.filter(file => {

  const matchesSearch =
    file.fileName?.toLowerCase()
      .includes(searchTerm.toLowerCase())

  const matchesFolder =
    !selectedFolder ||
    file.folderId === Number(selectedFolder)

  return matchesSearch && matchesFolder
})

  const totalSize = files.reduce((sum, file) => sum + (file.fileSize || file.size || 0), 0)
  const imageCount = files.filter(file => file.mimeType?.startsWith('image/')).length
  const pdfCount = files.filter(file => file.mimeType?.includes('pdf')).length

  const toggleSelectFile = (fileId) => {
    const newSelected = new Set(selectedFiles)
    newSelected.has(fileId) ? newSelected.delete(fileId) : newSelected.add(fileId)
    setSelectedFiles(newSelected)
  }

  const getFileIcon = (mimeType = '') => {
    if (mimeType.startsWith('image/')) return '🖼️'
    if (mimeType.startsWith('video/')) return '🎬'
    if (mimeType.startsWith('audio/')) return '🎵'
    if (mimeType.includes('pdf')) return '📄'
    if (mimeType.includes('text') || mimeType.includes('plain')) return '📝'
    return '📎'
  }

  const formatFileSize = (bytes = 0) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i]
  }

  if (files.length === 0) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
        <div className="text-5xl mb-4">☁️</div>
        <h3 className="text-xl font-semibold text-gray-800">No files yet</h3>
        <p className="text-gray-500 mt-2">Upload your first file to start building your cloud storage.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-5 shadow-sm border">
          <p className="text-gray-500 text-sm">Total Files</p>
          <h2 className="text-3xl font-bold text-gray-900">{files.length}</h2>
        </div>

        <div className="bg-white rounded-2xl p-5 shadow-sm border">
          <p className="text-gray-500 text-sm">Images</p>
          <h2 className="text-3xl font-bold text-gray-900">{imageCount}</h2>
        </div>

        <div className="bg-white rounded-2xl p-5 shadow-sm border">
          <p className="text-gray-500 text-sm">PDFs</p>
          <h2 className="text-3xl font-bold text-gray-900">{pdfCount}</h2>
        </div>

        <div className="bg-white rounded-2xl p-5 shadow-sm border">
          <p className="text-gray-500 text-sm">Storage Used</p>
          <h2 className="text-3xl font-bold text-gray-900">{formatFileSize(totalSize)}</h2>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border p-5">
        <div className="flex flex-col md:flex-row gap-4 md:items-center md:justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">My Files</h2>
            <p className="text-gray-500 text-sm">Manage, search and organize your uploaded files.</p>
          </div>

          <button
            onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
            className="px-5 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition font-medium"
          >
            {viewMode === 'grid' ? 'List View' : 'Grid View'}
          </button>
        </div>

        <input
          type="text"
          placeholder="🔍 Search files..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full mb-6 px-5 py-3 border border-gray-200 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />

        {filteredFiles.length === 0 ? (
          <div className="text-center py-10 text-gray-500">
            No file found for "{searchTerm}"
          </div>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredFiles.map((file) => (
              <FileRow
                key={file.fileId}
                file={file}
                token={token}
                onFileDelete={onFileDelete}
                API={API}
                getFileIcon={getFileIcon}
                formatFileSize={formatFileSize}
                isSelected={selectedFiles.has(file.fileId)}
                onToggleSelect={toggleSelectFile}
                gridMode={true}
              />
            ))}
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Name</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Size</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Status</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Uploaded</th>
                  <th className="px-6 py-4 text-right text-sm font-semibold text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredFiles.map((file) => (
                  <FileRow
                    key={file.fileId}
                    file={file}
                    token={token}
                    onFileDelete={onFileDelete}
                    API={API}
                    getFileIcon={getFileIcon}
                    formatFileSize={formatFileSize}
                    isSelected={selectedFiles.has(file.fileId)}
                    onToggleSelect={toggleSelectFile}
                    gridMode={false}
                  />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}