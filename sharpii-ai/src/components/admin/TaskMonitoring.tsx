'use client'

import React, { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Activity,
  Search,
  Filter,
  RefreshCw,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Eye,
  Trash2
} from 'lucide-react'
import { toast } from 'sonner'

interface TaskData {
  id: string
  user_id: string
  userEmail?: string
  image_id: string
  original_image_url: string
  enhanced_image_url?: string
  status: string
  progress: number
  model_id: string
  model_name?: string
  provider: string
  processing_time?: number
  credits_consumed?: number
  error_message?: string
  original_width?: number
  original_height?: number
  created_at: string
  completed_at?: string
  started_at?: string
}

interface TaskStats {
  total: number
  processing: number
  completed: number
  failed: number
  pending: number
  avgProcessingTime: number
  totalCreditsConsumed: number
}

export function TaskMonitoring() {
  const [tasks, setTasks] = useState<TaskData[]>([])
  const [stats, setStats] = useState<TaskStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [modelFilter, setModelFilter] = useState('all')
  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => {
    loadTasks()
    loadStats()

    // Auto-refresh every 30 seconds
    const interval = setInterval(() => {
      loadTasks()
      loadStats()
    }, 30000)

    return () => clearInterval(interval)
  }, [])

  const loadTasks = async () => {
    try {
      const response = await fetch('/api/admin/tasks')
      if (!response.ok) throw new Error('Failed to load tasks')

      const data = await response.json()
      setTasks(data.tasks || [])
    } catch (error) {
      console.error('Error loading tasks:', error)
      toast.error('Failed to load tasks')
    } finally {
      setLoading(false)
    }
  }

  const loadStats = async () => {
    try {
      const response = await fetch('/api/admin/task-stats')
      if (!response.ok) throw new Error('Failed to load stats')

      const data = await response.json()
      setStats(data.stats)
    } catch (error) {
      console.error('Error loading task stats:', error)
    }
  }

  const refreshData = async () => {
    setRefreshing(true)
    await Promise.all([loadTasks(), loadStats()])
    setRefreshing(false)
    toast.success('Task data refreshed')
  }

  const retryTask = async (taskId: string) => {
    try {
      const response = await fetch('/api/admin/retry-task', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ taskId })
      })

      if (!response.ok) throw new Error('Failed to retry task')

      toast.success('Task retry initiated')
      loadTasks()
    } catch (error) {
      console.error('Error retrying task:', error)
      toast.error('Failed to retry task')
    }
  }

  const cancelTask = async (taskId: string) => {
    try {
      const response = await fetch('/api/admin/cancel-task', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ taskId })
      })

      if (!response.ok) throw new Error('Failed to cancel task')

      toast.success('Task cancelled')
      loadTasks()
    } catch (error) {
      console.error('Error cancelling task:', error)
      toast.error('Failed to cancel task')
    }
  }

  const deleteTask = async (taskId: string) => {
    if (!confirm('Are you sure you want to delete this task? This action cannot be undone.')) {
      return
    }

    try {
      const response = await fetch('/api/admin/delete-task', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ taskId })
      })

      if (!response.ok) throw new Error('Failed to delete task')

      toast.success('Task deleted')
      loadTasks()
    } catch (error) {
      console.error('Error deleting task:', error)
      toast.error('Failed to delete task')
    }
  }

  const filteredTasks = tasks.filter(task => {
    const matchesSearch = task.userEmail?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         task.model_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         task.id.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'all' || task.status === statusFilter
    const matchesModel = modelFilter === 'all' || task.model_id === modelFilter

    return matchesSearch && matchesStatus && matchesModel
  })

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed': return <CheckCircle className="w-4 h-4 text-green-500" />
      case 'failed': return <XCircle className="w-4 h-4 text-red-500" />
      case 'processing': return <Clock className="w-4 h-4 text-blue-500 animate-pulse" />
      case 'pending': return <AlertCircle className="w-4 h-4 text-yellow-500" />
      default: return <Clock className="w-4 h-4 text-gray-500" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed': return 'bg-green-500/20 text-green-300 border-green-500/30'
      case 'failed': return 'bg-red-500/20 text-red-300 border-red-500/30'
      case 'processing': return 'bg-blue-500/20 text-blue-300 border-blue-500/30'
      case 'pending': return 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30'
      default: return 'bg-gray-500/20 text-gray-300 border-gray-500/30'
    }
  }

  const formatDuration = (seconds: number | null) => {
    if (!seconds) return 'N/A'
    if (seconds < 60) return `${seconds}s`
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}m ${remainingSeconds}s`
  }

  return (
    <div className="space-y-6">
      <Card className="p-6 bg-gray-900/50 border-gray-700">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Activity className="w-6 h-6 text-blue-500" />
            <div>
              <h2 className="text-xl font-bold text-white">Task Monitoring</h2>
              <p className="text-sm text-gray-400">Monitor and manage image processing tasks</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" onClick={refreshData} disabled={refreshing}>
              <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </div>

        {/* Task Stats */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="p-4 bg-gray-800/50 rounded-lg border border-gray-600">
              <div className="flex items-center justify-between">
                <span className="text-gray-400">Total Tasks</span>
                <span className="text-white font-bold">{stats.total.toLocaleString()}</span>
              </div>
            </div>
            <div className="p-4 bg-gray-800/50 rounded-lg border border-gray-600">
              <div className="flex items-center justify-between">
                <span className="text-gray-400">Processing</span>
                <span className="text-blue-400 font-bold">{stats.processing}</span>
              </div>
            </div>
            <div className="p-4 bg-gray-800/50 rounded-lg border border-gray-600">
              <div className="flex items-center justify-between">
                <span className="text-gray-400">Completed</span>
                <span className="text-green-400 font-bold">{stats.completed.toLocaleString()}</span>
              </div>
            </div>
            <div className="p-4 bg-gray-800/50 rounded-lg border border-gray-600">
              <div className="flex items-center justify-between">
                <span className="text-gray-400">Failed</span>
                <span className="text-red-400 font-bold">{stats.failed}</span>
              </div>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="flex gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
            <Input
              placeholder="Search by task ID, user email, or model..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-gray-800 border-gray-600 text-white"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-40 bg-gray-800 border-gray-600">
              <Filter className="w-4 h-4 mr-2" />
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="processing">Processing</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="failed">Failed</SelectItem>
            </SelectContent>
          </Select>
          <Select value={modelFilter} onValueChange={setModelFilter}>
            <SelectTrigger className="w-48 bg-gray-800 border-gray-600">
              <SelectValue placeholder="Model" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Models</SelectItem>
              <SelectItem value="fermatresearch/magic-image-refiner">Magic Refiner</SelectItem>
              <SelectItem value="nightmareai/real-esrgan">Real-ESRGAN</SelectItem>
              <SelectItem value="runninghub-flux-upscaling">FLUX Upscaling</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Tasks Table */}
        <div className="rounded-lg border border-gray-700 overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-800/50">
                <TableHead className="text-white">Task</TableHead>
                <TableHead className="text-white">User</TableHead>
                <TableHead className="text-white">Model</TableHead>
                <TableHead className="text-white">Status</TableHead>
                <TableHead className="text-white">Progress</TableHead>
                <TableHead className="text-white">Duration</TableHead>
                <TableHead className="text-white">Credits</TableHead>
                <TableHead className="text-white">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center text-gray-400 py-8">
                    Loading tasks...
                  </TableCell>
                </TableRow>
              ) : filteredTasks.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center text-gray-400 py-8">
                    No tasks found
                  </TableCell>
                </TableRow>
              ) : (
                filteredTasks.map((task) => (
                  <TableRow key={task.id} className="border-gray-700">
                    <TableCell>
                      <div>
                        <p className="text-white font-mono text-sm">{task.id.slice(0, 8)}...</p>
                        <p className="text-gray-400 text-xs">
                          {new Date(task.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell className="text-white">
                      {task.userEmail || `${task.user_id.slice(0, 8)}...`}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-purple-400 border-purple-400/30">
                        {task.model_name || task.model_id.split('/').pop()}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getStatusIcon(task.status)}
                        <Badge className={getStatusColor(task.status)}>
                          {task.status}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="w-16">
                        <div className="flex items-center justify-between text-xs text-gray-400 mb-1">
                          <span>{task.progress}%</span>
                        </div>
                        <div className="w-full bg-gray-700 rounded-full h-1">
                          <div
                            className="bg-blue-500 h-1 rounded-full transition-all duration-300"
                            style={{ width: `${task.progress}%` }}
                          />
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-white">
                      {formatDuration(task.processing_time)}
                    </TableCell>
                    <TableCell className="text-white">
                      {task.credits_consumed?.toLocaleString() || 'N/A'}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button size="sm" variant="outline" onClick={() => window.open(task.original_image_url, '_blank')}>
                          <Eye className="w-3 h-3" />
                        </Button>
                        {task.status === 'failed' && (
                          <Button size="sm" variant="outline" onClick={() => retryTask(task.id)}>
                            <RefreshCw className="w-3 h-3" />
                          </Button>
                        )}
                        {task.status === 'processing' && (
                          <Button size="sm" variant="outline" onClick={() => cancelTask(task.id)}>
                            <XCircle className="w-3 h-3" />
                          </Button>
                        )}
                        <Button size="sm" variant="outline" onClick={() => deleteTask(task.id)}>
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </Card>
    </div>
  )
}