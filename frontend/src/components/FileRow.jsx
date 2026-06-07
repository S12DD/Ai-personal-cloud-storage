import React, { useState } from 'react'
import axios from 'axios'

export default function FileRow({
  file,
  token,
  onFileDelete,
  API,
  getFileIcon,
  formatFileSize,
  isSelected,
  onToggleSelect,
  gridMode,
  onFileMove
}) {
  const [loading, setLoading] = useState(false)
  const [showShare, setShowShare] = useState(false)
  const [shareUrl, setShareUrl] = useState('')
  const [copied, setCopied] = useState(false)
  const [showPreview, setShowPreview] = useState(false)
  const [showRename, setShowRename] = useState(false)
  const [newFileName, setNewFileName] = useState(file.fileName)
  const [showInsights, setShowInsights] = useState(false)
  const [metadata, setMetadata] = useState(null)

  const encodedToken = encodeURIComponent(token || '')
  const previewUrl = `${API}/files/preview/${file.fileId}?token=${encodedToken}`
  const downloadUrl = `${API}/files/download/${file.fileId}?token=${encodedToken}`

  const handleDelete = async () => {
    if (!window.confirm(`Delete "${file.fileName}"?`)) return

    setLoading(true)
    try {
      await axios.delete(`${API}/files/${file.fileId}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      onFileDelete()
    } catch (e) {
      alert('Delete failed: ' + (e.response?.data?.detail || e.message))
    } finally {
      setLoading(false)
    }
  }

  const handleDownload = () => {
    window.open(downloadUrl, '_blank')
  }

  const handlePreview = () => {
    setShowPreview(true)
  }

  const handleShare = async () => {
    try {
      const res = await axios.post(
        `${API}/files/${file.fileId}/share`,
        { expiresIn: 3600 },
        { headers: { Authorization: `Bearer ${token}` } }
      )
      setShareUrl(window.location.origin + res.data.shareUrl)
      setShowShare(true)
    } catch (e) {
      alert('Share failed: ' + (e.response?.data?.detail || e.message))
    }
  }

  const handleCopyShareUrl = () => {
    navigator.clipboard.writeText(shareUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleRename = async () => {
  if (!newFileName.trim()) return

  try {
    await axios.put(
      `${API}/files/${file.fileId}/rename`,
      {
        newName: newFileName
      },
      {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    )

    setShowRename(false)
    onFileDelete() // refresh files list
  } catch (e) {
    alert('Rename failed: ' + (e.response?.data?.detail || e.message))
  }
}

const handleInsights = async () => {
  try {
    const res = await axios.get(
      `${API}/files/${file.fileId}/metadata`,
      {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    )

    setMetadata(res.data)
    setShowInsights(true)

  } catch (e) {
    alert(
      'Failed to load AI insights: ' +
      (e.response?.data?.detail || e.message)
    )
  }
}

const handleDragStart = (e) => {
   console.log("Dragging:", file.fileId)
  e.dataTransfer.setData(
    'fileId',
    file.fileId
  )
}

  const canPreview =
    file.mimeType?.startsWith('image/') ||
    file.mimeType?.includes('pdf') ||
    file.mimeType?.startsWith('text/')

  const PreviewModal = () => (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-5xl max-h-[90vh] overflow-hidden">
        <div className="flex justify-between items-center px-6 py-4 border-b">
          <div>
            <h3 className="text-lg font-bold text-slate-900">{file.fileName}</h3>
            <p className="text-sm text-slate-500">{formatFileSize(file.fileSize)}</p>
          </div>
          <button
            onClick={() => setShowPreview(false)}
            className="px-4 py-2 bg-slate-100 rounded-xl hover:bg-slate-200"
          >
            Close
          </button>
        </div>

        <div className="p-4 bg-slate-100 h-[75vh] flex items-center justify-center">
          {file.mimeType?.startsWith('image/') ? (
            <img
              src={previewUrl}
              alt={file.fileName}
              className="max-h-full max-w-full rounded-xl shadow"
            />
          ) : file.mimeType?.includes('pdf') ? (
            <iframe
              src={previewUrl}
              title={file.fileName}
              className="w-full h-full bg-white rounded-xl"
            />
          ) : (
            <iframe
              src={previewUrl}
              title={file.fileName}
              className="w-full h-full bg-white rounded-xl"
            />
          )}
        </div>
      </div>
    </div>
  )

  const ShareModal = () => (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl p-6 max-w-lg w-full shadow-xl">
        <h3 className="text-xl font-bold mb-2 text-slate-900">Share File</h3>
        <p className="text-sm text-slate-500 mb-4">This link expires in 1 hour.</p>

        <div className="flex gap-2">
          <input
            type="text"
            value={shareUrl}
            readOnly
            className="flex-1 px-4 py-3 border rounded-xl bg-slate-50 text-sm"
          />
          <button
            onClick={handleCopyShareUrl}
            className={`px-5 py-3 rounded-xl text-white ${
              copied ? 'bg-green-600' : 'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            {copied ? 'Copied' : 'Copy'}
          </button>
        </div>

        <button
          onClick={() => setShowShare(false)}
          className="w-full mt-5 px-4 py-3 bg-slate-100 text-slate-700 rounded-xl hover:bg-slate-200"
        >
          Close
        </button>
      </div>
    </div>
  )

  const InsightsModal = () => (
  <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
    <div className="bg-white rounded-2xl w-full max-w-2xl p-6">

      <div className="flex justify-between items-center mb-6">
        <h3 className="text-2xl font-bold">
          🤖 AI Insights
        </h3>

        <button
          onClick={() => setShowInsights(false)}
          className="px-4 py-2 bg-slate-100 rounded-xl"
        >
          Close
        </button>
      </div>

      <div className="space-y-5">

        <div>
          <h4 className="font-semibold text-lg mb-2">
            Summary
          </h4>

          <div className="bg-slate-50 rounded-xl p-4">
            {metadata?.metadata?.summary ||
              'No summary available'}
          </div>
        </div>

        <div>
          <h4 className="font-semibold text-lg mb-2">
            Keywords
          </h4>

          <div className="flex flex-wrap gap-2">
            {metadata?.metadata?.keywords?.map(
              (keyword, idx) => (
                <span
                  key={idx}
                  className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm"
                >
                  {keyword}
                </span>
              )
            )}
          </div>
        </div>

        <div>
          <h4 className="font-semibold text-lg mb-2">
            Status
          </h4>

          <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full">
            {metadata?.status}
          </span>
        </div>

      </div>
    </div>
  </div>
)

  const RenameModal = () => (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-2xl w-full max-w-md">
        <h3 className="text-xl font-bold mb-4">
          Rename File
        </h3>

        <input
          type="text"
          value={newFileName}
          onChange={(e) => setNewFileName(e.target.value)}
          className="w-full border rounded-xl px-4 py-3 mb-4"
        />

        <div className="flex gap-2">
          <button
            onClick={handleRename}
            className="flex-1 bg-blue-600 text-white py-3 rounded-xl"
          >
            Save
          </button>

          <button
            onClick={() => setShowRename(false)}
            className="flex-1 bg-gray-200 py-3 rounded-xl"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  )

  if (gridMode) {
    return (
      <>
        <div
          draggable
          onDragStart={handleDragStart}
          className="bg-white rounded-2xl shadow-sm hover:shadow-lg transition border border-slate-200 p-5 cursor-move">
          <button
            onClick={handlePreview}
            disabled={!canPreview}
            className="text-5xl mb-4 w-full text-center hover:scale-110 transition disabled:opacity-40"
          >
            {getFileIcon(file.mimeType)}
          </button>

          <h3 className="font-bold text-slate-900 truncate mb-1">{file.fileName}</h3>
          <p className="text-sm text-slate-500 mb-3">{formatFileSize(file.fileSize)}</p>

          <span className={`inline-block px-3 py-1 text-xs rounded-full mb-4 ${
            file.status === 'analyzed'
              ? 'bg-green-100 text-green-700'
              : 'bg-yellow-100 text-yellow-700'
          }`}>
            {file.status || 'uploaded'}
          </span>

          <div className="flex flex-col gap-2">
            <button
              onClick={handlePreview}
              disabled={!canPreview}
              className="px-3 py-2 text-sm bg-slate-100 text-slate-700 rounded-xl hover:bg-slate-200 disabled:opacity-40"
            >
              Preview
            </button>

            <button
              onClick={handleDownload}
              className="px-3 py-2 text-sm bg-blue-600 text-white rounded-xl hover:bg-blue-700"
            >
              Download
            </button>

            <button
              onClick={handleShare}
              className="px-3 py-2 text-sm bg-green-600 text-white rounded-xl hover:bg-green-700"
            >
              Share
            </button>

            <button
              onClick={handleDelete}
              disabled={loading}
              className="px-3 py-2 text-sm bg-red-600 text-white rounded-xl hover:bg-red-700 disabled:bg-gray-400"
            >
              Delete
            </button>

            <button
              onClick={() => setShowRename(true)}
              className="px-3 py-2 text-sm bg-purple-600 text-white rounded-xl hover:bg-purple-700"
            >
              Rename
            </button>
            <button
              onClick={handleInsights}
              className="px-3 py-2 text-sm bg-indigo-600 text-white rounded-xl hover:bg-indigo-700"
            >
              AI
            </button>
          </div>
        </div>

        {showPreview && <PreviewModal />}
        {showShare && <ShareModal />}
        {showRename && <RenameModal />}
        {showInsights && <InsightsModal />}
      </>
    )
  }

  return (
    <>
      <tr
        draggable
        onDragStart={handleDragStart}
        className="border-b hover:bg-slate-50 transition cursor-move">
        <td className="px-6 py-4 text-sm text-slate-900">
          <div className="flex items-center gap-3">
            <button
              onClick={handlePreview}
              disabled={!canPreview}
              className="text-xl hover:scale-110 transition disabled:opacity-40"
            >
              {getFileIcon(file.mimeType)}
            </button>
            <span className="truncate font-medium">{file.fileName}</span>
          </div>
        </td>

        <td className="px-6 py-4 text-sm text-slate-500">
          {formatFileSize(file.fileSize)}
        </td>

        <td className="px-6 py-4 text-sm">
          <span className={`inline-block px-3 py-1 text-xs rounded-full ${
            file.status === 'analyzed'
              ? 'bg-green-100 text-green-700'
              : 'bg-yellow-100 text-yellow-700'
          }`}>
            {file.status || 'uploaded'}
          </span>
        </td>

        <td className="px-6 py-4 text-sm text-slate-500">
          {new Date(file.uploadDate).toLocaleDateString()}
        </td>

        <td className="px-6 py-4 text-sm text-right">
          <div className="flex gap-3 justify-end">
            <button onClick={handlePreview} disabled={!canPreview} className="text-slate-600 hover:text-slate-900 disabled:opacity-40">
              Preview
            </button>
            <button onClick={handleDownload} className="text-blue-600 hover:text-blue-800 font-medium">
              Download
            </button>
            <button onClick={handleShare} className="text-green-600 hover:text-green-800 font-medium">
              Share
            </button>
            <button onClick={handleDelete} disabled={loading} className="text-red-600 hover:text-red-800 font-medium disabled:text-gray-400">
              Delete
            </button>
            <button
              onClick={() => setShowRename(true)}
              className="text-purple-600 hover:text-purple-800 font-medium"
            >
              Rename
            </button>
            <button
              onClick={handleInsights}
              className="text-indigo-600 hover:text-indigo-800 font-medium"
            >
              AI
            </button>
          </div>
        </td>
      </tr>

      {showPreview && <PreviewModal />}
      {showShare && <ShareModal />}
      {showRename && <RenameModal />}
      {showInsights && <InsightsModal />}
    </>
  )
}
