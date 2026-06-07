import React, { useState } from 'react'
import axios from 'axios'

export default function FileUpload({ token, onUploadSuccess, API }) {
  const [file, setFile] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [progress, setProgress] = useState(0)

  const handleFileChange = (e) => {
    setFile(e.target.files[0])
    setError('')
    setSuccess('')
  }

  const handleUpload = async (e) => {
    e.preventDefault()
    if (!file) {
      setError('Please select a file')
      return
    }

    setLoading(true)
    setError('')
    setSuccess('')
    setProgress(0)

    try {
      const formData = new FormData()
      formData.append('file', file)

      const res = await axios.post(`${API}/files/upload`, formData, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        },
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          )
          setProgress(percentCompleted)
        }
      })

      setSuccess(`File "${file.name}" uploaded successfully!`)
      setFile(null)
      setProgress(0)
      
      // Reset file input
      const fileInput = document.querySelector('input[type="file"]')
      if (fileInput) fileInput.value = ''

      // Refresh file list
      setTimeout(onUploadSuccess, 1000)
    } catch (e) {
      setError(e.response?.data?.detail || 'Upload failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="w-full">
      {error && (
        <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}

      {success && (
        <div className="mb-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded">
          {success}
        </div>
      )}

      <form onSubmit={handleUpload} className="space-y-4">
        <div className="flex items-center justify-center w-full">
          <label className="flex flex-col items-center justify-center w-full h-64 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 transition">
            <div className="flex flex-col items-center justify-center pt-5 pb-6">
              <svg
                className="w-10 h-10 text-gray-400 mb-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4v16m8-8H4"
                />
              </svg>
              <p className="mb-2 text-sm text-gray-500">
                <span className="font-semibold">Click to upload</span> or drag and drop
              </p>
              <p className="text-xs text-gray-500">
                {file ? file.name : 'PNG, JPG, GIF, PDF, etc.'}
              </p>
            </div>
            <input
              type="file"
              onChange={handleFileChange}
              className="hidden"
              disabled={loading}
            />
          </label>
        </div>

        {progress > 0 && progress < 100 && (
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
        )}

        <button
          type="submit"
          disabled={loading || !file}
          className="w-full px-4 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 transition font-medium"
        >
          {loading ? `Uploading (${progress}%)...` : 'Upload File'}
        </button>
      </form>
    </div>
  )
}
